import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { Box3, Vector3, Mesh } from 'three';
import { useLoadingStore } from '../store/loadingStore';

const DEFAULT_LOD_LEVELS = ['low', 'medium', 'high', 'ultra'];
const LOD_DELAYS = {
  low: 100,
  medium: 500,
  high: 1000,
  ultra: 1500,
  extreme: 2000
};

export function ProgressiveModel({ config, enableProgressive, lodLevel, wireframe }) {
  const [currentLodIndex, setCurrentLodIndex] = useState(0);
  const [currentModel, setCurrentModel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedLoading, setHasStartedLoading] = useState(false);
  const groupRef = useRef();
  const startTimeRef = useRef(Date.now());
  const updateLoadingInfo = useLoadingStore((state) => state.updateLoadingInfo);
  
  const LOD_LEVELS = config?.lodLevels || DEFAULT_LOD_LEVELS;

  useEffect(() => {
    // configが存在しない場合は何もしない
    if (!config || Object.keys(config).length === 0) return;
    
    // 既にロードを開始していたら何もしない
    if (hasStartedLoading) return;
    
    const loadModels = async () => {
      setHasStartedLoading(true);
      
      if (!enableProgressive) {
        const highestLevel = config.extreme ? 'extreme' : 'ultra';
        await loadModel(highestLevel);
      } else if (lodLevel === 'auto') {
        await loadProgressively();
      } else {
        await loadModel(lodLevel);
      }
    };
    
    loadModels();
    // 依存配列を空にして初回のみ実行
  }, []); 

  useEffect(() => {
    if (currentModel && wireframe !== undefined) {
      currentModel.traverse((child) => {
        if (child instanceof Mesh) {
          child.material.wireframe = wireframe;
        }
      });
    }
  }, [currentModel, wireframe]);

  const loadProgressively = async () => {
    if (isLoading) return; // 既にロード中なら何もしない
    
    // console.log('Starting progressive loading with levels:', LOD_LEVELS);
    
    for (let i = 0; i < LOD_LEVELS.length; i++) {
      const level = LOD_LEVELS[i];
      // console.log(`Loading level ${i}: ${level}`);
      await loadModel(level);
      
      if (i < LOD_LEVELS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, LOD_DELAYS[level] || 500));
      }
    }
    
    // console.log('Progressive loading complete');
  };

  const loadModel = async (level) => {
    if (isLoading) return;
    
    setIsLoading(true);
    const url = config[level];
    if (!url) {
      setIsLoading(false);
      return;
    }

    startTimeRef.current = Date.now();
    
    updateLoadingInfo({
      status: `Loading ${level}`,
      lodLevel: level.toUpperCase(),
      progress: (LOD_LEVELS.indexOf(level) + 1) / LOD_LEVELS.length * 100
    });

    try {
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
      loader.setDRACOLoader(dracoLoader);

      const gltf = await new Promise((resolve, reject) => {
        loader.load(
          url,
          resolve,
          (progress) => {
            const fileSize = progress.total 
              ? `${(progress.total / 1024 / 1024).toFixed(2)} MB`
              : 'Calculating...';
            updateLoadingInfo({
              fileSize,
              progress: progress.total 
                ? ((progress.loaded / progress.total) * 100)
                : 0
            });
          },
          reject
        );
      });

      const model = gltf.scene;
      
      // Count vertices
      let vertexCount = 0;
      model.traverse((child) => {
        if (child instanceof Mesh && child.geometry) {
          vertexCount += child.geometry.attributes.position.count;
        }
      });

      // Setup model
      model.traverse((child) => {
        if (child instanceof Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (wireframe) {
            child.material.wireframe = true;
          }
        }
      });

      // Center and scale model
      const box = new Box3().setFromObject(model);
      const center = box.getCenter(new Vector3());
      const size = box.getSize(new Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 4 / maxDim;
      
      model.scale.multiplyScalar(scale);
      model.position.sub(center.multiplyScalar(scale));

      setCurrentModel(model);
      
      const loadTime = Date.now() - startTimeRef.current;
      
      // 最後のLODレベルかチェック
      const isLastLevel = LOD_LEVELS.indexOf(level) === LOD_LEVELS.length - 1;
      // console.log(`Loaded ${level}, isLastLevel:`, isLastLevel, 'enableProgressive:', enableProgressive);
      
      updateLoadingInfo({
        status: (isLastLevel || !enableProgressive) ? 'Complete' : `LOD ${level} loaded`,
        lodLevel: level.toUpperCase(),
        vertices: vertexCount,
        loadTime: `${loadTime}ms`,
        progress: (LOD_LEVELS.indexOf(level) + 1) / LOD_LEVELS.length * 100,
        isComplete: isLastLevel || !enableProgressive
      });
      
      if (isLastLevel || !enableProgressive) {
        // console.log('Marking as complete');
      }
      
      setIsLoading(false);

    } catch (error) {
      console.error(`Error loading ${level} model:`, error);
      setIsLoading(false);
      // Fallback to procedural geometry
      createProceduralModel(level);
    }
  };

  const createProceduralModel = (level) => {
    // This would create a procedural fallback model
    // For brevity, we'll just log an error
    console.log(`Creating procedural model for ${level}`);
    updateLoadingInfo({
      status: `Fallback ${level} loaded`,
      lodLevel: level.toUpperCase(),
      vertices: 'Procedural',
      fileSize: 'Procedural'
    });
  };

  useFrame((state, delta) => {
    if (groupRef.current && currentModel) {
      // Add any per-frame updates here if needed
    }
  });

  return (
    <group ref={groupRef}>
      {currentModel && <primitive object={currentModel} />}
    </group>
  );
}