'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Leva, useControls } from 'leva';
import { LoadingInfo } from '../components/LoadingInfo';
import { useLoadingStore } from '../store/loadingStore';
import { useManifest } from '../hooks/useManifest';
import ClientOnly from '../components/ClientOnly';

export function Viewer() {
  const [modelConfig, setModelConfig] = useState(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [Viewer3DCanvas, setViewer3DCanvas] = useState(null);
  const updateLoadingInfo = useLoadingStore((state) => state.updateLoadingInfo);

  const { autoRotate, rotationSpeed, wireframe } = useControls('Display', {
    autoRotate: { value: true, label: 'Auto Rotate' },
    rotationSpeed: { value: 0.5, min: 0, max: 5, label: 'Rotation Speed' },
    wireframe: { value: false, label: 'Wireframe' }
  });

  const { enableProgressive, lodLevel } = useControls('Loading', {
    enableProgressive: { value: true, label: 'Progressive Loading' },
    lodLevel: {
      value: 'auto',
      options: ['auto', 'low', 'medium', 'high', 'ultra'],
      label: 'LOD Level'
    }
  });

  // Load manifest if specified, otherwise use default
  const searchParams = useSearchParams();
  const manifestUrl = searchParams.get('manifest') || '/data/manifests/sponza_iiif.json';
  const modelId = searchParams.get('model');
  
  const { manifest, loading: manifestLoading, error: manifestError, getModelConfig, getSettings } = useManifest(manifestUrl);

  // Load 3D Canvas component on client side only
  useEffect(() => {
    import('../components/Viewer3DCanvas').then(mod => {
      setViewer3DCanvas(() => mod.Viewer3DCanvas);
    });
  }, []);

  useEffect(() => {
    if (configLoaded) return; // Already loaded config, don't run again
    
    if (manifestLoading) {
      updateLoadingInfo({ status: 'Loading manifest...' });
      return;
    }

    if (manifestError) {
      console.error('Manifest error:', manifestError);
      updateLoadingInfo({ status: 'Error loading manifest' });
      return;
    }

    if (manifest && getModelConfig && getSettings) {
      const config = getModelConfig(modelId);
      const settings = getSettings();
      
      if (config) {
        setModelConfig(config);
        setConfigLoaded(true); // Mark as loaded
        // Don't override status here - let ProgressiveModel handle it
        
        // Apply settings from manifest if available
        if (settings && settings.autoRotate !== undefined) {
          // Settings are applied through controls
        }
      }
    }
  }, [manifest, manifestLoading, manifestError, modelId, getModelConfig, getSettings, configLoaded, updateLoadingInfo]);

  return (
    <div className="viewer-page">
      <LoadingInfo manifest={manifest} manifestUrl={manifestUrl} />
      <Leva collapsed />
      
      <div className="canvas-container">
        <ClientOnly>
          {Viewer3DCanvas ? (
            <Viewer3DCanvas
              modelConfig={modelConfig}
              enableProgressive={enableProgressive}
              lodLevel={lodLevel}
              wireframe={wireframe}
              autoRotate={autoRotate}
              rotationSpeed={rotationSpeed}
            />
          ) : (
            <div className="canvas-loading">Loading 3D viewer...</div>
          )}
        </ClientOnly>
      </div>
    </div>
  );
}