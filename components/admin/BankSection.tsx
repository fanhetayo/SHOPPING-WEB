import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Trash2, Landmark, QrCode } from 'lucide-react';
import { validateImageFile } from '../../shared/adminUtils';

export function BankSection() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({ name: '', account_number: '', account_holder: '', type: 'Bank', qris_url: '' });

  const fetchMethods = async () => {
    try {
      const { data: m, error } = await supabase.from('payment_methods').select('id,name,type,account_number,account_holder,qris_url,is_active');
      if (error) throw error;
      setMethods(m || []);
    } catch (error: any) {
      setError(error.message || 'Gagal memuat metode pembayaran.');
    }
  };

  useEffect(() => { fetchMethods(); }, []);

  const handleQRUpload = async (file: any) => {
    if (!file) return;
    setError('');
    const invalid = validateImageFile(file);
    if (invalid) { setError(invalid); return; }
    try {
      setLoading(true);
      const fileName = `qris_${Date.now()}`;
      const { error } = await supabase.storage.from('products').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
      setData({ ...data, qris_url: publicUrl });
    } catch (e: any) { setError(e.message || 'Upload QRIS gagal.'); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    setError('');
    const { error } = await supabase.from('payment_methods').insert([data]);
    if (error) { setError(error.message); return; }
    setData({ name: '', account_number: '', account_holder: '', type: 'Bank', qris_url: '' });
    fetchMethods();
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold italic">Metode Pembayaran</h2>
      {error && <p className="text-sm text-red-600 font-bold">{error}</p>}
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
               <input type="file" accept="image/jpeg,image/png,image/webp" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleQRUpload(e.target.files?.[0])} />
             </div>
           )}
           <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg disabled:opacity-60">Tambah Metode</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {methods.map(m => (
          <div key={m.id} className="bg-white p-6 rounded-3xl border shadow-sm relative group">
            <button className="absolute top-4 right-4 text-red-500" onClick={async () => { const { error } = await supabase.from('payment_methods').delete().eq('id', m.id); if (error) { setError(error.message); return; } fetchMethods(); }}><Trash2 size={16}/></button>
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
