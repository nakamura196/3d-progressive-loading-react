import React, { useState } from 'react';
import { useLoadingStore } from '../store/loadingStore';

export function LoadingInfo({ manifest, manifestUrl }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showManifest, setShowManifest] = useState(false);
  
  const status = useLoadingStore((state) => state.status);
  const lodLevel = useLoadingStore((state) => state.lodLevel);
  const vertices = useLoadingStore((state) => state.vertices);
  const fileSize = useLoadingStore((state) => state.fileSize);
  const loadTime = useLoadingStore((state) => state.loadTime);
  const progress = useLoadingStore((state) => state.progress);
  const isComplete = useLoadingStore((state) => state.isComplete);
  
  // Extract manifest metadata
  const getManifestInfo = () => {
    if (!manifest) return null;
    
    const label = manifest.label?.en?.[0] || 'Unknown Model';
    const description = manifest.summary?.en?.[0] || '';
    const rights = manifest.rights || '';
    const metadata = manifest.metadata || [];
    
    return { label, description, rights, metadata };
  };
  
  const manifestInfo = getManifestInfo();

  return (
    <div className="loading-info">
      <div className="loading-info-header">
        <h3>{manifestInfo?.label || 'Progressive Loading Demo'}</h3>
        <div className="loading-info-controls">
          <button 
            className="info-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>
      
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
      
      {isExpanded && manifestInfo && (
        <div className="manifest-info">
          <div className="info-separator" />
          
          {manifestInfo.description && (
            <div className="info-row-full">
              <span className="info-label">Description:</span>
              <span className="info-value-full">{manifestInfo.description}</span>
            </div>
          )}
          
          {manifestInfo.metadata.map((item, index) => {
            const label = item.label?.en?.[0] || '';
            const value = item.value?.en?.[0] || '';
            if (!label || !value) return null;
            
            return (
              <div className="info-row" key={index}>
                <span className="info-label">{label}:</span>
                <span className="info-value">{value}</span>
              </div>
            );
          })}
          
          {manifestInfo.rights && (
            <div className="info-row-full">
              <span className="info-label">License:</span>
              <a 
                href={manifestInfo.rights} 
                target="_blank" 
                rel="noopener noreferrer"
                className="info-link"
              >
                {manifestInfo.rights.includes('creativecommons') ? 'Creative Commons' : 'View License'}
              </a>
            </div>
          )}
          
          <div className="info-separator" />
          
          <div className="manifest-actions">
            <button 
              className="manifest-btn"
              onClick={() => setShowManifest(!showManifest)}
            >
              {showManifest ? 'Hide' : 'Show'} Manifest
            </button>
            <a 
              href={manifestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="manifest-btn"
            >
              Open JSON ↗
            </a>
          </div>
          
          {showManifest && (
            <div className="manifest-json">
              <pre>{JSON.stringify(manifest, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}