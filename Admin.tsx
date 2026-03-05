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

    

    setLoading(true);

    // Destructure untuk menghindari pengiriman ID atau field yang tidak perlu saat insert/update

    const { id, created_at, ...cleanData } = productData as any;

    

    const payload = { 

      ...cleanData,

      price: Number(productData.price),

      images: Array.isArray(productData.images) ? productData.images : [],

      variants: Array.isArray(productData.variants) ? productData.variants : []

    };



    try {

      if (editingId) {

        const { error } = await supabase.from('products').update(payload).eq('id', editingId);

        if (error) throw error;

        setEditingId(null);

      } else {

        const { error } = await supabase.from('products').insert([payload]);

        if (error) throw error;

      }

      setProductData(initialData);

      fetchProducts();

      alert("Produk berhasil disimpan!");

    } catch (err: any) {

      alert("Gagal simpan produk: " + err.message);

    } finally {

      setLoading(false);

    }

  };



  const handleDelete = async (id: any) => {

    if (confirm('Hapus produk ini?')) {

      try {

        const { error } = await supabase.from('products').delete().eq('id', id);

        if (error) throw error;

        alert("Produk berhasil dihapus");

        fetchProducts();

      } catch (err: any) {

        alert("Gagal menghapus: " + err.message);

      }

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

              <input type="number" value={productData.price || ''} placeholder="Harga (Rp)" className="w-full p-5 bg-slate-50 rounded-2xl outline-none ring-1 ring-slat
