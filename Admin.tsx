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
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mt-1">Management System v1.1</p>
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

// HELPER UPLOAD FILE UNIVERSAL
const handleFileUpload = async (file: File, bucket: string = 'products') => {
    const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
};

// SECTIONS (DASHBOARD, PRODUCT, BANK TETAP SAMA NAMUN MENGGUNAKAN HELPER BARU)

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
  
  const initialData = { 
    title: '', 
    price: 0, 
    description: '', 
    category: 'Sepatu', 
    image_url: '', 
    images: [] as string[], 
    variants: [] as {name: string, image: string}[] 
  };
  
  const [productData, setProductData] = useState(initialData);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleUploadImages = async (files: FileList | null) => {
    if (!files) return;
    setLoading(true);
    try {
        const newImages = [...productData.images];
        for (const file of Array.from(files)) {
            const url = await handleFileUpload(file);
            newImages.push(url);
        }
        setProductData({ ...productData, images: newImages, image_url: newImages[0] });
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  };

  const handleVariantUpload = async (file: File, index: number) => {
    setLoading(true);
    try {
        const url = await handleFileUpload(file);
        const newVariants = [...productData.variants];
        newVariants[index].image = url;
        setProductData({ ...productData, variants: newVariants });
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  };

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
      setProductData(initialData); setEditingId(null); fetchProducts();
      alert("Produk Berhasil!");
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4">
      <h2 className="text-3xl font-bold italic">Produk & Katalog</h2>
      
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Galeri Produk (Max 5)</label>
            <div className="grid grid-cols-5 gap-2">
              {productData.images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border">
                  <img src={img} className="w-full h-full object-cover" />
                  <button onClick={() => {
                    const filtered = productData.images.filter((_, i) => i !== idx);
                    setProductData({...productData, images: filtered, image_url: filtered[0] || ''});
                  }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                </div>
              ))}
              {productData.images.length < 5 && (
                <div className="aspect-square bg-slate-50 border-2 border-dashed rounded-xl flex items-center justify-center relative hover:bg-slate-100 transition-colors">
                  <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUploadImages(e.target.files)} />
                  <UploadCloud className="text-slate-300" />
                </div>
              )}
            </div>
            
            <input type="text" value={productData.title} placeholder="Nama Produk" className="w-full p-5 bg-slate-50 rounded-2xl outline-none ring-1 ring-slate-100 font-bold" onChange={e => setProductData({...productData, title: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" value={productData.price || ''} placeholder="Harga (Rp)" className="w-full p-5 bg-slate-50 rounded-2xl outline-none ring-1 ring-slate-100" onChange={e => setProductData({...productData, price: parseInt(e.target.value)})} />
              <select className="p-5 bg-slate-50 rounded-2xl outline-none ring-1 ring-slate-100 font-bold" value={productData.category} onChange={e => setProductData({...productData, category: e.target.value})}>
                <option value="Sepatu">Sepatu</option>
                <option value="Elektronik">Elektronik</option>
                <option value="Fashion">Fashion</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Deskripsi & Variasi</label>
            <textarea value={productData.description} placeholder="Deskripsi lengkap produk..." className="w-full p-5 bg-slate-50 rounded-2xl h-32 outline-none ring-1 ring-slate-100" onChange={e => setProductData({...productData, description: e.target.value})}></textarea>
            <button onClick={handleSave} disabled={loading} className="w-full bg-slate-900 text-white p-6 rounded-3xl font-black uppercase hover:bg-black transition-all shadow-xl shadow-slate-200">
              {loading ? 'Processing...' : editingId ? 'Update Produk' : 'Simpan Produk'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// SECTION BANK, ORDER TETAP SAMA SEPERTI ASLINYA (TETAP TERHUBUNG KE SUPABASE)
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
      const url = await handleFileUpload(file);
      setData({ ...data, qris_url: url });
      alert("QRIS Berhasil!");
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if(!data.name && data.type !== 'Midtrans') return alert("Isi nama metode!");
    try {
        await supabase.from('payment_methods').insert([data]);
        setData({ name: '', account_number: '', account_holder: '', type: 'Bank', qris_url: '' });
        fetchMethods();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold italic">Metode Pembayaran</h2>
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
           <input type="text" value={data.name} placeholder="Nama Bank / E-Wallet" className="w-full p-4 bg-slate-50 rounded-xl outline-none border font-bold" onChange={e => setData({...data, name: e.target.value})} />
           <select className="w-full p-4 bg-slate-50 rounded-xl outline-none border font-bold" value={data.type} onChange={e => setData({...data, type: e.target.value})}>
             <option value="Bank">Transfer Bank</option>
             <option value="QRIS">QRIS</option>
             <option value="Midtrans">Midtrans</option>
           </select>
        </div>
        <div className="space-y-4">
           {data.type === 'QRIS' && (
             <div className="border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[150px] bg-slate-50">
               {data.qris_url ? <img src={data.qris_url} className="h-32 object-contain" /> : <p className="text-xs text-slate-400">Upload Foto QRIS</p>}
               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleQRUpload(e.target.files?.[0])} />
             </div>
           )}
           <button onClick={handleSave} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg shadow-blue-100">Tambah Metode</button>
        </div>
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
    const subscription = supabase.channel('orders-admin-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold italic">Manajemen Pesanan</h2>
      <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white text-xs uppercase font-bold">
            <tr><th className="p-6">Waktu</th><th className="p-6">Pembeli</th><th className="p-6">Produk</th><th className="p-6">Total</th><th className="p-6">Status</th></tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-b hover:bg-slate-50">
                <td className="p-6 text-[10px] text-slate-400">{new Date(o.created_at).toLocaleString()}</td>
                <td className="p-6 font-bold">{o.customer_name}</td>
                <td className="p-6 text-sm">
                  {Array.isArray(o.items) ? o.items.map((it:any) => it.title).join(', ') : 'No Summary'}
                </td>
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
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    store_name: '',
    wa_number: '',
    midtrans_client_key: '',
    banner_url: '',
    categories: [] as {name: string, icon: string}[]
  });

  useEffect(() => {
    const fetchSettings = async () => {
        const { data } = await supabase.from('settings').select('*').single();
        if(data) setSettings(data);
    }
    fetchSettings();
  }, []);

  const handleBannerUpload = async (file: File) => {
    setLoading(true);
    try {
        const url = await handleFileUpload(file);
        setSettings({...settings, banner_url: url});
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('settings').upsert([{ id: 1, ...settings }]);
    if (error) alert(error.message);
    else alert("Pengaturan Mewah Berhasil Disimpan!");
    setLoading(false);
  }

  const addCategory = () => setSettings({...settings, categories: [...settings.categories, {name: '', icon: ''}]});

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <h2 className="text-3xl font-bold italic">Global Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* BANNER MANAGEMENT */}
        <div className="bg-white p-8 rounded-[3rem] border shadow-xl space-y-6">
            <h3 className="font-black italic flex items-center gap-2 text-xl uppercase tracking-tighter"><ImageIcon className="text-blue-600"/> Banner Utama</h3>
            <div className="relative w-full h-48 bg-slate-100 rounded-3xl overflow-hidden group">
                {settings.banner_url ? <img src={settings.banner_url} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-400">Belum ada banner</div>}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && handleBannerUpload(e.target.files[0])} />
                    <UploadCloud className="text-white" size={40} />
                </div>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Klik untuk mengganti banner beranda</p>
        </div>

        {/* PROFILE & MIDTRANS */}
        <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl space-y-6 text-white">
            <h3 className="font-black italic flex items-center gap-2 text-xl uppercase tracking-tighter text-blue-400"><Globe/> Profil Toko</h3>
            <input type="text" value={settings.store_name} onChange={e => setSettings({...settings, store_name: e.target.value})} placeholder="Nama Toko" className="w-full p-4 bg-white/10 rounded-2xl border border-white/10 outline-none font-bold text-white placeholder:text-white/30" />
            <input type="text" value={settings.wa_number} onChange={e => setSettings({...settings, wa_number: e.target.value})} placeholder="No. WA Admin (628...)" className="w-full p-4 bg-white/10 rounded-2xl border border-white/10 outline-none font-bold text-white placeholder:text-white/30" />
            <div className="pt-4 border-t border-white/10 space-y-4">
                <h3 className="font-black italic text-blue-400">MIDTRANS KEYS</h3>
                <input type="text" value={settings.midtrans_client_key} onChange={e => setSettings({...settings, midtrans_client_key: e.target.value})} placeholder="Client Key" className="w-full p-4 bg-white/5 rounded-2xl border border-white/5 outline-none font-mono text-xs" />
            </div>
        </div>

        {/* CATEGORY MANAGEMENT */}
        <div className="bg-white p-8 rounded-[3rem] border shadow-xl space-y-6 lg:col-span-2">
            <div className="flex justify-between items-center">
                <h3 className="font-black italic flex items-center gap-2 text-xl uppercase tracking-tighter"><Package className="text-blue-600"/> Kelola Kategori</h3>
                <button onClick={addCategory} className="bg-blue-600 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest">+ Tambah</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {settings.categories.map((cat, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border flex items-center gap-3">
                        <input type="text" value={cat.icon} onChange={e => {
                            const newCats = [...settings.categories];
                            newCats[idx].icon = e.target.value;
                            setSettings({...settings, categories: newCats});
                        }} placeholder="Icon" className="w-10 bg-transparent outline-none text-xl" />
                        <input type="text" value={cat.name} onChange={e => {
                            const newCats = [...settings.categories];
                            newCats[idx].name = e.target.value;
                            setSettings({...settings, categories: newCats});
                        }} placeholder="Nama Kategori" className="flex-1 bg-transparent outline-none font-bold text-sm" />
                        <button onClick={() => setSettings({...settings, categories: settings.categories.filter((_, i) => i !== idx)})} className="text-red-400"><Trash2 size={16}/></button>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={loading} className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-xl uppercase italic shadow-2xl hover:bg-blue-700 transition-all">
        {loading ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
      </button>
    </div>
  );
}

// SHARED COMPONENTS
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
