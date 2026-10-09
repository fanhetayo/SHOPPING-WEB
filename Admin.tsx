import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, MessageSquare, Landmark, Settings } from 'lucide-react';
import { DashboardSection, ProductSection, BankSection, OrderSection, AnalyticsSection, WAGatewaySection, SettingsSection } from './components/admin/AdminSections';

export default function Admin() {
  const [view, setView] = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) { setIsAdmin(false); setAuthLoading(false); return; }
        const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', session.user.id).maybeSingle();
        if (error) throw error;
        setIsAdmin(Boolean(data));
      } catch (error: any) {
        setIsAdmin(false);
        setAuthError(error.message || 'Gagal memeriksa akses admin.');
      } finally {
        setAuthLoading(false);
      }
    };
    checkAdmin();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setIsAdmin(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const userId = signInData.user?.id;
      if (!userId) throw new Error('Sesi login tidak valid.');
      const { data, error: adminError } = await supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
      if (adminError) throw adminError;
      if (!data) {
        await supabase.auth.signOut();
        throw new Error('Akun ini belum terdaftar sebagai admin.');
      }
      setIsAdmin(true);
    } catch (error: any) {
      setIsAdmin(false);
      setAuthError(error.message || 'Login admin gagal.');
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(error.message);
    setIsAdmin(false);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center font-bold">Memeriksa akses admin...</div>;
  if (!isAdmin) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl space-y-5">
        <h1 className="text-3xl font-black italic">Admin Login</h1>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email admin" className="w-full p-4 rounded-xl bg-slate-50 border outline-none" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full p-4 rounded-xl bg-slate-50 border outline-none" />
        {authError && <p className="text-sm text-red-600 font-bold">{authError}</p>}
        <button onClick={signIn} className="w-full bg-slate-900 text-white p-4 rounded-xl font-black uppercase">Masuk</button>
      </div>
    </div>
  );

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
        <button onClick={signOut} className="mt-6 w-full px-6 py-4 rounded-2xl bg-slate-800 text-slate-300 hover:text-white font-bold">Logout</button>
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

function SidebarLink({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      {icon} <span>{label}</span>
    </button>
  );
}
