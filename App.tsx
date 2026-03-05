import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  ShoppingBag, Search, MessageCircle, Star, 
  ChevronRight, ArrowRight, User, Heart, X, Trash2, Send, Plus, CreditCard, Landmark, QrCode, ChevronLeft
} from 'lucide-react';

declare global {
  interface Window {
    snap: any;
  }
}

export default function App() {
  const [showCart, setShowCart] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [view, setView] = useState('shop');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [settings, setSettings] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // State Form Checkout
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  useEffect(() => {
    // Tawk.to
    var Tawk_API: any = Tawk_API || {}, Tawk_LoadStart = new Date();
    (function(){
      var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
      s1.async = true;
      s1.src = 'https://embed.tawk.to/69a85b337b02b21c3601f237/1jisr726s';
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');
      s0.parentNode?.insertBefore(s1, s0);
    })();

    const midtransScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js';
    const script = document.createElement('script');
    script.src = midtransScriptUrl;
    script.async = true;
    
    const fetchSettings = async () => {
        const { data } = await supabase.from('settings').select('*').single();
        if(data) {
            setSettings(data);
            if (data.midtrans_client_key) {
                script.setAttribute('data-client-key', data.midtrans_client_key);
                document.body.appendChild(script);
            }
        }
    };
    fetchSettings();

    return () => { 
        const s = document.querySelector(`script[src="${midtransScriptUrl}"]`);
        if(s) document.body.removeChild(s); 
    }
  }, []);

  useEffect(() => {
    const getData = async () => {
      const { data: p } = await supabase.from('products').select('*');
      if (p) {
        setProducts(p);
        const uniqueCats: string[] = Array.from(new Set(p.map((item: any) => item.category)));
        setCategories(uniqueCats);
      }
      const { data: b } = await supabase.from('payment_methods').select('*');
      if (b) setPaymentMethods(b);
    };
    getData();

    const sub = supabase.channel('api-realtime-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, getData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods' }, getData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
         supabase.from('settings').select('*').single().then(({data}) => setSettings(data));
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const addToCart = (product: any, variant?: string) => {
    setCart([...cart, { ...product, selectedVariant: variant || '', cartId: Math.random() }]);
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
    setView('detail');
    window.scrollTo(0,0);
  };

  const handleConfirmPayment = async () => {
    if (!customerName || !customerAddress || !customerPhone || !selectedPayment) {
      return alert("Mohon lengkapi data diri dan pilih metode pembayaran!");
    }

    const orderId = `ZYHA-${Date.now()}`;
    const orderPayload = {
        id: orderId,
        customer_name: customerName,
        customer_address: customerAddress,
        customer_phone: customerPhone,
        items: cart, // Menyimpan array objek produk
        total_price: totalPrice,
        payment_method: selectedPayment.name || (selectedPayment.type === 'Midtrans' ? 'Midtrans' : 'Manual'),
        status: 'pending'
    };

    try {
      // 1. Logic untuk MIDTRANS
      if (selectedPayment.type === 'Midtrans') {
        const { data: functionData, error: functionError } = await supabase.functions.invoke('rapid-api', {
          body: {
            orderId: orderId,
            grossAmount: totalPrice,
            customerDetails: { first_name: customerName, phone: customerPhone, address: customerAddress }
          }
        });

        if (functionError) throw new Error("Gagal memanggil Rapid-API.");
        
        // Simpan ke database
        const { error: dbError } = await supabase.from('orders').insert([orderPayload]);
        if (dbError) throw dbError;

        if (window.snap) {
          window.snap.pay(functionData.token, {
            onSuccess: async () => {
              await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);
              alert("Pembayaran Berhasil!");
              setCart([]); setView('shop');
            },
            onPending: () => { alert("Menunggu Pembayaran..."); setCart([]); setView('shop'); },
            onClose: () => { alert("Jendela pembayaran ditutup."); }
          });
        }
        return;
      }

      // 2. Logic MANUAL (WhatsApp)
      const { error: dbErrorManual } = await supabase.from('orders').insert([orderPayload]);
      if (dbErrorManual) throw dbErrorManual;

      const adminWA = settings?.wa_number || "628123456789"; 
      const itemText = cart.map(it => `- ${it.title} (${it.selectedVariant || 'Default'}): Rp ${it.price.toLocaleString()}`).join('%0A');
      const message = `*PESANAN BARU*%0A%0A` +
                      `Nama: ${customerName}%0A` +
                      `Alamat: ${customerAddress}%0A%0A` +
                      `*Detail:*%0A${itemText}%0A%0A` +
                      `*Total:* Rp ${totalPrice.toLocaleString()}%0A` +
                      `*Metode:* ${selectedPayment.name}`;

      window.open(`https://wa.me/${adminWA}?text=${message}`, '_blank');
      setCart([]);
      setView('shop');
      alert("Pesanan terkirim!");

    } catch (err: any) {
      alert("Gagal memproses: " + err.message);
    }
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
          <button className="relative bg-slate-900 text-white p-3 rounded-full hover:scale-105 transition-transform" onClick={() => setShowCart(true)}>
            <ShoppingBag size={22} />
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white">{cart.length}</span>}
          </button>
        </div>
      </nav>

      {/* CART DRAWER */}
      {showCart && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCart(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-8 flex flex-col animate-in slide-in-from-right">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic">KERANJANG</h2>
                <button onClick={() => setShowCart(false)} className="p-2 bg-slate-100 rounded-full"><X/></button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto">
               {cart.length === 0 ? <p className="text-center text-slate-400 py-10">Keranjang kosong.</p> : cart.map(item => (
                 <CartItem key={item.cartId} title={item.title} variant={item.selectedVariant} price={`Rp ${item.price.toLocaleString()}`} onRemove={() => removeFromCart(item.cartId)} />
               ))}
            </div>
            <div className="mt-auto border-t pt-6 space-y-4">
               <div className="flex justify-between font-bold text-xl">
                 <span>Total</span>
                 <span className="text-blue-600">Rp {totalPrice.toLocaleString()}</span>
               </div>
               <button onClick={handleCheckout} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3">
                 CHECKOUT <ArrowRight size={20}/>
               </button>
            </div>
          </div>
        </div>
      )}

      {view === 'shop' && (
        <>
          <section className="pt-32 px-6 max-w-7xl mx-auto">
            <div className="relative w-full h-[600px] bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl group">
               <img src={settings?.banner_url || "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012"} className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 group-hover:scale-100 transition-transform duration-[2s]" alt="Banner" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-center px-16">
                  <span className="text-blue-400 font-black tracking-[0.5em] uppercase mb-4 text-sm">{settings?.store_tagline || 'Edisi Terbatas'}</span>
                  <h2 className="text-7xl font-black text-white max-w-2xl leading-[1.1] mb-8 italic uppercase">{settings?.banner_title || 'Step Into The Future.'}</h2>
                  <button className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black w-fit hover:bg-blue-600 hover:text-white transition-all shadow-2xl flex items-center gap-4 group/btn">
                      BELANJA SEKARANG <ChevronRight className="group-hover/btn:translate-x-2 transition-transform" />
                  </button>
               </div>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-6 py-20">
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.map((cat) => (
                    <CategoryCard key={cat} name={cat} icon="✨" />
                ))}
                {categories.length === 0 && <p className="col-span-full text-center text-slate-300">Belum ada kategori.</p>}
             </div>
          </section>

          <section className="max-w-7xl mx-auto px-6 pb-32">
            <div className="flex justify-between items-end mb-12">
              <div>
                 <h2 className="text-4xl font-black italic uppercase tracking-tighter">Katalog Produk <span className="text-blue-600 text-6xl">.</span></h2>
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
            <ChevronLeft size={20}/> Kembali
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-6">
              <div className="rounded-[3rem] overflow-hidden shadow-2xl bg-slate-100 aspect-square">
                <ImageSlider images={selectedProduct.images && Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0 ? selectedProduct.images : [selectedProduct.image_url]} />
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <span className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-black uppercase">{selectedProduct.category}</span>
                <h1 className="text-5xl font-black italic mt-4 text-slate-900">{selectedProduct.title}</h1>
                <p className="text-3xl font-black text-blue-600 mt-2">Rp {selectedProduct.price?.toLocaleString()}</p>
              </div>
              
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <p className="text-slate-600 leading-relaxed">{selectedProduct.description || "Tidak ada deskripsi."}</p>
              </div>

              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold uppercase tracking-widest text-slate-400 text-xs">Pilih Varian</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedProduct.variants.map((v: any, idx: number) => (
                      <button 
                        key={idx} 
                        onClick={() => setSelectedVariant(v.name)}
                        className={`px-6 py-3 rounded-2xl font-bold border-2 transition-all flex items-center gap-3 ${selectedVariant === v.name ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-white text-slate-400'}`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button onClick={() => addToCart(selectedProduct, selectedVariant)} className="p-5 border-2 border-slate-900 rounded-2xl font-black uppercase hover:bg-slate-900 hover:text-white transition-all">
                  + Keranjang
                </button>
                <button onClick={() => { addToCart(selectedProduct, selectedVariant); handleCheckout(); }} className="p-5 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-xl hover:bg-blue-700 transition-all">
                  Beli Sekarang
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {view === 'checkout' && (
        <section className="pt-32 px-6 max-w-4xl mx-auto pb-32">
          <h2 className="text-4xl font-black italic mb-8 uppercase">Checkout</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2"><User size={18}/> Detail Penerima</h3>
                <input type="text" placeholder="Nama" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl mb-3 outline-none ring-1 ring-slate-100" />
                <input type="text" placeholder="Alamat" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl mb-3 outline-none ring-1 ring-slate-100" />
                <input type="text" placeholder="WA (62xxx)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl outline-none ring-1 ring-slate-100" />
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2"><CreditCard size={18}/> Pembayaran</h3>
                <div className="space-y-3">
                  {paymentMethods.map(m => (
                    <div key={m.id} onClick={() => setSelectedPayment(m)} className={`p-4 border rounded-2xl flex justify-between items-center cursor-pointer transition-all ${selectedPayment?.id === m.id ? 'border-blue-600 bg-blue-50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <Landmark size={20} className={selectedPayment?.id === m.id ? 'text-blue-600' : ''} />
                        <div>
                          <p className="font-bold text-sm">{m.name || m.type}</p>
                          <p className="text-xs text-slate-500">{m.account_number || 'Otomatis'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] h-fit sticky top-32">
              <h3 className="font-bold text-xl mb-6 italic">Ringkasan</h3>
              <div className="space-y-4 mb-8">
                {cart.map(item => (
                  <div key={item.cartId} className="flex justify-between text-sm">
                    <span>{item.title} x1</span>
                    <span className="font-bold">Rp {item.price.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-4 flex justify-between font-black text-xl">
                  <span>TOTAL</span>
                  <span className="text-blue-400">Rp {totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <button onClick={handleConfirmPayment} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all">
                KONFIRMASI PESANAN
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="h-20"></div>
    </div>
  );
}

// --- SUB COMPONENTS ---

function ImageSlider({ images }: { images: any }) {
  const [current, setCurrent] = useState(0);
  const safeImages = Array.isArray(images) ? images : [images];

  useEffect(() => {
    if (safeImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev === safeImages.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [safeImages]);

  return (
    <div className="relative w-full h-full bg-white">
      {safeImages.map((img: string, idx: number) => (
        <img key={idx} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === current ? 'opacity-100' : 'opacity-0'}`} alt="product" />
      ))}
    </div>
  );
}

function ProductDisplay({ product, onClick, onAdd }: any) {
  return (
    <div className="group">
       <div className="relative aspect-[4/5] bg-slate-100 rounded-[2.5rem] overflow-hidden mb-6 shadow-sm cursor-pointer" onClick={onClick}>
          <ImageSlider images={product.images || [product.image_url]} />
          <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="absolute bottom-6 right-6 p-4 bg-slate-900 text-white rounded-2xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all z-10">
              <Plus />
          </button>
       </div>
       <div className="space-y-1 cursor-pointer" onClick={onClick}>
          <h3 className="text-xl font-bold tracking-tight text-slate-800">{product.title}</h3>
          <p className="text-slate-900 font-black text-lg">Rp {product.price?.toLocaleString()}</p>
       </div>
    </div>
  );
}

function CategoryCard({ name, icon }: any) {
  return (
    <div className="group cursor-pointer">
      <div className="bg-white border border-slate-100 shadow-sm p-8 rounded-[2rem] flex flex-col items-center group-hover:bg-blue-600 transition-all">
          <span className="text-4xl mb-4">{icon}</span>
          <p className="font-black text-xs uppercase tracking-widest text-slate-400 group-hover:text-white">{name}</p>
      </div>
    </div>
  );
}

function CartItem({title, variant, price, onRemove}: any) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
       <div className="flex-1">
          <h4 className="font-bold text-sm">{title}</h4>
          {variant && <p className="text-[10px] font-bold text-slate-400 uppercase">{variant}</p>}
          <p className="text-blue-600 font-black text-xs">{price}</p>
       </div>
       <button onClick={onRemove} className="text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
    </div>
  )
}
