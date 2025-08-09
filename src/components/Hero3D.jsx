'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Box, Sphere, Torus, Environment } from '@react-three/drei';

function Hero3DContent() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <group>
          <Box args={[1, 1, 1]} position={[-2, 0, 0]}>
            <meshStandardMaterial color="#6366f1" />
          </Box>
          <Sphere args={[0.7]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#8b5cf6" />
          </Sphere>
          <Torus args={[0.8, 0.3, 16, 100]} position={[2, 0, 0]}>
            <meshStandardMaterial color="#764ba2" />
          </Torus>
        </group>
      </Float>
      <Environment preset="city" />
    </>
  );
}

export function Hero3D() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <Hero3DContent />
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
    </Canvas>
  );
}