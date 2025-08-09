'use client';

import React, { useState, useEffect } from 'react';

export function ModelsListWrapper() {
  const [ModelsList, setModelsList] = useState(null);

  useEffect(() => {
    import('../views/ModelsList').then(mod => {
      setModelsList(() => mod.ModelsList);
    });
  }, []);

  if (!ModelsList) {
    return <div className="loading-container">Loading collection...</div>;
  }

  return <ModelsList />;
}