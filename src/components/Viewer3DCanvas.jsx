'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { ProgressiveModel } from './ProgressiveModel';

export function Viewer3DCanvas({ modelConfig, enableProgressive, lodLevel, wireframe, autoRotate, rotationSpeed }) {
  return (
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
  );
}