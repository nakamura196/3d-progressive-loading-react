import React from 'react';
import { useLoadingStore } from '../store/loadingStore';

export function LoadingInfo() {
  const status = useLoadingStore((state) => state.status);
  const lodLevel = useLoadingStore((state) => state.lodLevel);
  const vertices = useLoadingStore((state) => state.vertices);
  const fileSize = useLoadingStore((state) => state.fileSize);
  const loadTime = useLoadingStore((state) => state.loadTime);
  const progress = useLoadingStore((state) => state.progress);
  const isComplete = useLoadingStore((state) => state.isComplete);
  

  return (
    <div className="loading-info">
      <h3>Progressive Loading Demo</h3>
      
      <div className="info-row">
        <span className="info-label">Status:</span>
        <span className="info-value">
          <span className={`status-badge ${isComplete ? 'status-complete' : 'status-loading'}`}>
            {isComplete ? 'Complete' : 'Loading'}
          </span>
        </span>
      </div>
      
      <div className="info-row">
        <span className="info-label">LOD Level:</span>
        <span className="info-value">{lodLevel}</span>
      </div>
      
      <div className="info-row">
        <span className="info-label">Vertices:</span>
        <span className="info-value">
          {typeof vertices === 'number' ? vertices.toLocaleString() : vertices}
        </span>
      </div>
      
      <div className="info-row">
        <span className="info-label">File Size:</span>
        <span className="info-value">{fileSize}</span>
      </div>
      
      <div className="info-row">
        <span className="info-label">Load Time:</span>
        <span className="info-value">{loadTime}</span>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}