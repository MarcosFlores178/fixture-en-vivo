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
  if (currentPath === '/admin') {
    return <PanelAdmin />;
  }

  return <VistaPublica />;
}
