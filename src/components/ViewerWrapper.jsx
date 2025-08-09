'use client';

import React, { useState, useEffect } from 'react';

export function ViewerWrapper() {
  const [Viewer, setViewer] = useState(null);

  useEffect(() => {
    import('../pages/Viewer').then(mod => {
      setViewer(() => mod.Viewer);
    });
  }, []);

  if (!Viewer) {
    return <div className="viewer-loading">Loading 3D viewer...</div>;
  }

  return <Viewer />;
}