import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })
const digest = async (algorithm: string, value: string) => Array.from(new Uint8Array(await crypto.subtle.digest(algorithm, new TextEncoder().encode(value)))).map(b => b.toString(16).padStart(2, '0')).join('')
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max

serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    const raw = await req.text()
    if (raw.length > 65536) return json({ error: 'Request too large' }, 413)
    const body = JSON.parse(raw)
    if (!body || typeof body !== 'object') return json({ error: 'Invalid request' }, 400)
    const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
    const environment = Deno.env.get('MIDTRANS_ENVIRONMENT') || 'sandbox'
    if (!['sandbox', 'production'].includes(environment)) return json({ error: 'Invalid payment environment configuration' }, 503)
    const providerHeaders = { Authorization: `Basic ${btoa((serverKey || '') + ':')}`, 'Content-Type': 'application/json', Accept: 'application/json' }
    const apiBase = environment === 'production' ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com'

    if (body.transaction_status || body.action === 'midtrans-webhook') {
      if (!serverKey) return json({ error: 'Payment provider is not configured' }, 503)
      if (!text(body.order_id, 100) || !text(body.signature_key, 128)) return json({ error: 'Invalid notification' }, 400)
      const signature = await digest('SHA-512', `${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`)
      if (signature !== body.signature_key) return json({ error: 'Invalid signature' }, 401)
      // The notification signature does not cover transaction_status; fetch authoritative status.
      const response = await fetch(`${apiBase}/v2/${encodeURIComponent(body.order_id)}/status`, { headers: providerHeaders, signal: AbortSignal.timeout(15000) })
      if (!response.ok) return json({ error: 'Payment verification unavailable' }, 502)
      const verified = await response.json()
      if (verified.order_id !== body.order_id || !Number.isFinite(Number(verified.gross_amount))) return json({ error: 'Invalid verification response' }, 502)
      const { data: order, error } = await db.from('orders').select('id,total_price,status,paid_at').eq('midtrans_order_id', verified.order_id).single()
      if (error || !order) return json({ error: 'Order not found' }, 404)
      if (Number(verified.gross_amount) !== Number(order.total_price)) return json({ error: 'Amount mismatch' }, 409)
      const statuses: Record<string, string> = { settlement: 'paid', pending: 'pending', deny: 'failed', cancel: 'cancelled', expire: 'expired', failure: 'failed', refund: 'refunded' }
      const next = verified.transaction_status === 'capture'
        ? (verified.fraud_status === 'accept' ? 'paid' : verified.fraud_status === 'deny' ? 'failed' : 'pending')
        : statuses[verified.transaction_status]
      if (!next) return json({ message: 'No supported status transition' })
      if (order.status === 'refunded' || (order.status === 'paid' && !['paid', 'refunded'].includes(next))) return json({ message: 'Already finalized' })
      const { error: updateError } = await db.from('orders').update({ status: next, midtrans_transaction_id: verified.transaction_id || null, paid_at: next === 'paid' ? order.paid_at || new Date().toISOString() : order.paid_at }).eq('id', order.id).eq('status', order.status)
      if (updateError) return json({ error: 'Could not persist payment status; retry notification' }, 500)
      return json({ message: 'Notification handled' })
    }

    const { action, customer, items, checkout_key, payment_method_id } = body
    if (!['manual-checkout', 'create-snap'].includes(action) || !uuid.test(checkout_key || '') || !uuid.test(payment_method_id || '')) return json({ error: 'Invalid checkout request' }, 400)
    if (!Array.isArray(items) || items.length < 1 || items.length > 100) return json({ error: 'Cart must contain 1 to 100 items' }, 400)
    if (!text(customer?.name, 150) || !text(customer?.address, 1000) || !text(customer?.phone, 30) || !/^[+\d\s()-]{7,30}$/.test(customer.phone)) return json({ error: 'Invalid customer details' }, 400)
    for (const item of items) {
      if (!item || !uuid.test(item.product_id || '') || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100 || (item.variant != null && (typeof item.variant !== 'string' || item.variant.length > 150))) return json({ error: 'Invalid cart item' }, 400)
    }
    const normalized = { action, payment_method_id, customer: { name: customer.name.trim(), address: customer.address.trim(), phone: customer.phone.trim() }, items: items.map(item => ({ product_id: item.product_id, quantity: item.quantity, variant: item.variant || null })) }
    const hash = await digest('SHA-256', JSON.stringify(normalized))
    const { data: existing, error: existingError } = await db.from('orders').select('id,total_price,status,checkout_key,request_hash,midtrans_order_id,snap_token,snap_redirect_url').eq('checkout_key', checkout_key).maybeSingle()
    if (existingError) throw existingError
    if (existing && existing.request_hash !== hash) return json({ error: 'Checkout key already used for different details' }, 409)
    let order = existing
    if (!order) {
      const { data: method, error: methodError } = await db.from('payment_methods').select('id,name,type').eq('id', payment_method_id).eq('is_active', true).single()
      if (methodError || !method || (method.type === 'Midtrans') !== (action === 'create-snap')) return json({ error: 'Payment method unavailable' }, 400)
      if (action === 'create-snap') {
        if (!serverKey) return json({ error: 'Payment provider is not configured' }, 503)
        const { data: settings, error: settingsError } = await db.from('settings').select('midtrans_environment,midtrans_client_key').eq('id', 1).single()
        if (settingsError || settings?.midtrans_environment !== environment || !settings?.midtrans_client_key) return json({ error: 'Payment configuration mismatch' }, 503)
      }
      const { data: products, error: productsError } = await db.from('products').select('id,title,price,variants').in('id', items.map(item => item.product_id)).eq('is_active', true)
      if (productsError) throw productsError
      const snapshots = []
      for (const item of normalized.items) {
        const product = products?.find(product => product.id === item.product_id)
        if (!product || !Number.isSafeInteger(product.price) || product.price <= 0) return json({ error: 'Product unavailable or price invalid' }, 400)
        const variants = Array.isArray(product.variants) ? product.variants : []
        if ((variants.length && !variants.some(v => v.name === item.variant)) || (!variants.length && item.variant)) return json({ error: 'Product variant unavailable' }, 400)
        snapshots.push({ ...item, title: product.title, price: product.price, selectedVariant: item.variant || '' })
      }
      const total = snapshots.reduce((sum, item) => sum + item.price * item.quantity, 0)
      if (!Number.isSafeInteger(total) || total <= 0 || total > 2147483647) return json({ error: 'Order total outside supported range' }, 400)
      const { data: claimed, error: claimError } = await db.rpc('claim_checkout', { p_key: checkout_key, p_hash: hash, p_order: { customer_name: normalized.customer.name, customer_address: normalized.customer.address, customer_phone: normalized.customer.phone, items: snapshots, total_price: total, payment_method: method.type === 'Midtrans' ? 'Midtrans' : method.name, midtrans_order_id: action === 'create-snap' ? `ZYHA-${checkout_key}` : null } })
      if (claimError) throw claimError
      order = claimed.order
    }
    if (!order) throw new Error('Order creation failed')
    if (action === 'manual-checkout') return json({ order_id: order.id, total_price: order.total_price })
    if (!serverKey) return json({ error: 'Payment provider is not configured' }, 503)
    if (order.status !== 'pending') return json({ error: `Order is ${order.status}; check payment status before creating another order` }, 409)
    if (order.snap_token) return json({ order_id: order.id, token: order.snap_token, redirect_url: order.snap_redirect_url })
    const { data: acquired, error: lockError } = await db.rpc('claim_payment', { p_id: order.id })
    if (lockError) throw lockError
    if (!acquired) return json({ error: 'Payment is being prepared or needs reconciliation. Retry later with the same checkout.' }, 409)
    // A timeout can mean the provider accepted the request. Keep the claim in that case;
    // never create a second transaction automatically after an ambiguous result.
    const snapUrl = environment === 'production' ? 'https://app.midtrans.com/snap/v1/transactions' : 'https://app.sandbox.midtrans.com/snap/v1/transactions'
    const response = await fetch(snapUrl, { method: 'POST', headers: providerHeaders, signal: AbortSignal.timeout(20000), body: JSON.stringify({ transaction_details: { order_id: order.midtrans_order_id, gross_amount: order.total_price }, customer_details: { first_name: normalized.customer.name, phone: normalized.customer.phone, billing_address: { address: normalized.customer.address } } }) })
    const snap = await response.json()
    if (!response.ok || !text(snap.token, 500)) {
      return json({ error: 'Payment provider rejected the request. Contact the store with your checkout reference.', checkout_key }, 502)
    }
    const { error: saved } = await db.from('orders').update({ snap_token: snap.token, snap_redirect_url: snap.redirect_url || null }).eq('id', order.id)
    if (saved) return json({ error: 'Payment created but could not be saved. Contact the store; do not create another checkout.', checkout_key }, 500)
    return json({ order_id: order.id, total_price: order.total_price, token: snap.token, redirect_url: snap.redirect_url })
  } catch (error) {
    console.error('Checkout processing failed', error instanceof Error ? error.name : 'Database error')
    return json({ error: 'Checkout could not be completed. Retry using the same checkout reference.' }, 500)
  }
})
