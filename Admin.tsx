import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  LayoutDashboard, Package, ShoppingCart, BarChart3, 
  MessageSquare, Image as ImageIcon, Settings, 
  Truck, Plus, Trash2, Send, Edit, Landmark, QrCode, Save
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
      </main>
    </div>
  );
}

function DashboardSection() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, lowStock: 5 });
  useEffect(() => {
    const fetchStats = async () => {
      const { data: orders } = await supabase.from('orders').select('total_price');
      const totalRev = orders?.reduce((acc, curr) => acc + (curr.total_price || 0), 0) || 0;
      setStats({ revenue: totalRev, orders: orders?.length || 0, lowStock: 5 });
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 italic">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Pendapatan" value={`Rp ${stats.revenue.toLocaleString()}`} growth="+15%" color="bg-blue-600" />
        <StatCard title="Pesanan Baru" value={stats.orders.toString()} growth="Hari ini" color="bg-emerald-600" />
        <StatCard title="Visitor" value="1,204" growth="+5%" color="bg-slate-900" />
      </div>
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border h-96 flex items-center justify-center italic text-slate-400">
        Statistik Real-time terhubung ke Supabase...
      </div>
    </div>
  );
}

function ProductSection() {
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState({ title: '', price: 0, description: '', category: 'Sepatu', image_url: '' });

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleUploadImage = async (file: any) => {
    try {
      setLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('products').upload(fileName, file);
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
    <div className="space-y-8">
      <h2 className="text-3xl font-bold italic">Produk & Katalog</h2>
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border grid grid-cols-2 gap-10">
        <div className="space-y-4">
          <label className="block text-sm font-bold">Foto Produk</label>
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
  const [data, setData] = useState({ name: '', account_number: '', account_holder: '', type: 'Bank' });

  const fetchMethods = async () => {
    const { data: m } = await supabase.from('payment_methods').select('*');
    if (m) setMethods(m);
  };

  useEffect(() => { fetchMethods(); }, []);

  const handleSave = async () => {
    if(!data.name || !data.account_number) return alert("Isi data!");
    await supabase.from('payment_methods').insert([data]);
    setData({ name: '', account_number: '', account_holder: '', type: 'Bank' });
    fetchMethods();
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold italic text-slate-900">Metode Pembayaran (Admin Bank)</h2>
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border grid grid-cols-4 gap-4">
        <input type="text" value={data.name} placeholder="Nama (BCA/DANA)" className="p-4 bg-slate-50 rounded-xl outline-none" onChange={e => setData({...data, name: e.target.value})} />
        <input type="text" value={data.account_number} placeholder="Nomor Rek/QRIS" className="p-4 bg-slate-50 rounded-xl outline-none" onChange={e => setData({...data, account_number: e.target.value})} />
        <select className="p-4 bg-slate-50 rounded-xl outline-none" onChange={e => setData({...data, type: e.target.value})}>
          <option value="Bank">Bank</option>
          <option value="E-Wallet">E-Wallet</option>
          <option value="QRIS">QRIS</option>
        </select>
        <button onClick={handleSave} className="bg-blue-600 text-white rounded-xl font-black uppercase">Tambah</button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {methods.map(m => (
          <div key={m.id} className="bg-white p-6 rounded-3xl border shadow-sm relative group">
            <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-500 transition-all" onClick={async () => {await supabase.from('payment_methods').delete().eq('id',m.id); fetchMethods();}}><Trash2 size={16}/></button>
            <div className="flex items-center gap-4 mb-4">
               <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">{m.type === 'Bank' ? <Landmark/> : <QrCode/>}</div>
               <div><p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{m.type}</p><h4 className="font-black text-xl italic">{m.name}</h4></div>
            </div>
            <p className="font-mono text-lg font-bold text-slate-900">{m.account_number}</p>
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
  }, []);
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold italic">Pesanan Masuk</h2>
      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white text-xs uppercase font-bold">
            <tr><th className="p-6">Pembeli</th><th className="p-6">Total Tagihan</th><th className="p-6">Status</th></tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-b"><td className="p-6 font-bold">{o.customer_name}</td><td className="p-6">Rp {o.total_price?.toLocaleString()}</td><td className="p-6 font-black text-blue-600">PENDING</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      {icon} <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, growth, color }: any) {
  return (
    <div className={`${color} p-8 rounded-[2rem] text-white shadow-lg relative overflow-hidden`}>
      <p className="text-xs uppercase font-bold opacity-80">{title}</p>
      <h4 className="text-2xl font-black mt-2">{value}</h4>
      <p className="text-[10px] mt-2 font-bold bg-white/20 w-fit px-2 py-1 rounded-lg">{growth}</p>
    </div>
  );
}
