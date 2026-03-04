import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
// PERBAIKAN: Mengubah 'lucide-center' menjadi 'lucide-react'
import { 
  LayoutDashboard, Package, ShoppingCart, BarChart3, 
  MessageSquare, Image as ImageIcon, Settings, 
  Truck, Plus, Trash2, Send, Edit, Landmark, QrCode, Save, RefreshCcw, Bell, Globe, Shield
} from 'lucide-react';

export default function Admin() {
  const [view, setView] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside className="w-72 bg-slate-900 text-white p-8 flex flex-col shadow-2xl sticky top-0 h-screen">
        <div className="mb-12">
          <h1 className="text-3xl font-black tracking-tighter text-blue-400 italic">ZYHA ID</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mt-1">Management System v1.0</p>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto">
          <SidebarLink icon={<LayoutDashboard size={20}/>} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarLink icon={<Package size={20}/>} label="Produk & Katalog" active={view === 'products'} onClick={() => setView('products')} />
          <SidebarLink icon={<Landmark size={20}/>} label="Metode Bayar" active={view === 'banks'} onClick={() => setView('banks')} />
          <SidebarLink icon={<ShoppingCart size={20}/>} label="Pesanan" active={view === 'orders'} onClick={() => setView('orders')} />
          <SidebarLink icon={<BarChart3 size={20}/>} label="Analitik" active={view === 'analytics'} onClick={() => setView('analytics')} />
          <SidebarLink icon={<MessageSquare size={20}/>} label="WA Gateway" active={view === 'wa'} onClick={() => setView('wa')} />
          <SidebarLink icon={<Settings size={20}/>} label="Pengaturan" active={view === 'settings'} onClick={() => setView('settings')} />
        </nav>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        {view === 'dashboard' && <DashboardSection />}
        {view === 'products' && <ProductSection />}
        {view === 'banks' && <BankSection />}
        {view === 'orders' && <OrderSection />}
        {view === 'analytics' && <AnalyticsSection />}
        {view === 'wa' && <WAGatewaySection />}
        {view === 'settings' && <SettingsSection />}
      </main>
    </div>
  );
}

// --- SECTIONS ---

function DashboardSection() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0 });
  
  useEffect(() => {
    const fetchStats = async () => {
      const { data: o } = await supabase.from('orders').select('total_price');
      const { count: p } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const totalRev = o?.reduce((acc, curr) => acc + (curr.total_price || 0), 0) || 0;
      setStats({ revenue: totalRev, orders: o?.length || 0, products: p || 0 });
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold mb-8 italic">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title="Total Pendapatan" value={`Rp ${stats.revenue.toLocaleString()}`} growth="+15%" color="bg-blue-600" />
        <StatCard title="Total Pesanan" value={stats.orders.toString()} growth="Semua Waktu" color="bg-emerald-600" />
        <StatCard title="Total Produk" value={stats.products.toString()} growth="Live" color="bg-slate-900" />
      </div>
      <div className="bg-white p-10 rounded-[3rem] border shadow-sm h-64 flex flex-col items-center justify-center text-center">
        <RefreshCcw className="mb-4 text-blue-500 animate-spin-slow" size={40} />
        <p className="text-slate-400 font-medium">Sistem tersinkronisasi otomatis dengan Database Supabase.</p>
      </div>
    </div>
  );
}

function ProductSection() {
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState({ title: '', price: 0, description: '', category: '', image_url: '' });

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleUploadImage = async (file: any) => {
    try {
      setLoading(true);
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('products').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
      setProductData({ ...productData, image_url: publicUrl });
      alert("Gambar Berhasil Diunggah!");
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!productData.title || !productData.price) return alert("Isi data produk!");
    if (editingId) {
      await supabase.from('products').update(productData).eq('id', editingId);
      setEditingId(null);
    } else {
      await supabase.from('products').insert([productData]);
    }
    setProductData({ title: '', price: 0, description: '', category: 'Sepatu', image_url: '' });
    fetchProducts();
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4">
      <h2 className="text-3xl font-bold italic">Produk & Katalog</h2>
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border grid grid-cols-2 gap-10">
        <div className="space-y-4">
          <label className="block text-sm font-bold uppercase tracking-widest text-slate-400">Foto Produk</label>
          <div className="aspect-video bg-slate-100 rounded-2xl border-2 border-dashed flex items-center justify-center relative overflow-hidden">
            {productData.image_url ? (
              <img src={productData.image_url} className="w-full h-full object-cover" alt="preview" />
            ) : (
              <div className="text-center">
                <Plus className="mx-auto mb-2 text-slate-400"/>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUploadImage(e.target.files?.[0])} />
                <p className="text-xs text-slate-400">{loading ? 'Uploading...' : 'Klik untuk upload'}</p>
              </div>
            )}
          </div>
          <input type="text" value={productData.title} placeholder="Nama Produk" className="w-full p-4 bg-slate-50 rounded-xl outline-none ring-1 ring-slate-100" onChange={e => setProductData({...productData, title: e.target.value})} />
        </div>
        <div className="space-y-4">
          <input type="number" value={productData.price || ''} placeholder="Harga (Rp)" className="w-full p-4 bg-slate-50 rounded-xl outline-none ring-1 ring-slate-100" onChange={e => setProductData({...productData, price: parseInt(e.target.value)})} />
          <textarea value={productData.description} placeholder="Deskripsi..." className="w-full p-4 bg-slate-50 rounded-xl h-32 outline-none ring-1 ring-slate-100" onChange={e => setProductData({...productData, description: e.target.value})}></textarea>
          <button onClick={handleSave} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase hover:bg-black transition-all">
            {editingId ? 'Update Produk' : 'Simpan Produk'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-black uppercase">
            <tr><th className="p-4">Produk</th><th className="p-4">Harga</th><th className="p-4 text-center">Aksi</th></tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-t hover:bg-slate-50">
                <td className="p-4 font-bold">{p.title}</td>
                <td className="p-4 text-blue-600 font-black">Rp {p.price.toLocaleString()}</td>
                <td className="p-4 flex justify-center gap-2">
                  <button onClick={() => {setEditingId(p.id); setProductData(p)}} className="p-2 text-blue-600"><Edit size={18}/></button>
                  <button onClick={async () => { if(confirm('Hapus?')) { await supabase.from('products').delete().eq('id',p.id); fetchProducts(); } }} className="p-2 text-red-600"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BankSection() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ name: '', account_number: '', account_holder: '', type: 'Bank', qris_url: '' });

  const fetchMethods = async () => {
    const { data: m } = await supabase.from('payment_methods').select('*');
    if (m) setMethods(m);
  };

  useEffect(() => { fetchMethods(); }, []);

  const handleQRUpload = async (file: any) => {
    try {
      setLoading(true);
      const fileName = `qris_${Date.now()}`;
      const { error } = await supabase.storage.from('products').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
      setData({ ...data, qris_url: publicUrl });
      alert("QRIS Berhasil diupload!");
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if(!data.name || !data.account_number) return alert("Isi data!");
    await supabase.from('payment_methods').insert([data]);
    setData({ name: '', account_number: '', account_holder: '', type: 'Bank', qris_url: '' });
    fetchMethods();
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <h2 className="text-3xl font-bold italic text-slate-900">Metode Pembayaran</h2>
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
           <input type="text" value={data.name} placeholder="Nama Bank / E-Wallet (BCA/DANA)" className="w-full p-4 bg-slate-50 rounded-xl outline-none border" onChange={e => setData({...data, name: e.target.value})} />
           <input type="text" value={data.account_number} placeholder="Nomor Rekening / No. HP" className="w-full p-4 bg-slate-50 rounded-xl outline-none border" onChange={e => setData({...data, account_number: e.target.value})} />
           <select className="w-full p-4 bg-slate-50 rounded-xl outline-none border font-bold" value={data.type} onChange={e => setData({...data, type: e.target.value})}>
             <option value="Bank">Transfer Bank</option>
             <option value="E-Wallet">E-Wallet</option>
             <option value="QRIS">QRIS Dinamis/Statis</option>
           </select>
        </div>
        <div className="space-y-4">
           {data.type === 'QRIS' && (
             <div className="border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[150px]">
               {data.qris_url ? <img src={data.qris_url} className="h-32 object-contain" /> : <p className="text-xs text-slate-400">Upload Foto QRIS</p>}
               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleQRUpload(e.target.files?.[0])} />
             </div>
           )}
           <button onClick={handleSave} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg shadow-blue-200">Tambah Metode</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {methods.map(m => (
          <div key={m.id} className="bg-white p-6 rounded-3xl border shadow-sm relative group transition-all hover:border-blue-500">
            <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-500 transition-all" onClick={async () => {await supabase.from('payment_methods').delete().eq('id',m.id); fetchMethods();}}><Trash2 size={16}/></button>
            <div className="flex items-center gap-4 mb-4">
               <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">{m.type === 'QRIS' ? <QrCode/> : <Landmark/>}</div>
               <div><p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{m.type}</p><h4 className="font-black text-xl italic">{m.name}</h4></div>
            </div>
            {m.qris_url ? <img src={m.qris_url} className="w-full h-32 object-contain bg-slate-50 rounded-xl p-2" /> : <p className="font-mono text-lg font-bold text-slate-900">{m.account_number}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderSection() {
  const [orders, setOrders] = useState<any[]>([]);
  
  useEffect(() => {
    const f = async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', {ascending: false});
      if(data) setOrders(data);
    };
    f();
    const sub = supabase.channel('orders-realtime').on('postgres_changes', {event: '*', schema:'public', table:'orders'}, f).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      <h2 className="text-3xl font-bold italic">Manajemen Pesanan</h2>
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
                  <td className="p-6 text-[10px] text-slate-400">#{o.id.slice(0,8)}<br/>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="p-6 font-bold">{o.customer_name}</td>
                  <td className="p-6 text-sm">{o.items_summary || 'Produk...'}</td>
                  <td className="p-6 font-black text-blue-600">Rp {o.total_price?.toLocaleString()}</td>
                  <td className="p-6"><span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-black uppercase">Pending</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsSection() {
  return (
    <div className="space-y-8 animate-in fade-in">
      <h2 className="text-3xl font-bold italic">Analitik Performa</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border shadow-sm">
           <h3 className="font-bold mb-6 flex items-center gap-2"><BarChart3 size={20} className="text-blue-500"/> Trafik Pengunjung</h3>
           <div className="h-48 flex items-end gap-2">
             {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
               <div key={i} className="flex-1 bg-slate-100 rounded-t-lg relative group">
                  <div style={{ height: `${h}%` }} className="bg-blue-500 rounded-t-lg transition-all group-hover:bg-slate-900"></div>
               </div>
             ))}
           </div>
           <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400">
             <span>SEN</span><span>SEL</span><span>RAB</span><span>KAM</span><span>JUM</span><span>SAB</span><span>MIN</span>
           </div>
        </div>
        <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-xl">
           <h3 className="font-bold mb-4 italic">Top Kategori</h3>
           <div className="space-y-4">
             <AnalyticBar label="Elektronik" percent="85%" />
             <AnalyticBar label="Sepatu" percent="62%" />
             <AnalyticBar label="Fashion" percent="40%" />
           </div>
        </div>
      </div>
    </div>
  );
}

function WAGatewaySection() {
  const [waNumber, setWaNumber] = useState('628123456789');
  return (
    <div className="max-w-2xl animate-in slide-in-from-left-4">
      <h2 className="text-3xl font-bold italic mb-8">WA Gateway Configuration</h2>
      <div className="bg-white p-10 rounded-[3rem] border shadow-sm space-y-6">
        <div className="flex items-center gap-4 p-6 bg-emerald-50 text-emerald-700 rounded-3xl border border-emerald-100">
          <div className="p-3 bg-emerald-500 text-white rounded-full animate-pulse"><MessageSquare size={24}/></div>
          <div><p className="font-bold">Status: Terhubung</p><p className="text-xs">Siap mengirim notifikasi otomatis ke pembeli.</p></div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 uppercase">Nomor WhatsApp Admin</label>
          <input type="text" value={waNumber} onChange={(e) => setWaNumber(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border font-mono text-lg" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 uppercase">Template Pesan Checkout</label>
          <textarea className="w-full p-4 bg-slate-50 rounded-2xl border h-32 text-sm" defaultValue={"Halo [nama], pesanan [id] Anda telah diterima. Silahkan selesaikan pembayaran sebesar [total]."}></textarea>
        </div>
        <button className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase flex items-center justify-center gap-3">
          <Save size={20}/> Simpan Konfigurasi
        </button>
      </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="space-y-8 animate-in fade-in">
      <h2 className="text-3xl font-bold italic">Pengaturan Sistem</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-6">
          <h3 className="font-black italic flex items-center gap-2 text-blue-600"><Globe size={20}/> Identitas Toko</h3>
          <input type="text" placeholder="Nama Toko" className="w-full p-4 bg-slate-50 rounded-xl border" defaultValue="ZYHA ID" />
          <input type="text" placeholder="Slogan" className="w-full p-4 bg-slate-50 rounded-xl border" defaultValue="Step Into The Future" />
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border">
            <span className="text-sm font-bold">Mode Maintenance</span>
            <div className="w-12 h-6 bg-slate-200 rounded-full relative"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-6">
          <h3 className="font-black italic flex items-center gap-2 text-emerald-600"><Shield size={20}/> Keamanan & API</h3>
          <div className="p-4 bg-slate-50 rounded-xl border">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Supabase URL</p>
            <p className="text-xs font-mono truncate">https://xyzcompany.supabase.co</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Supabase Anon Key</p>
            <p className="text-xs font-mono truncate">eyJhY... (Protected)</p>
          </div>
          <button className="w-full py-4 border-2 border-slate-900 rounded-2xl font-black uppercase hover:bg-slate-900 hover:text-white transition-all">Ganti Password Admin</button>
        </div>
      </div>
    </div>
  );
}

// --- SHARED COMPONENTS ---

function SidebarLink({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      {icon} <span>{label}</span>
    </button>
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

function AnalyticBar({ label, percent }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold uppercase tracking-tighter"><span>{label}</span><span>{percent}</span></div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div style={{ width: percent }} className="h-full bg-blue-500"></div>
      </div>
    </div>
  );
}
