'use client';

import React, { useState, useEffect } from 'react';
import ClientOnly from './ClientOnly';

export function Hero3DWrapper() {
  const [Hero3D, setHero3D] = useState(null);

  useEffect(() => {
    import('./Hero3D').then(mod => {
      setHero3D(() => mod.Hero3D);
    });
  }, []);

  return (
    <ClientOnly>
      {Hero3D ? <Hero3D /> : <div className="hero-3d-loading">Loading 3D scene...</div>}
    </ClientOnly>
  );
}