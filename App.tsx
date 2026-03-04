import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  ShoppingBag, Search, MessageCircle, Star, 
  ChevronRight, ArrowRight, User, Heart, X, Trash2, Send, Plus, CreditCard, Landmark, QrCode
} from 'lucide-react';

export default function App() {
  const [showCart, setShowCart] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [view, setView] = useState('shop'); // shop, checkout
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    const getData = async () => {
      const { data: p } = await supabase.from('products').select('*');
      if (p) setProducts(p);
      const { data: b } = await supabase.from('payment_methods').select('*');
      if (b) setPaymentMethods(b);
    };
    getData();

    const sub = supabase.channel('api-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, getData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods' }, getData)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const addToCart = (product: any) => {
    setCart([...cart, { ...product, cartId: Math.random() }]);
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

  return (
    <div className="font-sans text-slate-900 selection:bg-blue-100">
      <nav className="fixed top-0 w-full z-[100] bg-white/70 backdrop-blur-2xl border-b border-slate-100 px-6 h-20 flex items-center justify-between">
        <div className="text-3xl font-black tracking-tighter text-slate-900 italic cursor-pointer" onClick={() => setView('shop')}>
          ZYHA<span className="text-blue-600 underline decoration-2">ID</span>
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
               {cart.map(item => (
                 <CartItem key={item.cartId} title={item.title} price={`Rp ${item.price.toLocaleString()}`} onRemove={() => removeFromCart(item.cartId)} />
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

      {view === 'shop' ? (
        <>
          <section className="pt-32 px-6 max-w-7xl mx-auto">
            <div className="relative w-full h-[600px] bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl group">
               <img src="https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012" className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 group-hover:scale-100 transition-transform duration-[2s]" alt="Banner" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-center px-16">
                  <span className="text-blue-400 font-black tracking-[0.5em] uppercase mb-4 text-sm animate-pulse">Edisi Terbatas</span>
                  <h2 className="text-7xl font-black text-white max-w-2xl leading-[1.1] mb-8 italic">STEP INTO THE FUTURE.</h2>
                  <button className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black w-fit hover:bg-blue-600 hover:text-white transition-all shadow-2xl flex items-center gap-4 group/btn">
                      BELANJA KOLEKSI <ChevronRight className="group-hover/btn:translate-x-2 transition-transform" />
                  </button>
               </div>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-6 py-20">
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <CategoryCard name="Elektronik" icon="📱" />
                <CategoryCard name="Fashion" icon="👕" />
                <CategoryCard name="Sepatu" icon="👟" />
                <CategoryCard name="Jam Tangan" icon="⌚" />
                <CategoryCard name="Kesehatan" icon="🩺" />
                <CategoryCard name="Hobi" icon="🎨" />
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
                 <ProductDisplay key={p.id} image={p.image_url} title={p.title} price={`Rp ${p.price.toLocaleString()}`} onAdd={() => addToCart(p)} />
               ))}
            </div>
          </section>
        </>
      ) : (
        <section className="pt-32 px-6 max-w-4xl mx-auto pb-32">
          <h2 className="text-4xl font-black italic mb-8 uppercase">Halaman Pembayaran</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2"><User size={18}/> Detail Pengiriman</h3>
                <input type="text" placeholder="Nama Lengkap" className="w-full p-4 bg-slate-50 rounded-xl mb-3 outline-none ring-1 ring-slate-100" />
                <input type="text" placeholder="Alamat Lengkap" className="w-full p-4 bg-slate-50 rounded-xl mb-3 outline-none ring-1 ring-slate-100" />
                <input type="text" placeholder="Nomor WhatsApp" className="w-full p-4 bg-slate-50 rounded-xl outline-none ring-1 ring-slate-100" />
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2"><CreditCard size={18}/> Pilih Metode Bayar</h3>
                <div className="space-y-3">
                  {paymentMethods.map(m => (
                    <div key={m.id} className="p-4 border rounded-2xl flex justify-between items-center hover:border-blue-500 cursor-pointer">
                      <div className="flex items-center gap-3">
                        {m.type === 'Bank' ? <Landmark/> : <QrCode/>}
                        <div>
                          <p className="font-bold text-sm">{m.name}</p>
                          <p className="text-xs text-slate-500">{m.account_number}</p>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-slate-200"></div>
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
                    <span className="text-slate-400">{item.title}</span>
                    <span className="font-bold">Rp {item.price.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-4 flex justify-between font-black text-xl">
                  <span>TOTAL</span>
                  <span className="text-blue-400">Rp {totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <button className="w-full bg-blue-600 py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all">BAYAR SEKARANG</button>
            </div>
          </div>
        </section>
      )}

      {/* LIVE CHAT */}
      <button className="fixed bottom-10 right-10 bg-slate-900 text-white p-5 rounded-3xl shadow-xl z-[150] flex items-center gap-3 border border-white/20" onClick={() => setIsLiveChatOpen(!isLiveChatOpen)}>
        <MessageCircle size={30} className="fill-blue-500 text-blue-500" />
        <span className="font-black text-sm tracking-widest">LIVE HELP</span>
      </button>

      {isLiveChatOpen && (
        <div className="fixed bottom-32 right-10 w-96 bg-white shadow-2xl rounded-3xl z-[150] overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-10">
           <div className="bg-slate-900 p-6 text-white flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center font-bold">ZY</div>
              <div><p className="font-bold">ZYHA ID CS</p><p className="text-xs text-emerald-400">Online</p></div>
           </div>
           <div className="h-80 bg-slate-50 p-6 flex items-center justify-center text-slate-400 italic text-sm">Hubungkan dengan WhatsApp Anda.</div>
           <div className="p-4 bg-white flex gap-2 border-t">
              <input type="text" placeholder="Ketik pesan..." className="flex-1 p-3 bg-slate-100 rounded-xl outline-none" />
              <button className="bg-blue-600 text-white p-3 rounded-xl"><Send size={20}/></button>
           </div>
        </div>
      )}
    </div>
  );
}

function CategoryCard({ name, icon }: any) {
  return (
    <div className="group cursor-pointer">
      <div className="bg-white border border-slate-100 shadow-sm p-8 rounded-[2rem] flex flex-col items-center group-hover:bg-blue-600 transition-all group-hover:-translate-y-2">
         <span className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">{icon}</span>
         <p className="font-black text-xs uppercase tracking-widest text-slate-400 group-hover:text-white">{name}</p>
      </div>
    </div>
  );
}

function ProductDisplay({ image, title, price, onAdd }: any) {
  return (
    <div className="group cursor-pointer">
       <div className="relative aspect-[4/5] bg-slate-100 rounded-[2.5rem] overflow-hidden mb-6 shadow-sm">
          <img src={image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={title} />
          <button onClick={onAdd} className="absolute bottom-6 right-6 p-4 bg-slate-900 text-white rounded-2xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
             <Plus />
          </button>
       </div>
       <div className="space-y-1">
          <div className="flex items-center gap-1 text-yellow-500 mb-2">
            {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
          </div>
          <h3 className="text-xl font-bold tracking-tight text-slate-800 group-hover:text-blue-600 transition-colors">{title}</h3>
          <p className="text-slate-900 font-black text-lg">{price}</p>
       </div>
    </div>
  );
}

function CartItem({title, price, onRemove}: any) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
       <div className="w-16 h-16 bg-slate-200 rounded-xl overflow-hidden flex items-center justify-center text-[10px] text-slate-400 uppercase italic">ZYHA</div>
       <div className="flex-1">
          <h4 className="font-bold text-sm">{title}</h4>
          <p className="text-blue-600 font-black text-xs">{price}</p>
       </div>
       <button onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
    </div>
  )
}
