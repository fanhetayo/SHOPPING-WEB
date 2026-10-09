import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { ORDER_STATUSES, isMidtransOrder, getItemVariant, getItemQuantity, getOrderAddress } from '../../shared/adminUtils';

export function OrderSection() {
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.from('orders').select('id,customer_name,customer_address,customer_phone,items,total_price,payment_method,status,created_at').order('created_at', {ascending: false});
      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      setError(error.message || 'Gagal memuat pesanan.');
    }
  };

  useEffect(() => {
    fetchOrders();
    const sub = supabase.channel('orders-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold italic">Manajemen Pesanan</h2>
      {error && <p className="text-sm text-red-600 font-bold">{error}</p>}
      <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white text-xs uppercase font-bold">
            <tr><th className="p-6">ID / Waktu</th><th className="p-6">Pembeli</th><th className="p-6">Produk</th><th className="p-6">Total</th><th className="p-6">Status</th></tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic">Belum ada pesanan masuk.</td></tr>
            ) : (
              orders.map(o => (
                <tr key={o.id} className="border-b hover:bg-slate-50">
                  <td className="p-6 text-[10px] text-slate-400">#{o.id.slice(-8)}<br/>{new Date(o.created_at).toLocaleString()}</td>
                  <td className="p-6 font-bold">{o.customer_name}<br/><span className="text-[10px] font-normal">{o.customer_phone}</span><br/><span className="text-[10px] font-normal text-slate-500">{getOrderAddress(o)}</span></td>
                  <td className="p-6 text-sm">
                    {Array.isArray(o.items) ? o.items.map((it:any) => `${it.title} (${getItemVariant(it)}) x${getItemQuantity(it)}`).join(', ') : 'No items'}
                  </td>
                  <td className="p-6 font-black text-blue-600">Rp {o.total_price?.toLocaleString()}</td>
                  <td className="p-6">
                    <select
                        value={o.status || 'pending'}
                        disabled={isMidtransOrder(o)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase outline-none disabled:opacity-60 ${o.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}
                        onChange={async (e) => {
                            const { error } = await supabase.from('orders').update({status: e.target.value}).eq('id', o.id);
                            if (error) { setError(error.message); return; }
                            fetchOrders();
                        }}
                    >
                        {ORDER_STATUSES.map(status => <option key={status} value={status}>{status.toUpperCase()}</option>)}
                    </select>
                    {isMidtransOrder(o) && <p className="mt-1 text-[10px] text-slate-400">Status Midtrans terkunci.</p>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
