import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  LayoutDashboard, Package, ShoppingCart, BarChart3, 
  MessageSquare, Image as ImageIcon, Settings, 
  Plus, Trash2, Edit, Landmark, QrCode, Save, RefreshCcw, Globe, Shield, X, UploadCloud, CreditCard
} from 'lucide-react';

export default function Admin() {
  const [view, setView] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside className="w-72 bg-slate-900 text-white p-8 flex flex-col shadow-2xl sticky top-0 h-screen">
        <div className="mb-12">
          <h1 className="text-3xl font-black tracking-tighter text-blue-400 italic">ZYHA ID</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mt-1">Management System</p>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto">
          <SidebarLink icon={<LayoutDashboard size={20}/>} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarLink icon={<Package size={20}/>} label="Produk & Katalog" active={view === 'products'} onClick={() => setView('products')} />
          <SidebarLink icon={<Landmark size={20}/>} label="Metode Bayar" active={view === 'banks'} onClick={() => setView('banks')} />
          <SidebarLink icon={<ShoppingCart size={20}/>} label="Pesanan" active={view === 'orders'} onClick={() => setView('orders')} />
          <SidebarLink icon={<Settings size={20}/>} label="Pengaturan" active={view === 'settings'} onClick={() => setView('settings')} />
        </nav>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        {view === 'dashboard' && <DashboardSection />}
        {view === 'products' && <ProductSection />}
        {view === 'banks' && <BankSection />}
        {view === 'orders' && <OrderSection />}
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
        <StatCard title="Pendapatan" value={`Rp ${stats.revenue.toLocaleString()}`} growth="+15%" color="bg-blue-600" />
        <StatCard title="Pesanan" value={stats.orders.toString()} growth="Total" color="bg-emerald-600" />
        <StatCard title="Produk" value={stats.products.toString()} growth="Aktif" color="bg-slate-900" />
      </div>
    </div>
  );
}

function ProductSection() {
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const initialData = { 
    title: '', price: 0, description: '', category: 'Sepatu', 
    image_url: '', images: [] as string[], variants: [] as any[] 
  };
  
  const [productData, setProductData] = useState(initialData);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSave = async () => {
    if (!productData.title || !productData.price) return alert("Isi data produk!");
    setLoading(true);
    const { id, created_at, ...payload } = productData as any;

    try {
      if (editingId) {
        await supabase.from('products').update(payload).eq('id', editingId);
      } else {
        await supabase.from('products').insert([payload]);
      }
      setProductData(initialData);
      setEditingId(null);
      fetchProducts();
      alert("Berhasil!");
    } catch (err: any) {
      alert("Gagal: " + err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold italic">Produk & Katalog</h2>
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
            <input type="text" value={productData.title} placeholder="Nama Produk" className="w-full p-4 bg-slate-50 rounded-xl border" onChange={e => setProductData({...productData, title: e.target.value})} />
            <input type="number" value={productData.price || ''} placeholder="Harga" className="w-full p-4 bg-slate-50 rounded-xl border" onChange={e => setProductData({...productData, price: parseInt(e.target.value)})} />
            <input type="text" value={productData.image_url} placeholder="URL Gambar Utama" className="w-full p-4 bg-slate-50 rounded-xl border" onChange={e => setProductData({...productData, image_url: e.target.value})} />
            <select className="w-full p-4 bg-slate-50 rounded-xl border font-bold" value={productData.category} onChange={e => setProductData({...productData, category: e.target.value})}>
                <option value="Sepatu">Sepatu</option>
                <option value="Elektronik">Elektronik</option>
                <option value="Fashion">Fashion</option>
                <option value="Aksesoris">Aksesoris</option>
            </select>
        </div>
        <div className="space-y-6">
            <textarea value={productData.description} placeholder="Deskripsi..." className="w-full p-4 bg-slate-50 rounded-xl border h-32" onChange={e => setProductData({...productData, description: e.target.value})}></textarea>
            <button onClick={handleSave} disabled={loading} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase">
              {loading ? 'Loading...' : editingId ? 'Update' : 'Simpan'}
            </button>
        </div>
      </div>
      
      <div className="bg-white rounded-[2rem] border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase">
            <tr><th className="p-6">Produk</th><th className="p-6">Harga</th><th className="p-6">Aksi</th></tr>
          </thead>
          <tbody className="divide-y">
            {products.map(p => (
              <tr key={p.id}>
                <td className="p-6 font-bold">{p.title}</td>
                <td className="p-6">Rp {p.price.toLocaleString()}</td>
                <td className="p-6 flex gap-2">
                    <button onClick={() => {setEditingId(p.id); setProductData(p)}} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit size={16}/></button>
                    <button onClick={async () => { if(confirm('Hapus?')) { await supabase.from('products').delete().eq('id', p.id); fetchProducts(); } }} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={16}/></button>
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
  const [data, setData] = useState({ name: '', account_number: '', type: 'Bank' });

  const fetchMethods = async () => {
    const { data: m } = await supabase.from('payment_methods').select('*');
    if (m) setMethods(m);
  };

  useEffect(() => { fetchMethods(); }, []);

  const handleSave = async () => {
    await supabase.from('payment_methods').insert([data]);
    setData({ name: '', account_number: '', type: 'Bank' });
    fetchMethods();
    alert("Berhasil!");
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold italic">Pembayaran</h2>
      <div className="bg-white p-8 rounded-[2.5rem] border flex gap-4">
        <input type="text" placeholder="Nama Bank" className="flex-1 p-4 bg-slate-50 rounded-xl border" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
        <input type="text" placeholder="Nomor Rekening" className="flex-1 p-4 bg-slate-50 rounded-xl border" value={data.account_number} onChange={e => setData({...data, account_number: e.target.value})} />
        <button onClick={handleSave} className="bg-blue-600 text-white px-8 rounded-xl font-bold">Tambah</button>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {methods.map(m => (
          <div key={m.id} className="bg-white p-6 rounded-2xl border shadow-sm flex justify-between">
            <div><p className="text-xs text-slate-400">{m.type}</p><p className="font-bold">{m.name}</p></div>
            <button onClick={async () => { await supabase.from('payment_methods').delete().eq('id', m.id); fetchMethods(); }} className="text-red-500"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderSection() {
  const [orders, setOrders] = useState<any[]>([]);
  
  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', {ascending: false});
    if(data) setOrders(data);
  };

  useEffect(() => {
    fetchOrders();
    const sub = supabase.channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold italic">Pesanan Masuk</h2>
      <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white text-xs uppercase font-bold">
            <tr><th className="p-6">Pembeli</th><th className="p-6">Produk</th><th className="p-6">Total</th><th className="p-6">Status</th></tr>
          </thead>
          <tbody className="divide-y">
            {orders.length === 0 ? <tr><td colSpan={4} className="p-10 text-center text-slate-400">Belum ada pesanan.</td></tr> : orders.map(o => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="p-6 font-bold">{o.customer_name}<br/><span className="text-[10px] text-slate-400">{o.customer_phone}</span></td>
                <td className="p-6 text-xs">{o.items?.map((it:any) => it.title).join(', ')}</td>
                <td className="p-6 font-black text-blue-600">Rp {o.total_price?.toLocaleString()}</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${o.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {o.status || 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsSection() {
  const [settings, setSettings] = useState({
    store_name: '', banner_url: '', banner_title: '', store_tagline: '', wa_number: ''
  });

  useEffect(() => {
    supabase.from('settings').select('*').single().then(({data}) => {
        if(data) setSettings(data);
    });
  }, []);

  const handleSave = async () => {
    const { error } = await supabase.from('settings').upsert([{ id: 1, ...settings }]);
    if (!error) alert("Pengaturan Berhasil!");
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold italic">Pengaturan Toko</h2>
      <div className="bg-white p-10 rounded-[3rem] border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-400 uppercase">Nama Toko</label>
          <input type="text" value={settings.store_name} onChange={e => setSettings({...settings, store_name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border" />
          
          <label className="text-xs font-bold text-slate-400 uppercase">WhatsApp Admin (62xxx)</label>
          <input type="text" value={settings.wa_number} onChange={e => setSettings({...settings, wa_number: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border" />
        </div>
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-400 uppercase">URL Banner Utama</label>
          <input type="text" value={settings.banner_url} onChange={e => setSettings({...settings, banner_url: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border" />
          
          <label className="text-xs font-bold text-slate-400 uppercase">Judul Banner</label>
          <input type="text" value={settings.banner_title} onChange={e => setSettings({...settings, banner_title: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border" />
        </div>
        <button onClick={handleSave} className="md:col-span-2 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase">Simpan Perubahan</button>
      </div>
    </div>
  );
}

// --- SHARED COMPONENTS ---
function SidebarLink({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      {icon} <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, growth, color }: any) {
  return (
    <div className={`${color} p-8 rounded-[2rem] text-white shadow-lg`}>
      <p className="text-xs uppercase font-bold opacity-80">{title}</p>
      <h4 className="text-3xl font-black mt-2">{value}</h4>
    </div>
  );
}
