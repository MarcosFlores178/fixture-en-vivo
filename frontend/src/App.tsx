import React, { useEffect, useState } from 'react';
import { VistaPublica } from './components/VistaPublica';
import { PanelAdmin } from './components/PanelAdmin';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Ruteo manual: si es exactamente /admin renderiza PanelAdmin, de lo contrario VistaPublica
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        {currentPath === '/admin' ? <PanelAdmin /> : <VistaPublica />}
      </div>
      <footer className="w-full py-6 text-center text-sm font-medium text-white tracking-wider mt-auto">
        Diseñado y desarrollado por Marcos Fabián Flores
      </footer>
    </div>
  );
}
