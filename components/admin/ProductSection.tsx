import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Image as ImageIcon, Plus, Trash2, Edit, X, UploadCloud } from 'lucide-react';
import { MAX_PRODUCT_IMAGES, validateImageFile } from '../../shared/adminUtils';

export function ProductSection() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["Sepatu", "Elektronik", "Fashion"]);
  const [editingId, setEditingId] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

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
    try {
      const { data, error } = await supabase.from('products').select('id,title,price,description,category,image_url,images,variants,is_active,created_at').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
      const { data: s, error: settingsError } = await supabase.from('settings').select('categories').eq('id', 1).single();
      if (settingsError) throw settingsError;
      if (s?.categories) setCategories(s.categories);
    } catch (error: any) {
      setError(error.message || 'Gagal memuat produk.');
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleUploadImages = async (files: FileList | null) => {
    if (!files) return;
    setError('');
    const filesArray = Array.from(files);
    if (productData.images.length + filesArray.length > MAX_PRODUCT_IMAGES) {
      setError(`Galeri produk maksimal ${MAX_PRODUCT_IMAGES} gambar.`);
      return;
    }
    const invalid = filesArray.map(validateImageFile).find(Boolean);
    if (invalid) { setError(invalid); return; }
    setUploading(true);
    const newImages = [...productData.images];
    try {
      for (const file of filesArray) {
        const fileName = `${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from('products').upload(fileName, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
        newImages.push(publicUrl);
      }
      setProductData({ ...productData, images: newImages, image_url: newImages[0] || '' });
    } catch (error: any) {
      setError(error.message || 'Upload gambar gagal.');
    } finally {
      setUploading(false);
    }
  };

  const handleVariantUpload = async (file: File, index: number) => {
    setError('');
    const invalid = validateImageFile(file);
    if (invalid) { setError(invalid); return; }
    setUploading(true);
    try {
      const fileName = `variant_${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('products').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
      const newVariants = [...productData.variants];
      newVariants[index].image = publicUrl;
      setProductData({ ...productData, variants: newVariants });
    } catch (error: any) {
      setError(error.message || 'Upload variasi gagal.');
    } finally {
      setUploading(false);
    }
  };

  const addVariant = () => {
    setProductData({ ...productData, variants: [...productData.variants, { name: '', image: '' }] });
  };

  const handleSave = async () => {
    setError('');
    if (uploading) { setError('Tunggu upload selesai sebelum menyimpan.'); return; }
    if (!productData.title || !productData.price) { setError('Isi data produk!'); return; }
    if (productData.images.length > MAX_PRODUCT_IMAGES) { setError(`Galeri produk maksimal ${MAX_PRODUCT_IMAGES} gambar.`); return; }
    setLoading(true);
    const { id, created_at, ...payload } = productData as any;
    try {
      const result = editingId
        ? await supabase.from('products').update(payload).eq('id', editingId)
        : await supabase.from('products').insert([payload]);
      if (result.error) throw result.error;
      setProductData(initialData);
      setEditingId(null);
      await fetchProducts();
      alert("Produk Berhasil!");
    } catch (err: any) { setError(err.message || 'Gagal menyimpan produk.'); } finally { setLoading(false); }
  };

  const handleDelete = async (id: any) => {
    if (confirm('Hapus produk ini?')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) { setError(error.message); return; }
      fetchProducts();
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4">
      <h2 className="text-3xl font-bold italic">Produk & Katalog</h2>
      {error && <p className="text-sm text-red-600 font-bold">{error}</p>}

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
                  <input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUploadImages(e.target.files)} />
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
                      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && handleVariantUpload(e.target.files[0], idx)} />
                    </div>
                    <input type="text" value={v.name} placeholder="Nama Warna" className="flex-1 bg-transparent outline-none text-sm font-bold" onChange={(e) => {
                         const n = [...productData.variants]; n[idx].name = e.target.value; setProductData({...productData, variants: n});
                    }} />
                    <button onClick={() => setProductData({...productData, variants: productData.variants.filter((_,i)=>i!==idx)})} className="text-red-400"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSave} disabled={loading || uploading} className="w-full bg-slate-900 text-white p-6 rounded-3xl font-black uppercase hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-60">
              {uploading ? 'Uploading...' : loading ? 'Processing...' : editingId ? 'Update Produk' : 'Simpan Produk'}
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
