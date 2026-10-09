import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import {
  ShoppingBag, Search, MessageCircle,
  ChevronRight, ArrowRight, User, X, CreditCard, Landmark, QrCode, ChevronLeft
} from 'lucide-react';
import { CartItem, CategoryCard, ImageSlider, ProductDisplay } from './components/storefront/StorefrontComponents';

declare global {
  interface Window {
    snap: { pay: (token: string, callbacks: Record<string, () => void>) => void } | undefined;
  }
}

type CartItemData = {
  id: string;
  title: string;
  price: number;
  selectedVariant?: string;
  cartId: string;
};

type PublicSettings = {
  store_name?: string;
  banner_url?: string;
  categories?: string[];
  admin_phone?: string;
  midtrans_client_key?: string;
  midtrans_environment?: 'sandbox' | 'production';
};

const snapScriptUrl = (environment?: string) =>
  environment === 'production'
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';

export default function App() {
  const [showCart, setShowCart] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItemData[]>([]);
  const [view, setView] = useState('shop'); // shop, checkout, detail
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [mainImage, setMainImage] = useState<string>('');
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const checkoutLock = useRef(false);
  const [snapReady, setSnapReady] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  useEffect(() => {
    const tawkScriptUrl = 'https://embed.tawk.to/69a85b337b02b21c3601f237/1jisr726s';
    const tawkScript = document.createElement('script');
    tawkScript.async = true;
    tawkScript.src = tawkScriptUrl;
    tawkScript.charset = 'UTF-8';
    tawkScript.setAttribute('crossorigin', '*');
    document.body.appendChild(tawkScript);

    return () => {
      document.querySelector(`script[src="${tawkScriptUrl}"]`)?.remove();
    };
  }, []);

  useEffect(() => {
    setSnapReady(false);
    window.snap = undefined;
    document.querySelectorAll('script[data-midtrans-snap="true"]').forEach(script => script.remove());
    if (!settings?.midtrans_client_key) return;

    const script = document.createElement('script');
    script.src = snapScriptUrl(settings.midtrans_environment);
    script.async = true;
    script.dataset.midtransSnap = 'true';
    script.onload = () => setSnapReady(Boolean(window.snap));
    script.onerror = () => setSnapReady(false);
    script.setAttribute('data-client-key', settings.midtrans_client_key);
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [settings?.midtrans_client_key, settings?.midtrans_environment]);

  useEffect(() => {
    const getData = async () => {
      const { data: settingsData } = await supabase.from('settings').select('store_name,banner_url,categories,admin_phone,midtrans_client_key,midtrans_environment').eq('id', 1).single();
      if (settingsData) setSettings(settingsData);
      const { data: p } = await supabase.from('products').select('id,title,price,description,category,image_url,images,variants,created_at').order('created_at', { ascending: false });
      if (p) setProducts(p);
      const { data: b } = await supabase.from('payment_methods').select('id,name,type,account_number,account_holder,qris_url,is_active').eq('is_active', true);
      if (b) setPaymentMethods(b);
    };
    getData();

    const sub = supabase.channel('api-realtime-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, getData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods' }, getData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
          supabase.from('settings').select('store_name,banner_url,categories,admin_phone,midtrans_client_key,midtrans_environment').eq('id', 1).single().then(({data}) => setSettings(data));
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const addToCart = (product: any, variant?: string) => {
    setCart(current => [...current, { id: product.id, title: product.title, price: product.price, selectedVariant: variant || product.variants?.[0]?.name || '', cartId: crypto.randomUUID() }]);
    setShowCart(true);
  };

  const removeFromCart = (cartId: any) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const totalPrice = cart.reduce((acc, curr) => acc + curr.price, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return alert("Keranjang kosong!");
    setShowCart(false);
    setView('checkout');
  };

  const openDetail = (product: any) => {
    setSelectedProduct(product);
    setSelectedVariant(product.variants?.[0]?.name || '');
    const initialImg = product.images?.[0] || product.image_url || product.image;
    setMainImage(initialImg);
    setView('detail');
    window.scrollTo(0,0);
  };

  const orderItems = () => cart.map(item => ({
    product_id: item.id,
    variant: item.selectedVariant || null,
    quantity: 1
  }));

  const createOrder = async (_paymentMethodName: string, action: 'manual-checkout' | 'create-snap') => {
    const payload = {
      action,
      customer: { name: customerName.trim(), phone: customerPhone.trim(), address: customerAddress.trim() },
      payment_method_id: selectedPayment.id,
      items: orderItems()
    };
    const fingerprint = JSON.stringify(payload);
    let previous: { fingerprint: string; key: string } | null = null;
    try { previous = JSON.parse(sessionStorage.getItem('checkout-attempt') || 'null'); } catch { /* Ignore invalid saved state. */ }
    const attempt = previous?.fingerprint === fingerprint ? previous : { fingerprint, key: crypto.randomUUID() };
    sessionStorage.setItem('checkout-attempt', JSON.stringify(attempt));
    const { data, error } = await supabase.functions.invoke('rapid-api', {
      body: { ...payload, checkout_key: attempt.key }
    });
    if (error) {
      let message = 'Gagal terhubung ke server checkout.';
      try { message = (await error.context.json()).error || message; } catch { /* Network errors may have no response body. */ }
      throw new Error(`${message} Referensi: ${attempt.key}`);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  };
  const handleConfirmPayment = async () => {
    if (!customerName || !customerAddress || !customerPhone || !selectedPayment) return alert('Mohon lengkapi data diri dan pilih metode pembayaran!');
    if (cart.length === 0 || checkoutLock.current) return;
    if (selectedPayment.type === 'Midtrans' && (!snapReady || !window.snap)) return alert('Pembayaran belum siap. Tunggu atau muat ulang halaman.');
    checkoutLock.current = true;
    setIsCheckingOut(true);
    try {
      if (selectedPayment.type === 'Midtrans') {
        const checkout = await createOrder('Midtrans', 'create-snap');
        if (!checkout?.token || !window.snap) throw new Error('Snap pembayaran belum siap. Coba beberapa saat lagi.');
        window.snap.pay(checkout.token, {
          onSuccess: () => { alert('Pembayaran diterima. Status pesanan akan diverifikasi otomatis.'); sessionStorage.removeItem('checkout-attempt'); setCart([]); setView('shop'); },
          onPending: () => { alert('Pesanan disimpan. Segera selesaikan pembayaran.'); sessionStorage.removeItem('checkout-attempt'); setCart([]); setView('shop'); },
          onError: () => alert('Pembayaran gagal diproses.'),
          onClose: () => alert('Jendela pembayaran ditutup. Pesanan tetap pending bila transaksi sudah dibuat.')
        });
        return;
      }
      const order = await createOrder(selectedPayment.name, 'manual-checkout');
      const adminWA = (settings?.admin_phone || '').replace(/\D/g, '');
      if (adminWA) {
        const itemText = cart.map(it => `- ${it.title} (${it.selectedVariant || 'Default'}): Rp ${it.price.toLocaleString()}`).join('\n');
        const message = `*PESANAN BARU #${String(order.order_id || '').slice(-8)}*\n\n*Data Pelanggan:*\nNama: ${customerName}\nAlamat: ${customerAddress}\n\n*Detail Pesanan:*\n${itemText}\n\n*Total:* Rp ${Number(order.total_price || totalPrice).toLocaleString()}\n*Metode:* ${selectedPayment.name}`;
        window.open(`https://wa.me/${adminWA}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      }
      sessionStorage.removeItem('checkout-attempt'); setCart([]); setView('shop'); alert('Pesanan tersimpan!');
    } catch (err: any) {
      console.error(err);
      alert('Gagal memproses pesanan: ' + (err.message || 'Kesalahan checkout'));
    } finally { checkoutLock.current = false; setIsCheckingOut(false); }
  };

  return (
    <div className="font-sans text-slate-900 selection:bg-blue-100">
      <nav className="fixed top-0 w-full z-[100] bg-white/70 backdrop-blur-2xl border-b border-slate-100 px-6 h-20 flex items-center justify-between">
        <div className="text-3xl font-black tracking-tighter text-slate-900 italic cursor-pointer" onClick={() => setView('shop')}>
          {settings?.store_name || 'ZYHA'}<span className="text-blue-600 underline decoration-2">ID</span>
        </div>
        <div className="flex-1 max-w-xl mx-12 relative hidden md:block">
          <input type="text" placeholder="Cari produk impian Anda..." className="w-full bg-slate-100 rounded-full py-3 px-12 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
          <Search className="absolute left-4 top-3 text-slate-400" size={20} />
        </div>
        <div className="flex items-center gap-6">
          <button className="text-slate-600 hover:text-blue-600 transition-colors"><User size={24}/></button>
          <button className="relative bg-slate-900 text-white p-3 rounded-full hover:scale-105 transition-transform" onClick={() => setShowCart(true)}>
            <ShoppingBag size={22} />
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white">{cart.length}</span>}
          </button>
        </div>
      </nav>

      {showCart && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCart(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-8 flex flex-col animate-in slide-in-from-right">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-black italic">KERANJANG ANDA</h2>
               <button onClick={() => setShowCart(false)} className="p-2 bg-slate-100 rounded-full"><X/></button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto">
               {cart.length === 0 ? <p className="text-center text-slate-400 py-10">Keranjang masih kosong.</p> : cart.map(item => (
                 <CartItem key={item.cartId} title={item.title} variant={item.selectedVariant} price={`Rp ${item.price.toLocaleString()}`} onRemove={() => removeFromCart(item.cartId)} />
               ))}
            </div>
            <div className="mt-auto border-t pt-6 space-y-4">
               <div className="flex justify-between font-bold text-xl">
                 <span>Total Belanja</span>
                 <span className="text-blue-600">Rp {totalPrice.toLocaleString()}</span>
               </div>
               <button onClick={handleCheckout} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-black flex items-center justify-center gap-3">
                 CHECKOUT SEKARANG <ArrowRight size={20}/>
               </button>
            </div>
          </div>
        </div>
      )}

      {view === 'shop' && (
        <>
          <section className="pt-32 px-6 max-w-7xl mx-auto">
  <div className="relative w-full h-[600px] bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl group">
     {/* Image dibuat opacity-100 agar warna asli muncul sepenuhnya */}
     <img
       src={settings?.banner_url || "https://lh3.googleusercontent.com/u/0/d/1appsmOMuICaAUj7Ai-v7MkJMwTaMqzaT"}
       className="absolute inset-0 w-full h-full object-cover opacity-100 scale-105 group-hover:scale-100 transition-transform duration-[2s]"
       alt="Banner"
     />

     {/* Container teks tanpa background gradien */}
     <div className="absolute inset-0 flex flex-col justify-center px-16 z-10">
        <div className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"> {/* Efek bayangan agar teks terbaca di gambar terang */}
           <span className="text-black-400 font-black tracking-[0.5em] uppercase mb-4 text-sm animate-pulse block">
              Edisi Terbatas
           </span>
           <h2 className="text-7xl font-black text-yellow max-w-2xl leading-[1.1] mb-8 italic">
              GET READY BAGS.
           </h2>
        </div>

        <button className="bg-yellow text-slate-900 px-10 py-5 rounded-2xl font-black w-fit hover:bg-blue-600 hover:text-white transition-all shadow-2xl flex items-center gap-4 group/btn">
            BELANJA KOLEKSI <ChevronRight className="group-hover/btn:translate-x-2 transition-transform" />
        </button>
     </div>
  </div>
</section>

          <section className="max-w-7xl mx-auto px-6 py-20">
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {(settings?.categories || ["Totebag", "Shoulder Bag", "Slingbag"]).map((cat: string) => (
                    <CategoryCard key={cat} name={cat} icon="✨" />
                ))}
             </div>
          </section>

          <section className="max-w-7xl mx-auto px-6 pb-32">
            <div className="flex justify-between items-end mb-12">
              <div>
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter">Katalog Produk <span className="text-blue-600 text-6xl">.</span></h2>
                  <p className="text-slate-400 font-medium">Temukan gaya terbaikmu hari ini.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-10">
               {products.map((p) => (
                 <ProductDisplay key={p.id} product={p} onClick={() => openDetail(p)} onAdd={() => addToCart(p)} />
               ))}
            </div>
          </section>
        </>
      )}

      {view === 'detail' && selectedProduct && (
        <section className="pt-32 px-6 max-w-7xl mx-auto pb-32 animate-in fade-in duration-500">
          <button onClick={() => setView('shop')} className="mb-8 flex items-center gap-2 font-bold text-slate-400 hover:text-slate-900 transition-colors">
            <ChevronLeft size={20}/> Kembali ke Katalog
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-6">
              <div className="rounded-[3rem] overflow-hidden shadow-2xl bg-slate-100 aspect-square">
                <ImageSlider
                  images={selectedProduct.images && Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0 ? selectedProduct.images : [selectedProduct.image_url || selectedProduct.image]}
                  forcedImage={mainImage}
                />
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <span className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest">{selectedProduct.category}</span>
                <h1 className="text-5xl font-black italic mt-4 text-slate-900 leading-tight">{selectedProduct.title}</h1>
                <p className="text-3xl font-black text-blue-600 mt-2">Rp {selectedProduct.price?.toLocaleString()}</p>
              </div>

              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <h3 className="font-bold uppercase tracking-widest text-slate-400 text-xs mb-4">Deskripsi Produk</h3>
                <p className="text-slate-600 leading-relaxed">{selectedProduct.description || "Tidak ada deskripsi."}</p>
              </div>

              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold uppercase tracking-widest text-slate-400 text-xs">Pilih Varian Warna</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedProduct.variants.map((v: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedVariant(v.name);
                          if(v.image) setMainImage(v.image);
                        }}
                        className={`px-6 py-3 rounded-2xl font-bold border-2 transition-all flex items-center gap-3 ${selectedVariant === v.name ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-white text-slate-400'}`}
                      >
                        {v.image && <img src={v.image} className="w-6 h-6 rounded-lg object-cover" />}
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button onClick={() => addToCart(selectedProduct, selectedVariant)} className="p-5 border-2 border-slate-900 rounded-2xl font-black uppercase hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3">
                  <ShoppingBag size={20}/> Keranjang
                </button>
                <button onClick={() => {
                  const item = { id: selectedProduct.id, title: selectedProduct.title, price: selectedProduct.price, selectedVariant, cartId: crypto.randomUUID() };
                  setCart([item]);
                  setShowCart(false);
                  setView('checkout');
                }} className="p-5 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
                  Checkout Langsung
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {view === 'checkout' && (
        <section className="pt-32 px-6 max-w-4xl mx-auto pb-32 animate-in slide-in-from-bottom-8">
          <h2 className="text-4xl font-black italic mb-8 uppercase">Halaman Pembayaran</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2"><User size={18}/> Detail Pengiriman</h3>
                <input type="text" placeholder="Nama Lengkap" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl mb-3 outline-none ring-1 ring-slate-100 focus:ring-blue-500" />
                <input type="text" placeholder="Alamat Lengkap" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl mb-3 outline-none ring-1 ring-slate-100 focus:ring-blue-500" />
                <input type="text" placeholder="Nomor WhatsApp" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl outline-none ring-1 ring-slate-100 focus:ring-blue-500" />
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2"><CreditCard size={18}/> Pilih Metode Bayar</h3>
                <div className="space-y-3">
                  {paymentMethods.map(m => (
                    <div key={m.id} onClick={() => setSelectedPayment(m)} className={`p-4 border rounded-2xl flex justify-between items-center cursor-pointer transition-all ${selectedPayment?.id === m.id ? 'border-blue-600 bg-blue-50' : 'hover:border-blue-500'}`}>
                      <div className="flex items-center gap-3">
                        {m.type === 'Bank' ? <Landmark className={selectedPayment?.id === m.id ? 'text-blue-600' : ''} /> : m.type === 'Midtrans' ? <CreditCard className={selectedPayment?.id === m.id ? 'text-blue-600' : ''} /> : <QrCode className={selectedPayment?.id === m.id ? 'text-blue-600' : ''} />}
                        <div>
                          <p className={`font-bold text-sm ${selectedPayment?.id === m.id ? 'text-blue-600' : ''}`}>{m.name || (m.type === 'Midtrans' ? 'Midtrans' : '')}</p>
                          <p className="text-xs text-slate-500">{m.type === 'Midtrans' ? 'Otomatis (QRIS/CC/VA)' : m.account_number}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 ${selectedPayment?.id === m.id ? 'border-blue-600 bg-blue-600' : 'border-slate-200'}`}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] h-fit sticky top-32">
              <h3 className="font-bold text-xl mb-6 italic">Ringkasan Pesanan</h3>
              <div className="space-y-4 mb-8">
                {cart.map(item => (
                  <div key={item.cartId} className="flex justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-400">{item.title}</span>
                      {item.selectedVariant && <span className="text-[10px] text-blue-400 font-bold uppercase">{item.selectedVariant}</span>}
                    </div>
                    <span className="font-bold">Rp {item.price.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-4 flex justify-between font-black text-xl">
                  <span>TOTAL</span>
                  <span className="text-blue-400">Rp {totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <button onClick={handleConfirmPayment} disabled={isCheckingOut} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                {selectedPayment?.type === 'Midtrans' ? <CreditCard size={20}/> : <MessageCircle size={20} />}
                {selectedPayment?.type === 'Midtrans' ? 'BAYAR OTOMATIS' : 'BAYAR VIA WA'}
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="h-20"></div>
    </div>
  );
}
