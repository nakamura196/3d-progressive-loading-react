'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCollection } from '../hooks/useCollection';
import './ModelsList.css';

// モデルカードコンポーネント
function ModelCard({ item }) {
  const [previewError, setPreviewError] = useState(false);
  const thumbnailUrl = item.thumbnail?.[0]?.id;
  
  // メタデータから重要な情報を抽出
  const getMetadataValue = (label) => {
    const meta = item.metadata?.find(m => 
      m.label?.en?.[0]?.toLowerCase() === label.toLowerCase()
    );
    return meta?.value?.en?.[0];
  };
  
  const created = getMetadataValue('created');
  const lodLevels = getMetadataValue('lod levels');
  const totalSize = getMetadataValue('total size');
  
  return (
    <div className="model-card">
      <div className="model-thumbnail">
        {thumbnailUrl && !previewError ? (
          <img 
            src={thumbnailUrl} 
            alt={item.label?.en?.[0] || 'Model thumbnail'}
            onError={() => setPreviewError(true)}
            className="thumbnail-image"
          />
        ) : (
          <div className="thumbnail-placeholder">
            <span>3D</span>
          </div>
        )}
      </div>
      
      <div className="model-info">
        <h3>{item.label?.en?.[0] || 'Untitled'}</h3>
        {item.summary?.en?.[0] && (
          <p className="model-description">{item.summary.en[0]}</p>
        )}
        
        <div className="model-metadata">
          {created && <span className="meta-item">📅 {created}</span>}
          {lodLevels && <span className="meta-item">📊 {lodLevels} LODs</span>}
          {totalSize && <span className="meta-item">💾 {totalSize}</span>}
        </div>
        
        <div className="model-actions">
          <Link 
            href={`/viewer?manifest=${item.id}`} 
            className="btn btn-primary"
          >
            View Model
          </Link>
          <a 
            href={item.id} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            IIIF Manifest
          </a>
        </div>
      </div>
    </div>
  );
}

// メインリストページ
export function ModelsList() {
  const { collection, loading, error } = useCollection();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading collection...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Error loading collection</h2>
        <p>{error}</p>
      </div>
    );
  }
  
  // フィルタリングとソート
  let items = collection?.items || [];
  
  if (searchTerm) {
    items = items.filter(item => {
      const label = item.label?.en?.[0]?.toLowerCase() || '';
      const summary = item.summary?.en?.[0]?.toLowerCase() || '';
      return label.includes(searchTerm.toLowerCase()) || 
             summary.includes(searchTerm.toLowerCase());
    });
  }
  
  // ソート
  items = [...items].sort((a, b) => {
    if (sortBy === 'name') {
      return (a.label?.en?.[0] || '').localeCompare(b.label?.en?.[0] || '');
    }
    return 0;
  });
  
  return (
    <div className="models-list-page">
      <header className="page-header">
        <div className="header-content">
          <h1>{collection?.label?.en?.[0] || '3D Models Collection'}</h1>
          {collection?.summary?.en?.[0] && (
            <p className="collection-description">{collection.summary.en[0]}</p>
          )}
          
          <div className="header-actions">
            <Link href="/map" className="btn btn-map">
              🗺️ Map View
            </Link>
            <Link href="/" className="btn btn-viewer">
              🎮 3D Viewer
            </Link>
          </div>
        </div>
        
        <div className="collection-stats">
          {collection?.metadata?.map((meta, idx) => (
            <div key={idx} className="stat-item">
              <span className="stat-label">{meta.label?.en?.[0]}:</span>
              <span className="stat-value">{meta.value?.en?.[0]}</span>
            </div>
          ))}
        </div>
      </header>
      
      <div className="list-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Name</option>
            <option value="date">Date</option>
            <option value="size">Size</option>
          </select>
        </div>
        
        <div className="results-count">
          {items.length} model{items.length !== 1 ? 's' : ''} found
        </div>
      </div>
      
      <div className="models-grid">
        {items.map((item, index) => (
          <ModelCard key={item.id || index} item={item} />
        ))}
      </div>
      
      {items.length === 0 && (
        <div className="no-results">
          <p>No models found matching your search.</p>
        </div>
      )}
    </div>
  );
}