'use client';

import React, { useState, useEffect } from 'react';

export function Hero3DWrapper() {
  const [Hero3D, setHero3D] = useState(null);

  useEffect(() => {
    import('./Hero3D').then(mod => {
      setHero3D(() => mod.Hero3D);
    });
  }, []);

  if (!Hero3D) {
    return <div className="hero-3d-loading">Loading 3D scene...</div>;
  }

  return <Hero3D />;
}