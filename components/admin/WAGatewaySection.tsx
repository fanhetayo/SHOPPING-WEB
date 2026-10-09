import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Save } from 'lucide-react';

export function WAGatewaySection() {
  const [wa, setWa] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { supabase.from('settings').select('admin_phone').eq('id', 1).single().then(({data, error}) => error ? setError(error.message) : setWa(data?.admin_phone || '')); }, []);
  const save = async () => { const { error } = await supabase.from('settings').upsert({id:1, admin_phone: wa}); if (error) { setError(error.message); return; } alert('Saved!'); };
  return (
    <div className="max-w-2xl space-y-8">
      <h2 className="text-3xl font-bold italic">WA Gateway</h2>
      {error && <p className="text-sm text-red-600 font-bold">{error}</p>}
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
