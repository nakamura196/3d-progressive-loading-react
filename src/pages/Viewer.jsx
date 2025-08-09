'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Center } from '@react-three/drei';
import { Leva, useControls } from 'leva';
import { ProgressiveModel } from '../components/ProgressiveModel';
import { LoadingInfo } from '../components/LoadingInfo';
import { useLoadingStore } from '../store/loadingStore';
import { useManifest } from '../hooks/useManifest';

export function Viewer() {
  const [modelConfig, setModelConfig] = useState(null);
  const [configLoaded, setConfigLoaded] = useState(false);
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
  }, [manifest, manifestLoading, manifestError, modelId, getModelConfig, getSettings, configLoaded]);

  return (
    <div className="viewer-page">
      <LoadingInfo manifest={manifest} manifestUrl={manifestUrl} />
      <Leva collapsed />
      
      <div className="canvas-container">
        <Canvas
          camera={{ position: [5, 3, 5], fov: 45 }}
          shadows
        >
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={0.8}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight position={[-5, 5, -5]} intensity={0.5} color="#4a90e2" />
          
          <Suspense fallback={null}>
            {modelConfig && (
              <ProgressiveModel
                config={modelConfig}
                enableProgressive={enableProgressive && modelConfig.progressive}
                lodLevel={lodLevel}
                wireframe={wireframe}
              />
            )}
          </Suspense>
          
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={20}
            autoRotate={autoRotate}
            autoRotateSpeed={rotationSpeed}
          />
          
          <Grid
            args={[20, 20]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#6b7280"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#9ca3af"
            fadeDistance={30}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid
          />
          
          <Environment preset="city" />
        </Canvas>
      </div>
    </div>
  );
}

;