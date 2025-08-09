import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Map, { Marker, Popup, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { useCollection } from '../hooks/useCollection';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapView.css';

export function MapView() {
  const { collection, loading, error } = useCollection();
  const navigate = useNavigate();
  const [viewState, setViewState] = useState({
    longitude: 139.7,
    latitude: 35.68,
    zoom: 11
  });
  const [selectedModel, setSelectedModel] = useState(null);
  const [mapFeatures, setMapFeatures] = useState([]);

  useEffect(() => {
    if (collection?.navPlace?.features) {
      // navPlaceから地理情報を抽出
      const features = collection.navPlace.features.map(feature => ({
        ...feature,
        manifestId: feature.properties?.manifest
      }));
      setMapFeatures(features);
      
      // 地図の中心を計算
      if (features.length > 0) {
        const bounds = features.reduce((acc, feature) => {
          const [lon, lat] = feature.geometry.coordinates;
          return {
            minLon: Math.min(acc.minLon, lon),
            maxLon: Math.max(acc.maxLon, lon),
            minLat: Math.min(acc.minLat, lat),
            maxLat: Math.max(acc.maxLat, lat)
          };
        }, {
          minLon: features[0].geometry.coordinates[0],
          maxLon: features[0].geometry.coordinates[0],
          minLat: features[0].geometry.coordinates[1],
          maxLat: features[0].geometry.coordinates[1]
        });
        
        setViewState({
          longitude: (bounds.minLon + bounds.maxLon) / 2,
          latitude: (bounds.minLat + bounds.maxLat) / 2,
          zoom: 12
        });
      }
    } else if (collection?.items) {
      // マニフェストから個別に地理情報を取得する必要がある場合
      // （今回は navPlace が collection にあるので不要）
    }
  }, [collection]);

  const getModelInfo = (manifestId) => {
    return collection?.items?.find(item => item.id === manifestId);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading map data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error loading map</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="map-view-page">
      <header className="map-header">
        <div className="header-content">
          <h1>3D Models Map</h1>
          <div className="header-actions">
            <Link to="/list" className="btn btn-list">
              📋 List View
            </Link>
            <Link to="/" className="btn btn-viewer">
              🎮 3D Viewer
            </Link>
          </div>
        </div>
      </header>

      <div className="map-container">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle="https://demotiles.maplibre.org/style.json"
        >
          <NavigationControl position="top-right" />
          <ScaleControl />

          {mapFeatures.map((feature, index) => {
            const [longitude, latitude] = feature.geometry.coordinates;
            const modelInfo = getModelInfo(feature.manifestId);
            const label = feature.properties?.label?.en?.[0] || modelInfo?.label?.en?.[0] || 'Model';
            
            return (
              <Marker
                key={feature.id || index}
                longitude={longitude}
                latitude={latitude}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedModel({ feature, modelInfo });
                }}
              >
                <div className="map-marker" title={label}>
                  <div className="marker-icon">📍</div>
                  <div className="marker-label">{label}</div>
                </div>
              </Marker>
            );
          })}

          {selectedModel && (
            <Popup
              longitude={selectedModel.feature.geometry.coordinates[0]}
              latitude={selectedModel.feature.geometry.coordinates[1]}
              anchor="bottom"
              onClose={() => setSelectedModel(null)}
              closeButton={true}
              closeOnClick={false}
              maxWidth="350px"
            >
              <div className="popup-content">
                <h3>{selectedModel.feature.properties?.label?.en?.[0] || 'Untitled'}</h3>
                
                {selectedModel.modelInfo && (
                  <>
                    {selectedModel.modelInfo.summary?.en?.[0] && (
                      <p className="popup-description">
                        {selectedModel.modelInfo.summary.en[0]}
                      </p>
                    )}
                    
                    <div className="popup-metadata">
                      {selectedModel.modelInfo.metadata?.map((meta, idx) => {
                        const label = meta.label?.en?.[0];
                        const value = meta.value?.en?.[0];
                        if (label && value && ['Created', 'Scanner', 'Total Size'].includes(label)) {
                          return (
                            <div key={idx} className="meta-item">
                              <span className="meta-label">{label}:</span>
                              <span className="meta-value">{value}</span>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                    
                    <div className="popup-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          navigate(`/viewer?manifest=${selectedModel.modelInfo.id}`);
                        }}
                      >
                        View 3D Model
                      </button>
                    </div>
                  </>
                )}
                
                <div className="popup-coordinates">
                  📍 {selectedModel.feature.geometry.coordinates[1].toFixed(4)}, 
                  {selectedModel.feature.geometry.coordinates[0].toFixed(4)}
                </div>
              </div>
            </Popup>
          )}
        </Map>

        <div className="map-legend">
          <h3>Legend</h3>
          <div className="legend-item">
            <span className="legend-icon">📍</span>
            <span>3D Model Location</span>
          </div>
          <div className="legend-stats">
            <div>Total Models: {mapFeatures.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}