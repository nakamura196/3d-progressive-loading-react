import React, { useState, useEffect } from 'react';
import { ThumbnailCapture } from '../components/ThumbnailCapture';

export function GenerateThumbnails() {
  const [currentModel, setCurrentModel] = useState(0);
  const [thumbnails, setThumbnails] = useState({});
  
  const models = [
    {
      name: 'sponza_s',
      url: '/data/models/sponza/sponza_s_lod2.glb',
      label: 'Sponza Atrium'
    },
    {
      name: 'scaniverse',
      url: '/data/models/scaniverse/scaniverse_lod2.glb',
      label: 'Scaniverse Scan 1'
    },
    {
      name: 'scaniverse2',
      url: '/data/models/scaniverse2/scaniverse2_lod2.glb',
      label: 'Scaniverse Scan 2'
    }
  ];
  
  const handleCapture = (blob) => {
    const model = models[currentModel];
    if (!model) return;
    
    // Convert blob to data URL for display
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnails(prev => ({
        ...prev,
        [model.name]: reader.result
      }));
      
      // Move to next model
      if (currentModel < models.length - 1) {
        setTimeout(() => {
          setCurrentModel(currentModel + 1);
        }, 500);
      }
    };
    reader.readAsDataURL(blob);
  };
  
  const downloadThumbnail = (name, dataUrl) => {
    const link = document.createElement('a');
    link.download = `${name}_thumbnail.png`;
    link.href = dataUrl;
    link.click();
  };
  
  const downloadAll = () => {
    Object.entries(thumbnails).forEach(([name, dataUrl]) => {
      setTimeout(() => {
        downloadThumbnail(name, dataUrl);
      }, 500);
    });
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Generate Thumbnails</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Status: Generating thumbnail for {models[currentModel]?.label || 'Complete'}</p>
        <progress value={currentModel} max={models.length} style={{ width: '100%' }} />
      </div>
      
      {currentModel < models.length && (
        <ThumbnailCapture
          key={currentModel}
          modelUrl={models[currentModel].url}
          onCapture={handleCapture}
        />
      )}
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '20px',
        marginTop: '20px'
      }}>
        {models.map((model) => (
          <div key={model.name} style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '15px',
            background: 'white'
          }}>
            <h3>{model.label}</h3>
            {thumbnails[model.name] ? (
              <>
                <img 
                  src={thumbnails[model.name]} 
                  alt={model.label}
                  style={{ width: '100%', borderRadius: '4px' }}
                />
                <button
                  onClick={() => downloadThumbnail(model.name, thumbnails[model.name])}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '10px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Download
                </button>
              </>
            ) : (
              <div style={{
                height: '200px',
                background: '#f0f0f0',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}>
                Waiting...
              </div>
            )}
          </div>
        ))}
      </div>
      
      {Object.keys(thumbnails).length === models.length && (
        <button
          onClick={downloadAll}
          style={{
            padding: '12px 24px',
            marginTop: '20px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Download All Thumbnails
        </button>
      )}
    </div>
  );
}