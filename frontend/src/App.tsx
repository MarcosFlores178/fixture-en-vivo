import React, { useState } from 'react';
import { VistaPublica } from './components/VistaPublica';
import { PanelAdmin } from './components/PanelAdmin';

export default function App() {
  const [vista, setVista] = useState<'publica' | 'admin'>('publica');

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Barra de navegación superior para alternar vistas */}
      <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-white font-bold text-sm tracking-wide">
              Fixture Live
            </span>
          </div>

          {/* Selector de modo */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setVista('publica')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                vista === 'publica'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📺 Vista Pública
            </button>
            <button
              type="button"
              onClick={() => setVista('admin')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                vista === 'admin'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚙️ Panel Admin
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido según la pestaña seleccionada */}
      <main className="flex-1">
        {vista === 'publica' ? <VistaPublica /> : <PanelAdmin />}
      </main>
    </div>
  );
}
