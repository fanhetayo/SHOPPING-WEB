import React from 'react';
import { BarChart3 } from 'lucide-react';

export function AnalyticsSection() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold italic">Analitik Performa</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border shadow-sm">
           <h3 className="font-bold mb-6 flex items-center gap-2"><BarChart3 size={20} className="text-blue-500"/> Trafik Pengunjung (Placeholder)</h3>
           <div className="h-48 flex items-end gap-2">
             {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
               <div key={i} className="flex-1 bg-slate-100 rounded-t-lg relative group">
                  <div style={{ height: `${h}%` }} className="bg-blue-500 rounded-t-lg transition-all group-hover:bg-slate-900"></div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
