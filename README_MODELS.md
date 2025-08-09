# Model Files

## Included Models

This repository includes the following Sponza model files:
- `sponza_s_lod2.glb` (17MB) - Medium-high resolution
- `sponza_s_lod3.glb` (7MB) - Medium-low resolution  
- `sponza_s_lod4.glb` (3.7MB) - Lowest resolution

## Large Model Files

Due to GitHub file size limitations, the following files are not included:
- `sponza_s_lod0.glb` (169MB) - Maximum resolution
- `sponza_s_lod1.glb` (33MB) - High resolution

### Downloading Large Models

You can download the complete Sponza model set from:
1. The original Crytek Sponza source
2. Use Git LFS for version control
3. Host on a CDN or cloud storage

### Using Git LFS

To include large models with Git LFS:

```bash
# Install Git LFS
git lfs install

# Track large GLB files
git lfs track "data/models/sponza/sponza_s_lod0.glb"
git lfs track "data/models/sponza/sponza_s_lod1.glb"

# Add and commit
git add .gitattributes data/models/sponza/sponza_s_lod[01].glb
git commit -m "Add large models with Git LFS"
```

## Model Information

All models are in glTF 2.0 Binary format (.glb) and licensed under CC BY 3.0 by Crytek.