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
  const [categories, setCategories] = useState<string[]>(["Sepatu", "Elektronik", "Fashion"]);
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
    const { data: s } = await supabase.from('settings').select('categories').single();
    if (s?.categories) setCategories(s.categories);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleUploadImages = async (files: FileList | null) => {
    if (!files) return;
    const filesArray = Array.from(files);
    setLoading(true);
    const newImages = [...productData.images];
    for (const file of filesArray) {
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('products').upload(fileName, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
        newImages.push(publicUrl);
      }
    }
    setProductData({ ...productData, images: newImages, image_url: newImages[0] });
    setLoading(false);
  };

  const handleVariantUpload = async (file: File, index: number) => {
    setLoading(true);
    const fileName = `variant_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('products').upload(fileName, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
      const newVariants = [...productData.variants];
      newVariants[index].image = publicUrl;
      setProductData({ ...productData, variants: newVariants });
    }
    setLoading(false);
  };

  const addVariant = () => {
    setProductData({ ...productData, variants: [...productData.variants, { name: '', image: '' }] });
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
      setProductData(initialData);
      setEditingId(null);
      fetchProducts();
      alert("Produk Berhasil!");
    } catch (err) { alert("Gagal!"); } finally { setLoading(false); }
  };

  const handleDelete = async (id: any) => {
    if (confirm('Hapus produk ini?')) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
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
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-6">
            <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Deskripsi & Variasi</label>
            <textarea value={productData.description} placeholder="Deskripsi lengkap produk..." className="w-full p-5 bg-slate-50 rounded-2xl h-32 outline-none ring-1 ring-slate-100" onChange={e => setProductData({...productData, description: e.target.value})}></textarea>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-400">Variasi Warna</span>
                <button onClick={addVariant} className="text-blue-500 font-black text-[10px] uppercase flex items-center gap-1 hover:underline"><Plus size={14}/> Tambah Variasi</button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {productData.variants.map((v, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 bg-slate-200 rounded-lg overflow-hidden relative">
                      {v.image ? <img src={v.image} className="w-full h-full object-cover" /> : <ImageIcon className="m-auto text-slate-400" size={16}/>}
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && handleVariantUpload(e.target.files[0], idx)} />
                    </div>
                    <input type="text" value={v.name} placeholder="Nama Warna" className="flex-1 bg-transparent outline-none text-sm font-bold" onChange={(e) => {
                         const n = [...productData.variants]; n[idx].name = e.target.value; setProductData({...productData, variants: n});
                    }} />
                    <button onClick={() => setProductData({...productData, variants: productData.variants.filter((_,i)=>i!==idx)})} className="text-red-400"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSave} disabled={loading} className="w-full bg-slate-900 text-white p-6 rounded-3xl font-black uppercase hover:bg-black transition-all shadow-xl shadow-slate-200">
              {loading ? 'Processing...' : editingId ? 'Update Produk' : 'Simpan Produk'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
            <tr><th className="p-6">Produk</th><th className="p-6">Informasi</th><th className="p-6">Variasi</th><th className="p-6">Harga</th><th className="p-6 text-center">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <img src={p.image_url} className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border" />
                    <div><p className="font-black text-slate-900 italic">{p.title}</p><p className="text-[10px] text-slate-400 uppercase font-bold">{p.category}</p></div>
                  </div>
                </td>
                <td className="p-6"><p className="text-xs text-slate-500 line-clamp-2 max-w-xs">{p.description}</p></td>
                <td className="p-6">
                  <div className="flex -space-x-2">
                    {p.variants?.map((v: any, idx: number) => (
                      <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden" title={v.name}>
                        <img src={v.image} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-6 font-black text-blue-600 italic">Rp {p.price.toLocaleString()}</td>
                <td className="p-6">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => {setEditingId(p.id); setProductData(p)}} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit size={18}/></button>
                    <button onClick={() => handleDelete(p.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/></button>
                  </div>
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
      alert("QRIS Uploaded!");
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    await supabase.from('payment_methods').insert([data]);
    setData({ name: '', account_number: '', account_holder: '', type: 'Bank', qris_url: '' });
    fetchMethods();
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold italic">Metode Pembayaran</h2>
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
           <input type="text" value={data.name} placeholder="Nama Bank (BCA/DANA)" className="w-full p-4 bg-slate-50 rounded-xl outline-none border font-bold" onChange={e => setData({...data, name: e.target.value})} />
           <input type="text" value={data.account_number} placeholder="Nomor Rekening" className="w-full p-4 bg-slate-50 rounded-xl outline-none border font-mono" onChange={e => setData({...data, account_number: e.target.value})} />
           <select className="w-full p-4 bg-slate-50 rounded-xl outline-none border font-bold" value={data.type} onChange={e => setData({...data, type: e.target.value})}>
             <option value="Bank">Transfer Bank</option>
             <option value="E-Wallet">E-Wallet</option>
             <option value="QRIS">QRIS</option>
             <option value="Midtrans">Midtrans</option>
           </select>
        </div>
        <div className="space-y-4">
           {data.type === 'QRIS' && (
             <div className="border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[150px] bg-slate-50">
               {data.qris_url ? <img src={data.qris_url} className="h-32 object-contain" /> : <p className="text-xs text-slate-400">Upload QRIS</p>}
               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleQRUpload(e.target.files?.[0])} />
             </div>
           )}
           <button onClick={handleSave} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg">Tambah Metode</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {methods.map(m => (
          <div key={m.id} className="bg-white p-6 rounded-3xl border shadow-sm relative group">
            <button className="absolute top-4 right-4 text-red-500" onClick={async () => { await supabase.from('payment_methods').delete().eq('id', m.id); fetchMethods(); }}><Trash2 size={16}/></button>
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">{m.type === 'QRIS' ? <QrCode/> : <Landmark/>}</div>
                <div><h4 className="font-black text-xl italic">{m.name || m.type}</h4></div>
            </div>
            {m.qris_url ? <img src={m.qris_url} className="w-full h-32 object-contain bg-slate-50 rounded-xl" /> : <p className="font-mono font-bold">{m.account_number}</p>}
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
    const sub = supabase.channel('orders-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  return (
    <div className="space-y-6">
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
                  <td className="p-6 text-[10px] text-slate-400">#{o.id.slice(-8)}<br/>{new Date(o.created_at).toLocaleString()}</td>
                  <td className="p-6 font-bold">{o.customer_name}<br/><span className="text-[10px] font-normal">{o.customer_phone}</span></td>
                  <td className="p-6 text-sm">
                    {Array.isArray(o.items) ? o.items.map((it:any) => `${it.title} (${it.selectedVariant})`).join(', ') : 'No items'}
                  </td>
                  <td className="p-6 font-black text-blue-600">Rp {o.total_price?.toLocaleString()}</td>
                  <td className="p-6">
                    <select 
                        value={o.status || 'pending'} 
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase outline-none ${o.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}
                        onChange={async (e) => {
                            await supabase.from('orders').update({status: e.target.value}).eq('id', o.id);
                            fetchOrders();
                        }}
                    >
                        <option value="pending">PENDING</option>
                        <option value="paid">PAID</option>
                        <option value="cancelled">CANCELLED</option>
                    </select>
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

function AnalyticsSection() {
  return (
    <div className="space-y-8">
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
        </div>
      </div>
    </div>
  );
}

function WAGatewaySection() {
  const [wa, setWa] = useState('');
  useEffect(() => { supabase.from('settings').select('admin_phone').single().then(({data}) => setWa(data?.admin_phone || '')); }, []);
  const save = async () => { await supabase.from('settings').upsert({id:1, admin_phone: wa}); alert('Saved!'); };
  return (
    <div className="max-w-2xl space-y-8">
      <h2 className="text-3xl font-bold italic">WA Gateway</h2>
      <div className="bg-white p-10 rounded-[3rem] border shadow-sm space-y-6">
        <label className="text-xs font-black uppercase text-slate-400">Nomor WhatsApp Admin (62xxx)</label>
        <input type="text" value={wa} onChange={e => setWa(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border font-mono text-lg" />
        <button onClick={save} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase flex items-center justify-center gap-2 hover:bg-black transition-all">
          <Save size={20}/> Simpan WA
        </button>
      </div>
    </div>
  );
}

function SettingsSection() {
  const [storeName, setStoreName] = useState('ZYHA ID');
  const [bannerUrl, setBannerUrl] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [newCat, setNewCat] = useState('');
  const [midtransClientKey, setMidtransClientKey] = useState('');
  const [midtransServerKey, setMidtransServerKey] = useState('');

  const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').single();
      if(data) {
          setStoreName(data.store_name);
          setBannerUrl(data.banner_url || '');
          setCategories(data.categories || []);
          setMidtransClientKey(data.midtrans_client_key || '');
          setMidtransServerKey(data.midtrans_server_key || '');
      }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleUploadBanner = async (file: File) => {
      const fileName = `banner_${Date.now()}`;
      const { error } = await supabase.storage.from('products').upload(fileName, file);
      if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
          setBannerUrl(publicUrl);
      }
  };

  const handleSave = async () => {
    const payload = { 
        id: 1,
        store_name: storeName, 
        banner_url: bannerUrl,
        categories: categories,
        midtrans_client_key: midtransClientKey, 
        midtrans_server_key: midtransServerKey 
    };
    await supabase.from('settings').upsert([payload]);
    alert("Semua Pengaturan Berhasil Disimpan!");
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <h2 className="text-3xl font-bold italic">Pengaturan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-6">
          <h3 className="font-bold flex items-center gap-2"><Globe size={20}/> Tampilan Toko</h3>
          <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Nama Toko" className="w-full p-4 bg-slate-50 rounded-xl border font-bold" />
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400">Banner Utama (App.tsx)</label>
            <div className="relative h-32 rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed flex items-center justify-center">
                {bannerUrl ? <img src={bannerUrl} className="w-full h-full object-cover" /> : <UploadCloud className="text-slate-300"/>}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && handleUploadBanner(e.target.files[0])} />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-bold flex items-center gap-2"><ImageIcon size={20}/> Kategori Produk</h3>
            <div className="flex gap-2">
                <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} className="flex-1 p-3 bg-slate-50 border rounded-xl outline-none" placeholder="Nama Kategori..." />
                <button onClick={() => { if(newCat) setCategories([...categories, newCat]); setNewCat(''); }} className="p-3 bg-blue-600 text-white rounded-xl"><Plus/></button>
            </div>
            <div className="flex flex-wrap gap-2">
                {categories.map((c, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold flex items-center gap-2">
                        {c} <button onClick={() => setCategories(categories.filter((_,idx)=>idx!==i))} className="text-red-500"><X size={12}/></button>
                    </span>
                ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-6">
          <h3 className="font-bold flex items-center gap-2"><CreditCard size={20}/> Midtrans API (Snap)</h3>
          <input type="text" value={midtransClientKey} onChange={e => setMidtransClientKey(e.target.value)} placeholder="Client Key" className="w-full p-4 bg-slate-50 rounded-xl border text-xs font-mono" />
          <input type="password" value={midtransServerKey} onChange={e => setMidtransServerKey(e.target.value)} placeholder="Server Key" className="w-full p-4 bg-slate-50 rounded-xl border text-xs font-mono" />
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
              <Shield className="text-amber-600" size={30} />
              <p className="text-[10px] text-amber-800">Ubah API Key hanya jika Anda tahu apa yang Anda lakukan. Kesalahan kunci akan menyebabkan checkout gagal.</p>
          </div>
          <button onClick={handleSave} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase shadow-lg shadow-slate-200">Simpan Perubahan</button>
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
