import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { RefreshCcw } from 'lucide-react';

export function DashboardSection() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: o, error: orderError } = await supabase.from('orders').select('total_price,status').eq('status', 'paid');
        if (orderError) throw orderError;
        const { count: p, error: productError } = await supabase.from('products').select('id', { count: 'exact', head: true });
        if (productError) throw productError;
        const totalRev = o?.reduce((acc, curr) => acc + (curr.total_price || 0), 0) || 0;
        setStats({ revenue: totalRev, orders: o?.length || 0, products: p || 0 });
      } catch (error: any) {
        setError(error.message || 'Gagal memuat statistik.');
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold mb-8 italic">Dashboard Overview</h2>
      {error && <p className="mb-4 text-sm text-red-600 font-bold">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title="Total Pendapatan" value={`Rp ${stats.revenue.toLocaleString()}`} growth="Paid Only" color="bg-blue-600" />
        <StatCard title="Total Pesanan" value={stats.orders.toString()} growth="Semua Waktu" color="bg-emerald-600" />
        <StatCard title="Total Produk" value={stats.products.toString()} growth="Live" color="bg-slate-900" />
      </div>
      <div className="bg-white p-10 rounded-[3rem] border shadow-sm h-64 flex flex-col items-center justify-center text-center">
        <RefreshCcw className="mb-4 text-blue-500 animate-spin-slow" size={40} />
        <p className="text-slate-400 font-medium">Grafik analitik masih placeholder; pendapatan dihitung dari pesanan paid aktual.</p>
      </div>
    </div>
  );
}

function StatCard({ title, value, growth, color }: any) {
  return (
    <div className={`${color} p-8 rounded-[2rem] text-white shadow-lg relative overflow-hidden group`}>
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform"></div>
      <p className="text-xs uppercase font-bold opacity-80">{title}</p>
      <h4 className="text-3xl font-black mt-2">{value}</h4>
      <p className="text-[10px] mt-2 font-bold bg-white/20 w-fit px-2 py-1 rounded-lg">{growth}</p>
    </div>
  );
}
