import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // Menghubungkan ke API Anda
import { 
  LayoutDashboard, Package, ShoppingCart, BarChart3, 
  MessageSquare, Image as ImageIcon, Settings, Printer, 
  Truck, Plus, Trash2, Save, Send, Eye
} from 'lucide-react';

// --- MAIN COMPONENT ---
export default function Admin() {
  const [view, setView] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* SIDEBAR LUXURY DESIGN */}
      <aside className="w-72 bg-slate-900 text-white p-8 flex flex-col shadow-2xl">
        <div className="mb-12">
          <h1 className="text-3xl font-black tracking-tighter text-blue-400 italic">ZYHA ID</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mt-1">Management System v1.0</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <SidebarLink icon={<LayoutDashboard size={20}/>} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarLink icon={<Package size={20}/>} label="Produk & Kategori" active={view === 'products'} onClick={() => setView('products')} />
          <SidebarLink icon={<ShoppingCart size={20}/>} label="Pesanan" active={view === 'orders'} onClick={() => setView('orders')} />
          <SidebarLink icon={<BarChart3 size={20}/>} label="Analitik Lengkap" active={view === 'analytics'} onClick={() => setView('analytics')} />
          <SidebarLink icon={<MessageSquare size={20}/>} label="WA Gateway" active={view === 'wa'} onClick={() => setView('wa')} />
          <SidebarLink icon={<ImageIcon size={20}/>} label="Banner Promo" active={view === 'banner'} onClick={() => setView('banner')} />
          <SidebarLink icon={<Settings size={20}/>} label="Pengaturan" active={view === 'settings'} onClick={() => setView('settings')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="bg-slate-800 p-4 rounded-xl flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">A</div>
            <div>
              <p className="font-bold">Super Admin</p>
              <p className="text-xs text-slate-500">Online</p>
            </div>
          </div>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-10">
        {view === 'dashboard' && <DashboardSection />}
        {view === 'products' && <ProductSection />}
        {view === 'orders' && <OrderSection />}
        {view === 'analytics' && <AnalyticsSection />}
        {view === 'wa' && <WAGatewaySection />}
        {view === 'settings' && <SettingsSection />}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function DashboardSection() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Pendapatan" value="Rp 128.450.000" growth="+15%" color="bg-blue-600" />
        <StatCard title="Pesanan Baru" value="24" growth="Hari ini" color="bg-emerald-600" />
        <StatCard title="Stok Menipis" value="5" growth="Perlu restok" color="bg-orange-600" />
        <StatCard title="Visitor Real-time" value="1,204" growth="+5%" color="bg-indigo-600" />
      </div>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-96 flex items-center justify-center italic text-slate-400 text-lg">
        Grafik Chart.js akan muncul di sini (Data Real-time dari Supabase)
      </div>
    </div>
  );
}

function ProductSection() {
  // Logic untuk upload ke database Anda
  const [productData, setProductData] = useState({ title: '', price: 0, description: '' });
  
  const handleUpload = async () => {
    const { error } = await supabase.from('products').insert([productData]);
    if (error) alert(error.message); else alert("Produk Terupload ke Supabase!");
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Produk & Kategori</h2>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">
          <Plus size={20}/> Tambah Produk Baru
        </button>
      </div>
      
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 grid grid-cols-2 gap-10">
        <div className="space-y-4">
           <label className="block text-sm font-bold text-slate-700">Upload Foto Produk (Maks 5)</label>
           <div className="grid grid-cols-5 gap-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="aspect-square bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-200">
                  <Plus size={16} className="text-slate-400"/>
                </div>
              ))}
           </div>
           <input type="text" placeholder="Judul Produk" className="w-full p-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" onChange={(e)=>setProductData({...productData, title: e.target.value})} />
           <textarea placeholder="Deskripsi Lengkap Produk..." className="w-full p-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 h-40 outline-none" onChange={(e)=>setProductData({...productData, description: e.target.value})}></textarea>
        </div>
        <div className="space-y-4">
           <select className="w-full p-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 outline-none">
              <option>Pilih Kategori Lengkap</option>
              <option>Sepatu Pria</option>
              <option>Pakaian Wanita</option>
              <option>Aksesoris Premium</option>
           </select>
           <input type="number" placeholder="Harga (Rp)" className="w-full p-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 outline-none" onChange={(e)=>setProductData({...productData, price: parseInt(e.target.value)})} />
           <input type="number" placeholder="Berat (Gram) - Untuk Ongkir" className="w-full p-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 outline-none" />
           <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <input type="checkbox" className="w-5 h-5" id="bestseller" />
              <label htmlFor="bestseller" className="font-bold text-blue-800 uppercase text-xs tracking-wider">Tandai Sebagai Best Seller</label>
           </div>
           <button onClick={handleUpload} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-lg hover:bg-black transition-all">UPLOAD PRODUK KE DATABASE</button>
        </div>
      </div>
    </div>
  );
}

function OrderSection() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    // REALTIME SUBSCRIPTION UNTUK PESANAN
    const fetchAndSubscribe = async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data) setOrders(data);

      supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        // Update state secara realtime jika ada data masuk
        if (payload.eventType === 'INSERT') setOrders(prev => [payload.new, ...prev]);
      }).subscribe();
    };
    fetchAndSubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold italic">Daftar Pesanan & Logistik</h2>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="p-6">Informasi Pembeli</th>
              <th className="p-6">Produk</th>
              <th className="p-6">Ekspedisi</th>
              <th className="p-6">Status Real-time</th>
              <th className="p-6 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Map data dari Supabase Anda */}
            {orders.length > 0 ? orders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-6">
                  <p className="font-black text-slate-800">{order.customer_name}</p>
                  <p className="text-xs text-slate-500">{order.full_address}</p>
                  <p className="text-xs font-bold text-blue-600">{order.customer_phone}</p>
                </td>
                <td className="p-6 font-medium italic">Produk dari JSONB</td>
                <td className="p-6">
                  <div className="flex items-center gap-2 font-bold text-red-600 italic">
                     <Truck size={18}/> {order.courier_name || 'J&T Express'}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Automatic Tracking Active</p>
                </td>
                <td className="p-6">
                  <span className="bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">{order.status}</span>
                </td>
                <td className="p-6 text-center">
                  <button className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 flex items-center gap-2 text-xs font-bold" onClick={() => alert('Integrasi Resi Automatis')}>
                    <Send size={14}/> PROSES & RESI
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="p-10 text-center italic text-slate-400">Menunggu data pesanan masuk secara realtime...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsSection() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold uppercase tracking-tight">Analitik Bisnis Lengkap</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <p className="text-slate-400 text-xs font-bold uppercase mb-2">Konversi Checkout</p>
          <p className="text-4xl font-black">68.4%</p>
          <div className="w-full bg-slate-100 h-2 mt-4 rounded-full overflow-hidden">
             <div className="bg-blue-500 h-full w-[68%]"></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <p className="text-slate-400 text-xs font-bold uppercase mb-2">Rata-rata Order Value</p>
          <p className="text-4xl font-black text-emerald-600">Rp 450rb</p>
        </div>
      </div>
    </div>
  );
}

function WAGatewaySection() {
  return (
    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-emerald-100">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-4 bg-emerald-500 text-white rounded-2xl"><MessageSquare size={32}/></div>
        <div>
          <h2 className="text-2xl font-bold italic">WhatsApp Gateway</h2>
          <p className="text-slate-500">Kirim notifikasi otomatis (Resi & Pembayaran) via WA</p>
        </div>
      </div>
      <div className="p-6 bg-slate-900 text-white rounded-3xl font-mono text-sm">
        <p className="text-emerald-400 underline mb-2 tracking-widest uppercase">Koneksi API (Fonnte/Wootalk)</p>
        <p>// Status: Terhubung</p>
        <p>// Device ID: ZYHA-ID-SERVER-01</p>
      </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-3xl font-bold mb-8 italic">Pengaturan Global</h2>
      <div className="space-y-6">
         <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-4">Integrasi Payment Gateway (Midtrans/Xendit)</h3>
            <input type="text" placeholder="Server Key" className="w-full p-4 bg-slate-50 rounded-xl outline-none ring-1 ring-slate-100" />
            <div className="flex gap-4">
              <button className="flex-1 bg-blue-600 text-white p-4 rounded-xl font-bold">Simpan Kunci API</button>
            </div>
         </div>
      </div>
    </div>
  );
}

// --- UTILS ---
function SidebarLink({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      {icon} <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, growth, color }: any) {
  return (
    <div className={`${color} p-8 rounded-[2rem] text-white shadow-lg relative overflow-hidden`}>
      <div className="absolute top-[-10%] right-[-5%] opacity-10 rotate-12 text-9xl font-black uppercase tracking-tighter">{title[0]}</div>
      <p className="text-xs uppercase font-bold opacity-80 tracking-widest">{title}</p>
      <h4 className="text-2xl font-black mt-2">{value}</h4>
      <p className="text-[10px] mt-2 font-bold bg-white/20 w-fit px-2 py-1 rounded-lg">{growth}</p>
    </div>
  );
}
