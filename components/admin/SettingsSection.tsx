import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Image as ImageIcon, Plus, Globe, Shield, X, UploadCloud, CreditCard } from 'lucide-react';
import { validateImageFile } from '../../shared/adminUtils';

export function SettingsSection() {
  const [storeName, setStoreName] = useState('ZYHA ID');
  const [bannerUrl, setBannerUrl] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [newCat, setNewCat] = useState('');
  const [midtransClientKey, setMidtransClientKey] = useState('');
  const [midtransEnvironment, setMidtransEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [error, setError] = useState('');

  const fetchSettings = async () => {
      try {
          const { data, error } = await supabase.from('settings').select('store_name,banner_url,categories,midtrans_client_key,midtrans_environment').eq('id', 1).single();
          if (error) throw error;
          if(data) {
              setStoreName(data.store_name);
              setBannerUrl(data.banner_url || '');
              setCategories(data.categories || []);
              setMidtransClientKey(data.midtrans_client_key || '');
              setMidtransEnvironment(data.midtrans_environment || 'sandbox');
          }
      } catch (error: any) {
          setError(error.message || 'Gagal memuat pengaturan.');
      }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleUploadBanner = async (file: File) => {
      setError('');
      const invalid = validateImageFile(file);
      if (invalid) { setError(invalid); return; }
      const fileName = `banner_${Date.now()}`;
      const { error } = await supabase.storage.from('products').upload(fileName, file);
      if (error) { setError(error.message); return; }
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
      setBannerUrl(publicUrl);
  };

  const handleSave = async () => {
    const payload = {
        id: 1,
        store_name: storeName,
        banner_url: bannerUrl,
        categories: categories,
        midtrans_client_key: midtransClientKey,
        midtrans_environment: midtransEnvironment
    };
    const { error } = await supabase.from('settings').upsert([payload]);
    if (error) { setError(error.message); return; }
    alert("Semua Pengaturan Berhasil Disimpan!");
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <h2 className="text-3xl font-bold italic">Pengaturan</h2>
      {error && <p className="text-sm text-red-600 font-bold">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-6">
          <h3 className="font-bold flex items-center gap-2"><Globe size={20}/> Tampilan Toko</h3>
          <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Nama Toko" className="w-full p-4 bg-slate-50 rounded-xl border font-bold" />

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400">Banner Utama (App.tsx)</label>
            <div className="relative h-32 rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed flex items-center justify-center">
                {bannerUrl ? <img src={bannerUrl} className="w-full h-full object-cover" /> : <UploadCloud className="text-slate-300"/>}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && handleUploadBanner(e.target.files[0])} />
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
          <select value={midtransEnvironment} onChange={e => setMidtransEnvironment(e.target.value as 'sandbox' | 'production')} className="w-full p-4 bg-slate-50 rounded-xl border text-xs font-mono"><option value="sandbox">Sandbox</option><option value="production">Production</option></select>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
              <Shield className="text-amber-600" size={30} />
              <p className="text-[10px] text-amber-800">Server key disimpan sebagai secret Supabase Edge Function, bukan di database atau browser.</p>
          </div>
          <button onClick={handleSave} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase shadow-lg shadow-slate-200">Simpan Perubahan</button>
        </div>
      </div>
    </div>
  );
}
