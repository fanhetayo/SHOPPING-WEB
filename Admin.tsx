import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  LayoutDashboard, Package, ShoppingCart, BarChart3, 
  MessageSquare, Image as ImageIcon, Settings, 
  Truck, Plus, Trash2, Send, Edit, Landmark, QrCode, Save, RefreshCcw, Bell, Globe, Shield, X, UploadCloud
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
    const filesArray = Array.from(files);
    if (productData.images.length + filesArray.length > 5) return alert("Maksimal 5 gambar!");

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

  const removeVariant = (index: number) => {
    setProductData({ ...productData, variants: productData.variants.filter((_, i) => i !== index) });
  };

  const updateVariantName = (index: number, name: string) => {
    const newVariants = [...productData.variants];
    newVariants[index].name = name;
    setProductData({ ...productData, variants: newVariants });
  };

  const handleSave = async () => {
    if (!productData.title || !productData.price) return alert("Isi data produk!");
    
    const payload = { ...productData };
    if (editingId) {
      await supabase.from('products').update(payload).eq('id', editingId);
      setEditingId(null);
    } else {
      await supabase.from('products').insert([payload]);
    }
    setProductData(initialData);
    fetchProducts();
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4">
      <h2 className="text-3xl font-bold italic">Produk & Katalog</h2>
      
      {/* FORM UPLOAD */}
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Bagian Kiri: Multi Image */}
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

          {/* Bagian Kanan: Deskripsi & Simpan */}
          <div className="space-y-6">
            <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Deskripsi & Variasi</label>
            <textarea value={productData.description} placeholder="Deskripsi lengkap produk..." className="w-full p-5 bg-slate-50 rounded-2xl h-32 outline-none ring-1 ring-slate-100" onChange={e => setProductData({...productData, description: e.target.value})}></textarea>
            
            {/* Varian Warna */}
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
                    <input type="text" value={v.name} placeholder="Nama Warna" className="flex-1 bg-transparent outline-none text-sm font-bold" onChange={(e) => updateVariantName(idx, e.target.value)} />
                    <button onClick={() => removeVariant(idx)} className="text-red-400"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSave} disabled={loading} className="w-full bg-slate-900 text-white p-6 rounded-3xl font-black uppercase hover:bg-black transition-all shadow-xl shadow-slate-200">
              {loading ? 'Processing...' : editingId ? 'Update Produk' : 'Simpan Produk'}
            </button>
            {editingId && <button onClick={() => {setEditingId(null); setProductData(initialData)}} className="w-full text-slate-400 font-bold text-xs uppercase italic">Batal Edit</button>}
          </div>
        </div>
      </div>

      {/* DAFTAR PRODUK */}
      <div className="bg-white rounded-[3rem] shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
            <tr>
              <th className="p-6">Produk</th>
              <th className="p-6">Informasi</th>
              <th className="p-6">Variasi</th>
              <th className="p-6">Harga</th>
              <th className="p-6 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <img src={p.image_url} className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border" />
                    <div>
                      <p className="font-black text-slate-900 italic">{p.title}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{p.category}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                   <p className="text-xs text-slate-500 line-clamp-2 max-w-xs">{p.description}</p>
                </td>
                <td className="p-6">
                  <div className="flex -space-x-2">
                    {p.variants?.map((v: any, idx: number) => (
                      <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden" title={v.name}>
                        <img src={v.image} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {(!p.variants || p.variants.length === 0) && <span className="text-xs text-slate-300 italic">No variants</span>}
                  </div>
                </td>
                <td className="p-6 font-black text-blue-600 italic">Rp {p.price.toLocaleString()}</td>
                <td className="p-6">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => {setEditingId(p.id); setProductData(p)}} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit size={18}/></button>
                    <button onClick={async () => { if(confirm('Hapus produk ini?')) { await supabase.from('products').delete().eq('id',p.id); fetchProducts(); } }} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/></button>
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

// (Fungsi BankSection, OrderSection, AnalyticsSection, WAGatewaySection, SettingsSection tetap ada seperti sebelumnya agar kode tetap utuh)
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
    <div className="space-y-8">
      <h2 className="text-3xl font-bold italic">Metode Pembayaran</h2>
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
           <button onClick={handleSave} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase">Tambah Metode</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {methods.map(m => (
          <div key={m.id} className="bg-white p-6 rounded-3xl border shadow-sm relative group">
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
            {orders.map(o => (
              <tr key={o.id} className="border-b">
                <td className="p-6 text-[10px] text-slate-400">#{o.id.slice(0,8)}<br/>{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="p-6 font-bold">{o.customer_name}</td>
                <td className="p-6 text-sm">{o.items_summary}</td>
                <td className="p-6 font-black text-blue-600">Rp {o.total_price?.toLocaleString()}</td>
                <td className="p-6"><span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-black uppercase">Pending</span></td>
              </tr>
            ))}
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
  return (
    <div className="max-w-2xl">
      <h2 className="text-3xl font-bold italic mb-8">WA Gateway</h2>
      <div className="bg-white p-10 rounded-[3rem] border shadow-sm space-y-6">
        <input type="text" defaultValue="628123456789" className="w-full p-4 bg-slate-50 rounded-2xl border font-mono text-lg" />
        <button className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase">Simpan Konfigurasi</button>
      </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold italic">Pengaturan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-6">
          <input type="text" placeholder="Nama Toko" className="w-full p-4 bg-slate-50 rounded-xl border" defaultValue="ZYHA ID" />
          <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase">Simpan Perubahan</button>
        </div>
      </div>
    </div>
  );
}
