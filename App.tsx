import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const PROVIDERS = ["ALL", "PRAGMATIC", "PG SOFT", "HABANERO", "PLAY'N GO", "SPADEGAMING", "CQ9", "JOKER", "BETSOFT", "NETENT"];

const GAMES = [
  { id: 'vs20olympgate', name: 'Gates of Olympus', provider: 'PRAGMATIC', image: 'https://lh3.googleusercontent.com/d/1CBo5CmOLpgRE4DMomoMnH9xt3ceSkyB9', rtp: 98.5, demoUrl: 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs20olympgate&lang=en&cur=IDR' },
  { id: 'vs20starlight', name: 'Starlight Princess', provider: 'PRAGMATIC', image: 'https://lh3.googleusercontent.com/d/1ka_74DGK4T2hCgotjWAYM6t_seA1KpmQ', rtp: 96.2, demoUrl: 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs20starlight&lang=en&cur=IDR' },
  { id: 'mahjong-ways-2', name: 'Mahjong Ways 2', provider: 'PG SOFT', image: 'https://lh3.googleusercontent.com/d/1mU1Hjt1zX6ZdX9LR4KxKVkX0cJO3PQ4P', rtp: 97.1, demoUrl: 'https://m.pgsoft-games.com/126/index.html' },
  { id: 'lucky-neko', name: 'Lucky Neko', provider: 'PG SOFT', image: 'https://lh3.googleusercontent.com/d/1yX4r5AyxtAnMBXnrLn_FdUYSDw1wNAae', rtp: 96.7, demoUrl: 'https://m.pgsoft-games.com/125/index.html' },
  { id: 'koigate', name: 'Koi Gate', provider: 'HABANERO', image: 'https://lh3.googleusercontent.com/d/1iqfb47e0jeaAPUSvHRnGsmkOrkFkkhtu', rtp: 98.2, demoUrl: 'https://demo-pff.hanabero.com/koi-gate' },
  { id: 'book-of-dead', name: 'Book of Dead', provider: "PLAY'N GO", image: 'https://lh3.googleusercontent.com/d/1oGBNf9yayXTaElyRvBpwb_XCT21Qnd3p', rtp: 96.2, demoUrl: 'https://www.playngo.com/games/book-of-dead' },
  { id: 'brothers-kingdom', name: 'Brothers Kingdom', provider: 'SPADEGAMING', image: 'https://lh3.googleusercontent.com/d/1QIXTkNy81kNkATDbLRNtJJS65hmN-0ph', rtp: 97.0, demoUrl: 'https://demo.spadegaming.com/detail/brothers_kingdom' },
  { id: 'jump-high-2', name: 'Jump High 2', provider: 'CQ9', image: 'https://lh3.googleusercontent.com/d/1ynQaTvuJ18gWvmj3mwojSJ-mLg3n66uI', rtp: 96.0, demoUrl: 'https://demo.cq9gaming.com/' },
  { id: 'roma', name: 'Roma', provider: 'JOKER', image: 'https://lh3.googleusercontent.com/d/1mER0QZ1NzBQQxeZrHxFlIKWAwZoo5wZe', rtp: 95.8, demoUrl: 'https://www.jokerapp666.com/game/roma' },
  { id: 'sugar-pop-2', name: 'Sugar Pop 2', provider: 'BETSOFT', image: 'https://lh3.googleusercontent.com/d/1B23sQQ7yetsivlxTz85bzsGQDQEVkOZd', rtp: 96.4, demoUrl: 'https://betsoft.com/games/sugar-pop-2/' },
  { id: 'starburst', name: 'Starburst', provider: 'NETENT', image: 'https://lh3.googleusercontent.com/d/1HDX2RGKSaH5KXN-RsfphvobeAN4laKCH', rtp: 96.1, demoUrl: 'https://games.netent.com/video-slots/starburst/' },
];

const BANK_LIST = ["BCA", "BNI", "BRI", "MANDIRI", "DANA", "OVO", "GOPAY"];

export default function App() {
  const [activeView, setActiveView] = useState<'HOME' | 'LOGIN' | 'REGISTER' | 'DEPOSIT' | 'WITHDRAW'>('HOME');
  const [user, setUser] = useState<{username: string, balance: number, win_rate?: number, bank_name?: string, account_number?: string} | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [latestDeposits, setLatestDeposits] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [jackpot, setJackpot] = useState(8234567890);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedGameUrl, setSelectedGameUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQrisPayment, setShowQrisPayment] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', amount: '', bank_name: 'BCA', account_number: '', target_bank: '' });
  const [adminBanks, setAdminBanks] = useState<any[]>([]);

  const [config, setConfig] = useState({
    headerName: 'NEXUSHUB',
    bannerTitle: 'BONUS NEW MEMBER 100%',
    bannerSub: 'Berlaku untuk Semua Provider Slot',
    logoUrl: '',
    qrisUrl: '',
    bannerImages: [] as string[]
  });

  const fetchSettings = async () => {
    const { data: settings } = await supabase.from('settings').select('*');
    if (settings) {
      const newConfig: any = { ...config, bannerImages: [] };
      const imgs = ["", "", ""];
      settings.forEach(item => {
        if (item.key === 'header_name') newConfig.headerName = item.value;
        if (item.key === 'banner_title') newConfig.bannerTitle = item.value;
        if (item.key === 'banner_sub') newConfig.bannerSub = item.value;
        if (item.key === 'logo_url') newConfig.logoUrl = item.value;
        if (item.key === 'qris_url') newConfig.qrisUrl = item.value;
        if (item.key === 'banner_image_1') imgs[0] = item.value;
        if (item.key === 'banner_image_2') imgs[1] = item.value;
        if (item.key === 'banner_image_3') imgs[2] = item.value;
      });
      newConfig.bannerImages = imgs.filter(i => i !== "");
      setConfig(newConfig);
    }
    const { data: banks } = await supabase.from('admin_banks').select('*').order('bank_name', { ascending: true });
    if (banks) {
      setAdminBanks(banks);
      const activeBanks = banks.filter(b => b.is_active);
      if (activeBanks.length > 0 && !formData.target_bank) {
        setFormData(prev => ({...prev, target_bank: `${activeBanks[0].bank_name} - ${activeBanks[0].account_number}`}));
      }
    }
  };

  const fetchRunningTextData = async () => {
    const { data } = await supabase.from('transactions').select('username, amount').eq('status', 'SUCCESS').eq('type', 'DEPOSIT').order('created_at', { ascending: false }).limit(10);
    if (data) setLatestDeposits(data);
  };

  const fetchUser = async (username: string) => {
    const { data } = await supabase.from('players').select('*').eq('username', username).single();
    if (data) setUser(data);
  };

  const fetchHistory = async (username: string) => {
    const { data } = await supabase.from('transactions').select('*').eq('username', username).order('created_at', { ascending: false }).limit(10);
    if (data) setHistory(data);
  };

  useEffect(() => {
    fetchSettings();
    fetchRunningTextData();
    const saved = localStorage.getItem('nexus_session');
    if (saved) fetchUser(saved);

    const jTimer = setInterval(() => setJackpot(prev => prev + Math.floor(Math.random() * 5000)), 2000);

    const settingsChannel = supabase.channel('realtime-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => fetchSettings())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_banks' }, () => fetchSettings())
      .subscribe();

    const clientChannel = supabase.channel('realtime-client')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players' }, (payload: any) => {
        const currentSession = localStorage.getItem('nexus_session');
        if (payload.new.username === currentSession) setUser(payload.new);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload: any) => {
        const currentSession = localStorage.getItem('nexus_session');
        fetchRunningTextData();
        if (currentSession && (payload.new?.username === currentSession || payload.old?.username === currentSession)) fetchHistory(currentSession);
      })
      .subscribe();

    return () => { 
      clearInterval(jTimer); 
      supabase.removeChannel(settingsChannel); 
      supabase.removeChannel(clientChannel);
    };
  }, []);

  useEffect(() => {
    if (config.bannerImages.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % config.bannerImages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [config.bannerImages]);

  const handleAuth = async (type: 'LOGIN' | 'REGISTER') => {
    setIsLoading(true);
    if (type === 'REGISTER') {
      const { error } = await supabase.from('players').insert([{ 
        username: formData.username, password: formData.password, bank_name: formData.bank_name, account_number: formData.account_number, balance: 0, win_rate: 50 
      }]);
      if (error) alert("Username sudah terpakai!"); else alert("Berhasil! Silakan Login.");
    } else {
      const { data } = await supabase.from('players').select('*').eq('username', formData.username).eq('password', formData.password).single();
      if (data) { 
        setUser(data); localStorage.setItem('nexus_session', data.username); fetchHistory(data.username); setActiveView('HOME'); 
      } else alert("Login Gagal!");
    }
    setIsLoading(false);
  };

  const handleTransaction = async () => {
    if (!user || !formData.amount || Number(formData.amount) < 25000) return alert("Minimal IDR 25,000!");
    
    // Jika memilih QRIS tapi belum bayar, munculkan gambar QRIS dulu
    if (activeView === 'DEPOSIT' && formData.target_bank === 'QRIS' && !showQrisPayment) {
        setShowQrisPayment(true);
        return;
    }

    setIsLoading(true);
    const note = activeView === 'DEPOSIT' ? `Ke: ${formData.target_bank}` : `Ke Rek: ${user.bank_name} ${user.account_number}`;
    const { error } = await supabase.from('transactions').insert([{ username: user.username, type: activeView, amount: Number(formData.amount), status: 'PENDING', note }]);
    setIsLoading(false);
    
    if (error) alert("Gagal: " + error.message);
    else { 
        alert(`Permintaan ${activeView} Dikirim!`); 
        setFormData({ ...formData, amount: '' }); 
        setShowQrisPayment(false);
        setActiveView('HOME'); 
    }
  };

  const openGame = (gameUrl: string) => {
    if (!user) { setActiveView('LOGIN'); return; }
    if (user.balance < 1000) { alert("Saldo anda tidak mencukupi!"); setActiveView('DEPOSIT'); return; }
    setIsLoading(true);
    setTimeout(() => { setSelectedGameUrl(gameUrl); setIsLoading(false); }, 1500);
  };

  const filteredGames = activeTab === "ALL" ? GAMES : GAMES.filter(g => g.provider === activeTab);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-40 overflow-x-hidden selection:bg-yellow-500">
      
      {/* RUNNING TEXT */}
<div className="bg-yellow-500 text-black py-1.5 overflow-hidden whitespace-nowrap border-b border-yellow-600 text-[10px] font-black uppercase tracking-widest flex relative">
  {/* Gunakan Flex agar teks menyambung rata */}
  <div className="flex animate-marquee whitespace-nowrap">
    
    {/* Bagian 1 */}
    <div className="flex items-center">
      <span className="mx-4">SITUS RESMI {config.headerName} ● SETORAN TERAKHIR:</span>
      {latestDeposits.length > 0 ? latestDeposits.map((ld, i) => (
        <span key={`a-${i}`} className="ml-4">{ld.username.substring(0,3)}*** - IDR {ld.amount.toLocaleString()} ✅ ●</span>
      )) : <span className="ml-4">MEMPROSES TRANSAKSI... ●</span>}
      <span className="ml-4 text-red-600">DEPOSIT QRIS OTOMATIS ● WD CEPAT ●</span>
    </div>

    {/* Bagian 2 (Duplikat Persis agar tidak ada layar kosong) */}
    <div className="flex items-center">
      <span className="mx-4">SITUS RESMI {config.headerName} ● SETORAN TERAKHIR:</span>
      {latestDeposits.length > 0 ? latestDeposits.map((ld, i) => (
        <span key={`b-${i}`} className="ml-4">{ld.username.substring(0,3)}*** - IDR {ld.amount.toLocaleString()} ✅ ●</span>
      )) : <span className="ml-4">MEMPROSES TRANSAKSI... ●</span>}
      <span className="ml-4 text-red-600">DEPOSIT QRIS OTOMATIS ● WD CEPAT ● WINRATE ADMIN AKTIF ●</span>
    </div>

  </div>
</div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-[#020617]/95 backdrop-blur-xl border-b border-white/5 px-6 h-16 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveView('HOME')}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
            {config.logoUrl ? (
                <img src={config.logoUrl} className="w-full h-full object-contain" alt="Logo" />
            ) : (
                <span className="font-black text-black">{config.headerName[0]}</span>
            )}
          </div>
          <h1 className="font-black text-white italic uppercase tracking-tighter text-xl">{config.headerName}</h1>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowHistory(true)} className="w-10 h-10 bg-slate-900/80 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors">🕒</button>
              <div className="bg-slate-900/80 px-4 py-2 rounded-2xl border border-white/10 hidden md:block text-center shadow-inner">
                <p className="text-[8px] text-slate-500 font-black uppercase">ID: {user.username}</p>
                <p className="text-sm font-black text-emerald-400 font-mono italic tracking-tighter">IDR {user.balance.toLocaleString('id-ID')}</p>
              </div>
              <button onClick={() => { localStorage.removeItem('nexus_session'); setUser(null); }} className="bg-red-600/10 text-red-500 border border-red-600/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Logout</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setActiveView('LOGIN')} className="text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Masuk</button>
              <button onClick={() => setActiveView('REGISTER')} className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase">Daftar</button>
            </div>
          )}
        </div>
      </nav>

      {/* BANNER SLIDER */}
      {activeView === 'HOME' && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className="relative w-full h-44 md:h-64 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
            {config.bannerImages.length > 0 ? (
              config.bannerImages.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  style={{ backgroundImage: `url('${img}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-8 left-8 z-20">
                    <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase drop-shadow-2xl">{config.bannerTitle}</h2>
                    <p className="text-sm text-yellow-500 mt-2 font-bold uppercase tracking-widest">{config.bannerSub}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center">
                 <h2 className="text-3xl font-black italic text-white/20 uppercase">{config.headerName}</h2>
              </div>
            )}
            
            <div className="absolute bottom-4 right-8 z-20 flex gap-2">
              {config.bannerImages.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-yellow-500' : 'w-2 bg-white/30'}`}></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW COMPONENTS */}
      {activeView === 'LOGIN' || activeView === 'REGISTER' ? (
        <div className="max-w-md mx-auto px-6 mt-12 animate-in fade-in zoom-in duration-300">
           <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-center">
              <h2 className="text-2xl font-black text-white italic uppercase mb-6 tracking-tighter">{activeView} AKUN</h2>
              <div className="space-y-4">
                 <input type="text" placeholder="Username" onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none text-center text-white" />
                 <input type="password" placeholder="Password" onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none text-center text-white" />
                 {activeView === 'REGISTER' && (
                    <>
                    <select onChange={(e) => setFormData({...formData, bank_name: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none text-white text-center font-black">
                        {BANK_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <input type="text" placeholder="Nomor Rekening" onChange={(e) => setFormData({...formData, account_number: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none text-center text-white" />
                    </>
                 )}
                 <button onClick={() => handleAuth(activeView)} className="w-full bg-yellow-500 text-black py-4 rounded-2xl font-black uppercase tracking-widest mt-4">Konfirmasi</button>
                 <button onClick={() => setActiveView('HOME')} className="text-[10px] text-slate-500 uppercase font-black block w-full mt-4">Kembali</button>
              </div>
           </div>
        </div>
      ) : activeView === 'DEPOSIT' || activeView === 'WITHDRAW' ? (
        <div className="max-w-md mx-auto px-6 mt-8 animate-in slide-in-from-bottom-10">
           <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl text-center">
              <h2 className="text-2xl font-black text-white italic uppercase mb-8 tracking-tighter">{activeView} SALDO</h2>
              <div className="space-y-6 text-left">
                 {activeView === 'DEPOSIT' && (
                    <div className="space-y-4">
                        {/* INTRUKSI QRIS MUNCUL SETELAH KLIK KIRIM */}
                        {showQrisPayment && config.qrisUrl && formData.target_bank === 'QRIS' && (
                            <div className="bg-white p-4 rounded-3xl flex flex-col items-center gap-2 shadow-xl border-4 border-yellow-500 animate-in zoom-in duration-300">
                                <p className="text-[9px] font-black text-slate-900 uppercase">Scan QRIS Untuk Pembayaran</p>
                                <img src={config.qrisUrl} alt="QRIS" className="w-full h-auto rounded-lg" />
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <p className="text-[8px] font-black text-slate-500 uppercase italic">Konfirmasi setelah membayar!</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Pilih Metode Deposit:</label>
                            <select 
                                value={formData.target_bank}
                                onChange={(e) => {
                                    setFormData({...formData, target_bank: e.target.value});
                                    setShowQrisPayment(false);
                                }} 
                                className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none text-yellow-500 font-bold"
                            >
                                {config.qrisUrl && <option value="QRIS">QRIS - OTOMATIS 24 JAM</option>}
                                {adminBanks.filter(b => b.is_active).map(b => (
                                    <option key={b.id} value={`${b.bank_name} - ${b.account_number}`}>
                                        {b.bank_name} ({b.account_number}) A/N {b.holder_name}
                                    </option>
                                ))}
                                {adminBanks.filter(b => b.is_active).length === 0 && !config.qrisUrl && <option>Semua Bank Offline</option>}
                            </select>
                        </div>
                    </div>
                 )}
                 <div className="bg-black/50 p-6 rounded-3xl border border-white/5 shadow-inner">
                    <label className="text-[9px] font-black uppercase text-slate-500 block text-center mb-2">Jumlah (Minimal 25.000)</label>
                    <input type="number" placeholder="0" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full bg-transparent text-center text-3xl font-black text-yellow-500 outline-none" />
                 </div>
                 <button onClick={handleTransaction} className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/20">
                    {showQrisPayment ? "SAYA SUDAH MEMBAYAR" : "Kirim Permintaan"}
                 </button>
                 <button onClick={() => {setActiveView('HOME'); setShowQrisPayment(false);}} className="text-center text-[10px] text-slate-500 font-black uppercase w-full block">Batal</button>
              </div>
           </div>
        </div>
      ) : (
        <>
          <div className="max-w-7xl mx-auto px-6 mt-6">
            <div className="bg-gradient-to-b from-slate-900 to-black rounded-3xl p-6 border border-yellow-500/20 text-center shadow-2xl">
              <p className="text-yellow-500 font-black text-[9px] uppercase tracking-[0.5em] mb-2 opacity-70">Global Jackpot</p>
              <h2 className="text-4xl md:text-6xl font-black text-white font-mono tracking-tighter italic">IDR {jackpot.toLocaleString('id-ID')}</h2>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 mt-8 flex gap-3">
             <button onClick={() => user ? setActiveView('DEPOSIT') : setActiveView('LOGIN')} className="flex-1 bg-emerald-600/10 border border-emerald-600/20 p-4 rounded-3xl text-center group hover:bg-emerald-600/20 transition-all">
                <p className="text-xs font-black text-emerald-400 uppercase italic">Deposit</p>
             </button>
             <button onClick={() => user ? setActiveView('WITHDRAW') : setActiveView('LOGIN')} className="flex-1 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-3xl text-center group hover:bg-yellow-500/20 transition-all">
                <p className="text-xs font-black text-yellow-500 uppercase italic">Withdraw</p>
             </button>
          </div>

          <div className="max-w-7xl mx-auto px-6 mt-10 overflow-x-auto no-scrollbar flex gap-2">
            {PROVIDERS.map(p => (
              <button key={p} onClick={() => setActiveTab(p)} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase border whitespace-nowrap transition-all ${activeTab === p ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-slate-900 text-slate-400 border-white/5'}`}>{p}</button>
            ))}
          </div>

          <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5 font-black uppercase pb-10">
            {filteredGames.map((game) => (
              <div key={game.id} onClick={() => openGame(game.demoUrl)} className="group cursor-pointer">
                <div className="relative aspect-[3/4] rounded-[2.5rem] bg-slate-900 border border-white/5 overflow-hidden transition-all duration-500 group-hover:border-yellow-500/50 group-hover:-translate-y-2 shadow-xl shadow-black/50">
                  <img src={game.image} alt={game.name} loading="lazy" onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/300x400/020617/yellow?text=SLOT'; }} className="w-full h-full object-cover brightness-90 group-hover:brightness-110 group-hover:scale-110 transition-all duration-700" />
                  <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black via-black/80 to-transparent text-center">
                    <p className="text-[9px] font-black text-emerald-400 uppercase">RTP {game.rtp}%</p>
                  </div>
                </div>
                <h4 className="mt-3 text-[10px] font-black text-center text-slate-400 uppercase truncate px-2 group-hover:text-yellow-500">{game.name}</h4>
              </div>
            ))}
          </div>
        </>
      )}

      {/* FOOTER BANK STATUS (RELATIVE POSITION) */}
      <footer className="relative bg-[#020617]/95 backdrop-blur-2xl border-t border-white/10 py-8 px-6 mt-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap justify-center gap-3">
            {adminBanks.map(b => (
              <div key={b.id} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <div className="relative w-8 h-5 bg-white rounded border border-white flex items-center justify-center p-0.5 overflow-hidden">
                   <span className="text-[7px] font-black text-black leading-none">{b.bank_name}</span>
                   <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-900 ${b.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                </div>
                <span className={`text-[8px] font-black uppercase ${b.is_active ? 'text-emerald-400' : 'text-red-500'}`}>
                  {b.is_active ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
            {config.qrisUrl && (
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <div className="relative w-8 h-5 bg-white rounded border border-white flex items-center justify-center p-0.5 overflow-hidden text-[7px] font-black text-black">
                    QRIS
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-900 bg-emerald-500 animate-pulse"></div>
                </div>
                <span className="text-[8px] font-black uppercase text-emerald-400">Online</span>
              </div>
            )}
          </div>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">
            © 2026 {config.headerName} - Trusted Entertainment Platform
          </p>
        </div>
      </footer>

      {/* HISTORY MODAL */}
      <div className={`fixed inset-y-0 right-0 z-[120] w-80 bg-slate-900 border-l border-white/10 shadow-2xl transform transition-transform duration-500 ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-xs font-black text-white uppercase italic">History</h3>
               <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white font-black">✕</button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
               {history.length > 0 ? history.map(trx => (
                  <div key={trx.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${trx.status === 'SUCCESS' ? 'bg-emerald-500' : trx.status === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-600'}`}></div>
                    <p className={`text-[10px] font-black uppercase ${trx.type === 'DEPOSIT' ? 'text-blue-400' : 'text-orange-400'}`}>{trx.type}</p>
                    <p className="text-sm font-black text-white font-mono italic">IDR {trx.amount.toLocaleString()}</p>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold ${trx.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{trx.status}</span>
                  </div>
               )) : <p className="text-center text-slate-500 text-[10px] font-bold">BELUM ADA TRANSAKSI</p>}
            </div>
          </div>
      </div>

      {selectedGameUrl && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="h-12 bg-slate-950 flex justify-between items-center px-6 border-b border-white/10">
            <p className="text-[10px] font-black text-yellow-500 uppercase italic">Winrate Engine: {user?.win_rate}% Active</p>
            <button onClick={() => setSelectedGameUrl(null)} className="bg-red-600 text-white px-4 py-1 rounded text-[10px] font-black uppercase">Exit</button>
          </div>
          <iframe src={selectedGameUrl} className="flex-1 w-full border-none" allowFullScreen />
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.5em] animate-pulse">Connecting Engine...</p>
        </div>
      )}

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 60s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .animate-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
