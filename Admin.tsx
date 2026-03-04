import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PEMAIN' | 'TRANSAKSI' | 'SISTEM' | 'ADMIN BANK'>('DASHBOARD');
  const [players, setPlayers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [adminBanks, setAdminBanks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingQris, setUploadingQris] = useState(false);
  
  const [searchPlayer, setSearchPlayer] = useState("");
  const [searchTrx, setSearchTrx] = useState("");
  
  const [sysConfig, setSysConfig] = useState({
    headerName: "",
    accentColor: "#EAB308",
    bannerTitle: "",
    bannerSub: "",
    logoUrl: "",
    qrisUrl: "",
    bannerImages: ["", "", ""]
  });

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPass, setNewPass] = useState("");
  const [winRate, setWinRate] = useState(50);
  const [bankForm, setBankForm] = useState({ bank_name: '', account_number: '', holder_name: '' });

  const stats = {
    totalPlayers: players.length,
    totalBalance: players.reduce((acc, curr) => acc + (curr.balance || 0), 0),
    totalDeposit: transactions.filter(t => t.type === 'DEPOSIT' && t.status === 'SUCCESS').reduce((acc, curr) => acc + (curr.amount || 0), 0),
    totalWithdraw: transactions.filter(t => t.type === 'WITHDRAW' && t.status === 'SUCCESS').reduce((acc, curr) => acc + (curr.amount || 0), 0),
    pendingTransactions: transactions.filter(t => t.status === 'PENDING').length
  };

  const fetchData = useCallback(async () => {
    const { data: pData } = await supabase.from('players').select('*').order('created_at', { ascending: false });
    const { data: tData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    const { data: bData } = await supabase.from('admin_banks').select('*').order('bank_name', { ascending: true });
    if (pData) setPlayers(pData);
    if (tData) setTransactions(tData);
    if (bData) setAdminBanks(bData);
  }, []);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const configObj: any = { bannerImages: ["", "", ""] };
      data.forEach(item => {
        if (item.key === 'header_name') configObj.headerName = item.value;
        if (item.key === 'banner_title') configObj.bannerTitle = item.value;
        if (item.key === 'banner_sub') configObj.bannerSub = item.value;
        if (item.key === 'accent_color') configObj.accentColor = item.value;
        if (item.key === 'logo_url') configObj.logoUrl = item.value;
        if (item.key === 'qris_url') configObj.qrisUrl = item.value;
        if (item.key === 'banner_image_1') configObj.bannerImages[0] = item.value;
        if (item.key === 'banner_image_2') configObj.bannerImages[1] = item.value;
        if (item.key === 'banner_image_3') configObj.bannerImages[2] = item.value;
      });
      setSysConfig(prev => ({ ...prev, ...configObj }));
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchSettings();

    // REAL-TIME ADMIN SYNC
    const adminChannel = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_banks' }, () => fetchData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings' }, () => fetchSettings())
      .subscribe();

    return () => { supabase.removeChannel(adminChannel); };
  }, [fetchData, fetchSettings]);

  const toggleBankStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('admin_banks').update({ is_active: !currentStatus }).eq('id', id);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingLogo(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('assets').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('assets').getPublicUrl(fileName);
      await supabase.from('settings').upsert({ key: 'logo_url', value: data.publicUrl }, { onConflict: 'key' });
      setSysConfig(prev => ({ ...prev, logoUrl: data.publicUrl }));
      alert("Logo Berhasil Diperbarui!");
    } catch (error: any) { alert("Gagal Upload Logo: " + error.message); } finally { setUploadingLogo(false); }
  };

  const handleQrisUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingQris(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileName = `qris-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('assets').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('assets').getPublicUrl(fileName);
      await supabase.from('settings').upsert({ key: 'qris_url', value: data.publicUrl }, { onConflict: 'key' });
      setSysConfig(prev => ({ ...prev, qrisUrl: data.publicUrl }));
      alert("QRIS Berhasil Diperbarui!");
    } catch (error: any) { alert("Gagal Upload QRIS: " + error.message); } finally { setUploadingQris(false); }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    try {
      setUploadingIdx(index);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileName = `banner-${index}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('assets').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('assets').getPublicUrl(fileName);
      const key = `banner_image_${index + 1}`;
      await supabase.from('settings').upsert({ key, value: data.publicUrl }, { onConflict: 'key' });
      const newImages = [...sysConfig.bannerImages];
      newImages[index] = data.publicUrl;
      setSysConfig(prev => ({ ...prev, bannerImages: newImages }));
      alert(`Banner ${index + 1} Berhasil Diupload!`);
    } catch (error: any) { alert("Gagal: " + error.message); } finally { setUploadingIdx(null); }
  };

  const updateAppVisual = async () => {
    setIsLoading(true);
    try {
      const updates = [
        { key: 'header_name', value: sysConfig.headerName },
        { key: 'banner_title', value: sysConfig.bannerTitle },
        { key: 'banner_sub', value: sysConfig.bannerSub },
        { key: 'accent_color', value: sysConfig.accentColor }
      ];
      for (const item of updates) { 
        await supabase.from('settings').upsert(item, { onConflict: 'key' }); 
      }
      alert("Visual Web Berhasil Diperbarui!");
    } catch (e: any) { alert("Gagal update: " + e.message); } finally { setIsLoading(false); }
  };

  const processTransaction = async (trx: any, status: 'SUCCESS' | 'REJECTED') => {
    if (status === 'SUCCESS' && trx.status === 'PENDING') {
      const player = players.find(p => p.username === trx.username);
      if (player) {
        let newBal = trx.type === 'DEPOSIT' ? player.balance + trx.amount : player.balance - trx.amount;
        if (newBal < 0) return alert("Saldo tidak cukup!");
        await supabase.from('players').update({ balance: newBal }).eq('username', trx.username);
      }
    }
    await supabase.from('transactions').update({ status }).eq('id', trx.id);
  };

  const updatePlayerSettings = async () => {
    if (!selectedUser) return alert("Pilih pemain dulu!");
    setIsLoading(true);
    const updates: any = { win_rate: winRate };
    if (newPass) updates.password = newPass;
    const { error } = await supabase.from('players').update(updates).eq('username', selectedUser.username);
    setIsLoading(false);
    if (!error) { alert("Update Berhasil!"); setNewPass(""); setSelectedUser(null); }
  };

  const handleAddAdminBank = async () => {
    if (!bankForm.bank_name || !bankForm.account_number) return alert("Isi data bank!");
    const { error } = await supabase.from('admin_banks').insert([{ ...bankForm, is_active: true }]);
    if (!error) { alert("Bank Berhasil Ditambahkan!"); setBankForm({ bank_name: '', account_number: '', holder_name: '' }); }
  };

  const deleteAdminBank = async (id: any) => {
    await supabase.from('admin_banks').delete().eq('id', id);
  };

  const filteredPlayers = (players || []).filter(p => 
    (p.username?.toLowerCase() || "").includes(searchPlayer.toLowerCase()) || 
    (p.account_number?.toString() || "").includes(searchPlayer)
  );

  const filteredTransactions = (transactions || []).filter(t => 
    (t.username?.toLowerCase() || "").includes(searchTrx.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-8 hidden md:flex shadow-sm">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
            {sysConfig.logoUrl ? (
                <img src={sysConfig.logoUrl} className="w-full h-full object-cover" alt="Logo" />
            ) : (
                <span className="font-black text-white text-xl">{sysConfig.headerName[0] || 'N'}</span>
            )}
          </div>
          <h1 className="font-black text-slate-900 uppercase tracking-tighter text-xl">{sysConfig.headerName || "NEXUSHUB"}</h1>
        </div>
        <nav className="space-y-2 flex-1">
          {['DASHBOARD', 'PEMAIN', 'TRANSAKSI', 'ADMIN BANK', 'SISTEM'].map((id: any) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === id ? 'bg-slate-900 text-white shadow-xl translate-x-2' : 'text-slate-400 hover:bg-slate-50'}`}>
              {id === 'DASHBOARD' ? '📊' : id === 'PEMAIN' ? '👥' : id === 'TRANSAKSI' ? '💳' : id === 'ADMIN BANK' ? '🏦' : '🛠️'} {id}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{activeTab}</h2>
          {(activeTab === 'PEMAIN' || activeTab === 'TRANSAKSI') && (
            <div className="relative w-full md:w-80">
              <input 
                type="text" 
                placeholder={`Cari di ${activeTab}...`}
                className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-slate-900 shadow-sm"
                value={activeTab === 'PEMAIN' ? searchPlayer : searchTrx}
                onChange={(e) => activeTab === 'PEMAIN' ? setSearchPlayer(e.target.value) : setSearchTrx(e.target.value)}
              />
              <span className="absolute right-4 top-4 opacity-30">🔍</span>
            </div>
          )}
        </header>

        {activeTab === 'DASHBOARD' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Pemain</p><h3 className="text-3xl font-black">{stats.totalPlayers}</h3></div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Saldo Player</p><h3 className="text-3xl font-black text-emerald-600">IDR {stats.totalBalance.toLocaleString()}</h3></div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Deposit</p><h3 className="text-3xl font-black text-blue-600">IDR {stats.totalDeposit.toLocaleString()}</h3></div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Withdraw</p><h3 className="text-3xl font-black text-orange-600">IDR {stats.totalWithdraw.toLocaleString()}</h3></div>
            </div>
          </div>
        )}

        {activeTab === 'SISTEM' && (
          <div className="grid md:grid-cols-1 gap-10 animate-in fade-in">
             <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                <h4 className="text-[11px] font-black uppercase border-l-4 border-slate-900 pl-4 mb-8">Identity & Banner Manager</h4>
                
                <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200 mb-8">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-4">Official Logo (Recommended 512x512 PNG)</label>
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-white rounded-2xl border flex items-center justify-center overflow-hidden relative shadow-inner">
                            {sysConfig.logoUrl ? <img src={sysConfig.logoUrl} className="w-full h-full object-contain" alt="Logo Preview" /> : <span className="text-[10px] font-black text-slate-300">NO LOGO</span>}
                            {uploadingLogo && <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-[8px] font-black animate-pulse">UPLOADING...</div>}
                        </div>
                        <div className="flex-1">
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-[10px] font-black block w-full mb-2" />
                            <p className="text-[9px] text-slate-400 italic">Logo ini akan muncul di Navbar User dan Admin.</p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                   {sysConfig.bannerImages.map((img, idx) => (
                     <div key={idx} className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Banner Slide {idx + 1}</label>
                        <div className="w-full h-32 bg-slate-100 rounded-2xl overflow-hidden border flex items-center justify-center relative">
                            {img ? <img src={img} className="w-full h-full object-cover" alt="Banner" /> : <span className="text-[10px] font-black text-slate-400">KOSONG</span>}
                            {uploadingIdx === idx && <div className="absolute inset-0 bg-white/50 flex items-center justify-center text-[10px] font-black uppercase">Uploading...</div>}
                        </div>
                        <input type="file" accept="image/*" onChange={(e) => handleBannerUpload(e, idx)} className="text-[10px] font-black w-full" />
                     </div>
                   ))}
                </div>
                <hr className="my-6" />
                <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <label className="text-[9px] font-black text-slate-400 uppercase">App Name</label>
                      <input type="text" className="w-full bg-slate-50 border p-4 rounded-2xl font-bold uppercase outline-none focus:ring-2 ring-slate-200" value={sysConfig.headerName} onChange={(e) => setSysConfig({...sysConfig, headerName: e.target.value})} />
                      <input type="text" placeholder="Banner Title" className="w-full bg-slate-50 border p-4 rounded-2xl font-bold outline-none focus:ring-2 ring-slate-200" value={sysConfig.bannerTitle} onChange={(e) => setSysConfig({...sysConfig, bannerTitle: e.target.value})} />
                      <input type="text" placeholder="Banner Subtitle" className="w-full bg-slate-50 border p-4 rounded-2xl font-bold outline-none focus:ring-2 ring-slate-200" value={sysConfig.bannerSub} onChange={(e) => setSysConfig({...sysConfig, bannerSub: e.target.value})} />
                      <button onClick={updateAppVisual} disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-black transition-all">
                        {isLoading ? "UPDATING..." : "PUSH UPDATE TEXT"}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'ADMIN BANK' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100">
                    <h4 className="text-[11px] font-black uppercase mb-6">Pengaturan Pembayaran QRIS</h4>
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="w-48 h-48 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative">
                            {sysConfig.qrisUrl ? <img src={sysConfig.qrisUrl} className="w-full h-full object-contain" alt="QRIS" /> : <span className="text-[10px] font-black text-slate-400">QRIS BELUM ADA</span>}
                            {uploadingQris && <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-[10px] font-black animate-pulse">UPLOADING...</div>}
                        </div>
                        <div className="flex-1 space-y-4">
                            <p className="text-xs text-slate-500 font-bold uppercase italic leading-relaxed">
                                Upload gambar QRIS toko Anda di sini. Gambar ini akan muncul di daftar bank deposit pemain.
                            </p>
                            <input type="file" accept="image/*" onChange={handleQrisUpload} className="text-[10px] font-black block w-full" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-100">
                    <h4 className="text-[11px] font-black uppercase mb-6">Tambah Rekening Deposit Admin</h4>
                    <div className="grid md:grid-cols-4 gap-4">
                        <input type="text" placeholder="Bank Name (Contoh: BCA / DANA)" className="bg-slate-50 p-4 rounded-xl font-bold outline-none" value={bankForm.bank_name} onChange={e => setBankForm({...bankForm, bank_name: e.target.value})} />
                        <input type="text" placeholder="Nomor Rekening" className="bg-slate-50 p-4 rounded-xl font-bold outline-none" value={bankForm.account_number} onChange={e => setBankForm({...bankForm, account_number: e.target.value})} />
                        <input type="text" placeholder="Nama Pemilik" className="bg-slate-50 p-4 rounded-xl font-bold outline-none" value={bankForm.holder_name} onChange={e => setBankForm({...bankForm, holder_name: e.target.value})} />
                        <button onClick={handleAddAdminBank} className="bg-slate-900 text-white rounded-xl font-black uppercase text-[10px]">Tambah</button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {adminBanks.map(b => (
                        <div key={b.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${b.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <div>
                                    <p className="font-black text-sm uppercase">{b.bank_name}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{b.account_number}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => toggleBankStatus(b.id, b.is_active)}
                                    className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${b.is_active ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}
                                >
                                    {b.is_active ? 'Matikan' : 'Aktifkan'}
                                </button>
                                <button onClick={() => deleteAdminBank(b.id)} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'PEMAIN' && (
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlayers.map(p => (
                   <div key={p.username} onClick={() => {setSelectedUser(p); setWinRate(p.win_rate)}} className={`p-6 rounded-3xl border transition-all cursor-pointer ${selectedUser?.username === p.username ? 'border-slate-900 bg-slate-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <p className="text-[10px] font-black uppercase text-slate-400">Username</p>
                      <p className="font-black text-lg">{p.username}</p>
                      <p className="text-[10px] font-bold text-blue-500 uppercase">{p.bank_name} - {p.account_number}</p>
                      <div className="flex justify-between mt-4">
                         <div><p className="text-[8px] font-black text-slate-400 uppercase">Balance</p><p className="font-mono font-bold text-emerald-600">IDR {p.balance.toLocaleString()}</p></div>
                         <div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase">Win Rate</p><p className="font-mono font-bold text-blue-600">{p.win_rate}%</p></div>
                      </div>
                   </div>
                ))}
             </div>
             {selectedUser && (
                <div className="mt-10 p-8 bg-slate-900 rounded-[2.5rem] text-white animate-in slide-in-from-bottom-5">
                   <h3 className="font-black italic uppercase text-xl mb-6">Edit: {selectedUser.username}</h3>
                   <div className="grid md:grid-cols-3 gap-6">
                      <div><label className="text-[9px] font-black uppercase text-slate-500">Ganti Password</label><input type="text" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full bg-white/10 p-4 rounded-xl mt-2 outline-none border border-white/10" placeholder="Password Baru" /></div>
                      <div><label className="text-[9px] font-black uppercase text-slate-500">Win Rate (%)</label><input type="number" value={winRate} onChange={(e) => setWinRate(Number(e.target.value))} className="w-full bg-white/10 p-4 rounded-xl mt-2 outline-none border border-white/10" /></div>
                      <div className="flex items-end"><button onClick={updatePlayerSettings} className="w-full bg-yellow-500 text-black font-black py-4 rounded-xl uppercase text-[10px] hover:bg-yellow-400">Simpan Perubahan</button></div>
                   </div>
                </div>
             )}
          </div>
        )}

        {activeTab === 'TRANSAKSI' && (
          <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden">
             <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 uppercase font-black text-[9px]">
                    <tr><th className="p-6">User / Info Bank</th><th className="p-6">Type</th><th className="p-6">Amount</th><th className="p-6">Status</th><th className="p-6 text-right">Action</th></tr>
                </thead>
                <tbody>
                   {filteredTransactions.map(trx => (
                      <tr key={trx.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                         <td className="p-6">
                            <p className="font-black">{trx.username}</p>
                            <p className="text-[9px] text-slate-400 italic">{trx.note}</p>
                         </td>
                         <td className="p-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black ${trx.type === 'DEPOSIT' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>{trx.type}</span></td>
                         <td className="p-6 font-mono font-bold tracking-tighter">IDR {trx.amount.toLocaleString()}</td>
                         <td className="p-6"><span className={`text-[9px] font-black ${trx.status === 'SUCCESS' ? 'text-emerald-500' : trx.status === 'REJECTED' ? 'text-red-500' : 'text-yellow-600'}`}>{trx.status}</span></td>
                         <td className="p-6 text-right">
                            {trx.status === 'PENDING' && (
                               <div className="flex justify-end gap-2">
                                  <button onClick={() => processTransaction(trx, 'SUCCESS')} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-emerald-600 transition-all">Approve</button>
                                  <button onClick={() => processTransaction(trx, 'REJECTED')} className="bg-red-500 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-red-600 transition-all">Reject</button>
                               </div>
                            )}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </main>
    </div>
  );
}
