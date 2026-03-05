import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MIDTRANS_SERVER_KEY = "Mid-server-L6Qe9iDsTNCrTZV1nOrl3b0z"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()

    // --- LOGIKA 1: WEBHOOK (NOTIFIKASI DARI MIDTRANS) ---
    // Jika ada properti 'transaction_status', berarti ini data dari Midtrans
    if (body.transaction_status) {
      const orderId = body.order_id
      const status = body.transaction_status

      console.log(`Menerima notifikasi untuk Order: ${orderId} dengan status: ${status}`)

      if (status === 'settlement' || status === 'capture') {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', orderId)
        
        if (error) console.error("Gagal update database:", error)
      }

      return new Response(JSON.stringify({ message: "Notification handled" }), { status: 200 })
    }

    // --- LOGIKA 2: PEMBUATAN TRANSAKSI (DARI APP) ---
    const { orderId, grossAmount, customerDetails } = body

    const payload = {
      transaction_details: { order_id: orderId, gross_amount: grossAmount },
      customer_details: {
        first_name: customerDetails?.first_name || "Guest",
        phone: customerDetails?.phone || "",
        billing_address: { address: customerDetails?.address || "" }
      }
    }

    const response = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${btoa(MIDTRANS_SERVER_KEY + ":")}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    return new Response(JSON.stringify(data), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: 200 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: 400 
    })
  }
})
