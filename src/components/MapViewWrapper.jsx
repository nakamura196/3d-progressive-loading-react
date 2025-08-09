'use client';

import React, { useState, useEffect } from 'react';

export function MapViewWrapper() {
  const [MapView, setMapView] = useState(null);

  useEffect(() => {
    import('../pages/MapView').then(mod => {
      setMapView(() => mod.MapView);
    });
  }, []);

  if (!MapView) {
    return <div className="loading-container">Loading map...</div>;
  }

  return <MapView />;
}