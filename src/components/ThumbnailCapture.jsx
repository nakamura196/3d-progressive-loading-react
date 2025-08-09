import React, { useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function Model({ url, onCapture }) {
  const { scene } = useGLTF(url);
  const { gl, camera, scene: threeScene } = useThree();
  const capturedRef = useRef(false);
  
  useEffect(() => {
    if (!scene) return;
    
    // Center and scale the model
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Center the model
    scene.position.sub(center);
    
    // Calculate camera position
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5;
    
    camera.position.set(cameraZ * 0.7, cameraZ * 0.5, cameraZ * 0.7);
    camera.lookAt(0, 0, 0);
  }, [scene, camera]);
  
  useFrame(() => {
    if (!capturedRef.current && scene) {
      // Wait a frame to ensure everything is rendered
      setTimeout(() => {
        // Capture the canvas
        const canvas = gl.domElement;
        canvas.toBlob((blob) => {
          if (blob && onCapture) {
            onCapture(blob);
          }
        }, 'image/png');
        capturedRef.current = true;
      }, 100);
    }
  });
  
  return <primitive object={scene} />;
}

export function ThumbnailCapture({ modelUrl, onCapture }) {
  return (
    <div style={{ width: 512, height: 512, position: 'fixed', left: -9999 }}>
      <Canvas
        camera={{ position: [5, 3, 5], fov: 45 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <color attach="background" args={['#f0f0f5']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.4} />
        <Model url={modelUrl} onCapture={onCapture} />
      </Canvas>
    </div>
  );
}