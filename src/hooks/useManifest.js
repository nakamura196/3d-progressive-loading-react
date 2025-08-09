import { useState, useEffect, useCallback } from 'react';

export class IIIFManifestLoader {
  constructor() {
    this.manifest = null;
  }

  async load(manifestUrl) {
    try {
      const response = await fetch(manifestUrl);
      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.status}`);
      }
      this.manifest = await response.json();
      this.validateManifest();
      return this.manifest;
    } catch (error) {
      console.error('Error loading IIIF manifest:', error);
      throw error;
    }
  }

  validateManifest() {
    if (!this.manifest) {
      throw new Error('No manifest loaded');
    }
    
    if (!this.manifest.type || this.manifest.type !== 'Manifest') {
      throw new Error('Invalid IIIF manifest: type must be "Manifest"');
    }
    
    if (!this.manifest.items || !Array.isArray(this.manifest.items)) {
      throw new Error('IIIF manifest must contain items array');
    }
  }

  extractModelsFromIIIF() {
    if (!this.manifest || !this.manifest.items) {
      return [];
    }

    const models = [];
    
    // IIIFマニフェストから3Dモデル情報を抽出
    this.manifest.items.forEach((canvas) => {
      if (canvas.items && canvas.items[0] && canvas.items[0].items) {
        canvas.items[0].items.forEach((annotation) => {
          if (annotation.body && annotation.body.type === 'Choice' && annotation.body.items) {
            const lodItemsWithSize = [];
            
            // 各アイテムにファイルサイズ情報を付加
            annotation.body.items.forEach((item) => {
              if (item.type === 'Model' && item.format === 'model/gltf-binary') {
                const fileSize = item.service?.[0]?.fileSize || 0;
                lodItemsWithSize.push({
                  item: item,
                  fileSize: fileSize
                });
              }
            });
            
            // ファイルサイズでソート（小さい順）
            lodItemsWithSize.sort((a, b) => a.fileSize - b.fileSize);
            
            const lods = {};
            const lodLevels = ['low', 'medium', 'high', 'ultra', 'extreme'];
            
            // ソート済みのアイテムをLODレベルに割り当て
            lodItemsWithSize.forEach((itemWithSize, index) => {
              const item = itemWithSize.item;
              const lodLevel = lodLevels[Math.min(index, lodLevels.length - 1)];
              
              // URLパスを調整（/sponza/ -> /data/models/sponza/）
              let url = item.id;
              if (url.startsWith('https://example.com/3d')) {
                url = url.replace('https://example.com/3d', '');
              }
              if (url.startsWith('/sponza/')) {
                url = url.replace('/sponza/', '/data/models/sponza/');
              }
              
              lods[lodLevel] = {
                url: url,
                fileSize: this.formatFileSize(itemWithSize.fileSize),
                fileSizeBytes: itemWithSize.fileSize,
                vertices: 'auto',
                description: this.getLabelText(item.label),
                originalLod: item.service?.[0]?.lodLevel
              };
            });
            
            // モデル情報を作成
            if (Object.keys(lods).length > 0) {
              models.push({
                id: 'model',
                name: this.getLabelText(this.manifest.label),
                description: this.getLabelText(this.manifest.summary),
                lods: lods,
                metadata: this.extractMetadata()
              });
            }
          }
        });
      }
    });

    return models;
  }

  getLODLevelFromItem(item, index) {
    // service内のlodLevelまたはqualityから判定
    const service = item.service?.[0];
    if (service?.lodLevel) {
      const lodMap = {
        'lod3': 'low',
        'lod2': 'medium',
        'lod1': 'high',
        'lod0': 'extreme'
      };
      return lodMap[service.lodLevel] || 'medium';
    }
    
    if (service?.quality) {
      const qualityMap = {
        'thumbnail': 'low',
        'low': 'medium',
        'medium': 'high',
        'high': 'ultra'
      };
      return qualityMap[service.quality] || 'medium';
    }
    
    // インデックスベースのフォールバック
    const levels = ['extreme', 'ultra', 'high', 'medium', 'low'];
    return levels[Math.min(index, levels.length - 1)];
  }

  formatFileSize(bytes) {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  }

  getLabelText(label) {
    if (!label) return '';
    if (typeof label === 'string') return label;
    if (label.en) {
      return Array.isArray(label.en) ? label.en[0] : label.en;
    }
    return '';
  }

  extractMetadata() {
    const metadata = {};
    
    if (this.manifest.metadata) {
      this.manifest.metadata.forEach(item => {
        const label = this.getLabelText(item.label);
        const value = this.getLabelText(item.value);
        if (label && value) {
          metadata[label.toLowerCase()] = value;
        }
      });
    }
    
    if (this.manifest.rights) {
      metadata.license = this.manifest.rights;
    }
    
    return metadata;
  }

  getModelConfig(modelId) {
    const models = this.extractModelsFromIIIF();
    const model = models.find(m => m.id === modelId) || models[0];
    
    if (!model) {
      throw new Error('No model found in IIIF manifest');
    }
    
    const config = {};
    Object.keys(model.lods).forEach(level => {
      config[level] = model.lods[level].url;
    });
    
    config.lodLevels = Object.keys(model.lods);
    config.progressive = true;
    config.metadata = model;
    
    return config;
  }

  getSettings() {
    // IIIFマニフェストから設定を抽出
    return {
      defaultModel: 'model',
      autoRotate: true,
      rotationSpeed: 0.5,
      enableProgressive: true,
      lodDelays: {
        low: 100,
        medium: 500,
        high: 1000,
        ultra: 1500,
        extreme: 2000
      },
      transitionDuration: 500
    };
  }

  getDefaultModelId() {
    const models = this.extractModelsFromIIIF();
    return models[0]?.id || 'model';
  }
}

export function useManifest(manifestUrl) {
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!manifestUrl) return;

    const loader = new IIIFManifestLoader();
    setLoading(true);
    setError(null);

    loader.load(manifestUrl)
      .then(data => {
        setManifest(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [manifestUrl]);

  const getModelConfig = useCallback((modelId) => {
    if (!manifest) return null;
    
    const loader = new IIIFManifestLoader();
    loader.manifest = manifest;
    return loader.getModelConfig(modelId || loader.getDefaultModelId());
  }, [manifest]);

  const getSettings = useCallback(() => {
    if (!manifest) return {};
    
    const loader = new IIIFManifestLoader();
    loader.manifest = manifest;
    return loader.getSettings();
  }, [manifest]);

  const getModels = useCallback(() => {
    if (!manifest) return [];
    
    const loader = new IIIFManifestLoader();
    loader.manifest = manifest;
    return loader.extractModelsFromIIIF();
  }, [manifest]);

  return {
    manifest,
    loading,
    error,
    getModelConfig,
    getSettings,
    getModels
  };
}