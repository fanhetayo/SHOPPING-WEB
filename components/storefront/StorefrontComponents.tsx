import React, { useEffect, useState } from 'react';
import { Plus, Star, Trash2 } from 'lucide-react';

export function ImageSlider({ images, forcedImage }: { images: any, forcedImage?: string }) {
  const [current, setCurrent] = useState(0);

  const safeImages = React.useMemo(() => {
    let list: string[] = [];
    if (Array.isArray(images)) list = images.filter(img => typeof img === 'string' && img.trim() !== '');
    else if (typeof images === 'string' && images.trim() !== '') list = [images];

    if (forcedImage && !list.includes(forcedImage)) {
      return [forcedImage, ...list];
    }
    return list;
  }, [images, forcedImage]);

  useEffect(() => {
    if (forcedImage) {
      const index = safeImages.indexOf(forcedImage);
      if (index !== -1) setCurrent(index);
    }
  }, [forcedImage, safeImages]);

  useEffect(() => {
    if (safeImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev === safeImages.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [safeImages]);

  if (safeImages.length === 0) {
    return <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs uppercase italic">No Image</div>;
  }

  return (
    <div className="relative w-full h-full group bg-white">
      {safeImages.map((img: string, idx: number) => (
        <img
          key={idx}
          src={img}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === current ? 'opacity-100' : 'opacity-0'}`}
          alt="product"
        />
      ))}
      {safeImages.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
          {safeImages.map((_, idx: number) => (
            <div key={idx} className={`h-1 rounded-full transition-all ${idx === current ? 'w-8 bg-blue-600' : 'w-2 bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductDisplay({ product, onClick, onAdd }: any) {
  return (
    <div className="group">
       <div className="relative aspect-[4/5] bg-slate-100 rounded-[2.5rem] overflow-hidden mb-6 shadow-sm cursor-pointer" onClick={onClick}>
          <ImageSlider images={Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image_url || product.image]} />
          <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="absolute bottom-6 right-6 p-4 bg-slate-900 text-white rounded-2xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl z-10">
              <Plus />
          </button>
       </div>
       <div className="space-y-1 cursor-pointer" onClick={onClick}>
          <div className="flex items-center gap-1 text-yellow-500 mb-2">
            {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
          </div>
          <h3 className="text-xl font-bold tracking-tight text-slate-800 group-hover:text-blue-600 transition-colors">{product.title}</h3>
          <p className="text-slate-900 font-black text-lg">Rp {product.price?.toLocaleString()}</p>
       </div>
    </div>
  );
}

export function CategoryCard({ name, icon }: any) {
  return (
    <div className="group cursor-pointer">
      <div className="bg-white border border-slate-100 shadow-sm p-8 rounded-[2rem] flex flex-col items-center group-hover:bg-blue-600 transition-all group-hover:-translate-y-2">
         <span className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">{icon}</span>
         <p className="font-black text-xs uppercase tracking-widest text-slate-400 group-hover:text-white">{name}</p>
      </div>
    </div>
  );
}

export function CartItem({title, variant, price, onRemove}: any) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
       <div className="w-16 h-16 bg-slate-200 rounded-xl overflow-hidden flex items-center justify-center text-[10px] text-slate-400 uppercase italic">ZYHA</div>
       <div className="flex-1">
          <h4 className="font-bold text-sm">{title}</h4>
          {variant && <p className="text-[10px] font-bold text-slate-400 uppercase">{variant}</p>}
          <p className="text-blue-600 font-black text-xs">{price}</p>
       </div>
       <button onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
    </div>
  )
}
