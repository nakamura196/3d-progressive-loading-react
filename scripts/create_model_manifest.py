#!/usr/bin/env python3

import json
import os
import sys
import argparse
from pathlib import Path
from datetime import datetime
import glob

def find_lod_files(model_dir, model_name):
    """Find all LOD files for a model following the naming convention"""
    lod_files = {}
    
    # Look for files matching pattern: modelname_lod*.glb
    pattern = os.path.join(model_dir, f"{model_name}_lod*.glb")
    files = glob.glob(pattern)
    
    for file_path in files:
        filename = os.path.basename(file_path)
        # Extract LOD level from filename (e.g., model_lod0.glb -> lod0)
        if '_lod' in filename:
            lod_part = filename.split('_lod')[1].split('.')[0]
            if lod_part.isdigit():
                lod_level = f"lod{lod_part}"
                file_size = os.path.getsize(file_path)
                lod_files[lod_level] = {
                    'filename': filename,
                    'size': file_size,
                    'path': file_path
                }
    
    return lod_files

def get_quality_for_lod(lod_level):
    """Map LOD level to quality descriptor"""
    quality_map = {
        'lod0': 'high',
        'lod1': 'medium',
        'lod2': 'low',
        'lod3': 'thumbnail',
        'lod4': 'thumbnail'
    }
    return quality_map.get(lod_level, 'default')

def get_label_for_lod(lod_level):
    """Get human-readable label for LOD level"""
    label_map = {
        'lod0': 'Maximum resolution (100%)',
        'lod1': 'High resolution (50%)',
        'lod2': 'Medium resolution (25%)',
        'lod3': 'Low resolution (10%)',
        'lod4': 'Lowest resolution (5%)'
    }
    return label_map.get(lod_level, f'Level {lod_level}')

def create_iiif_manifest(model_name, model_dir, base_url, metadata=None):
    """Create IIIF manifest for a model with LOD levels"""
    
    # Find all LOD files
    lod_files = find_lod_files(model_dir, model_name)
    
    if not lod_files:
        print(f"Warning: No LOD files found for model '{model_name}' in {model_dir}")
        print(f"Looking for pattern: {model_name}_lod*.glb")
        return None
    
    # Calculate total size
    total_size = sum(f['size'] for f in lod_files.values())
    total_size_mb = total_size / (1024 * 1024)
    
    # Create manifest structure
    manifest = {
        "@context": [
            "http://iiif.io/api/presentation/3/context.json",
            {
                "gltf": "https://www.khronos.org/gltf/",
                "lod": "http://www.w3.org/ns/lod#",
                "quality": "http://iiif.io/api/presentation/3#quality"
            }
        ],
        "id": f"{base_url}/manifest.json",
        "type": "Manifest",
        "label": {"en": [metadata.get('label', model_name)]},
        "metadata": [],
        "summary": {"en": [metadata.get('description', f'3D model with {len(lod_files)} LOD levels')]},
        "rights": metadata.get('rights', 'http://creativecommons.org/licenses/by/4.0/'),
        "requiredStatement": {
            "label": {"en": ["Attribution"]},
            "value": {"en": [metadata.get('attribution', 'Provided via IIIF 3D Extension')]}
        },
        "items": [],
        "thumbnail": [],
        "rendering": [],
        "viewing_direction": "none",
        "behavior": ["continuous", "individuals"],
        "service": [
            {
                "@context": "http://iiif.io/api/3d/0/context.json",
                "@id": base_url,
                "@type": "Model3DService",
                "profile": "http://iiif.io/api/3d/0/level1.json"
            }
        ]
    }
    
    # Add metadata
    if metadata:
        for key, value in metadata.items():
            if key not in ['label', 'description', 'rights', 'attribution']:
                manifest['metadata'].append({
                    "label": {"en": [key]},
                    "value": {"en": [value]}
                })
    
    # Add generated metadata
    manifest['metadata'].extend([
        {"label": {"en": ["Generated"]}, "value": {"en": [datetime.now().isoformat()]}},
        {"label": {"en": ["3D Format"]}, "value": {"en": ["glTF 2.0 Binary (.glb)"]}},
        {"label": {"en": ["LOD Levels"]}, "value": {"en": [str(len(lod_files))]}},
        {"label": {"en": ["Total Size"]}, "value": {"en": [f"{total_size_mb:.1f} MB"]}}
    ])
    
    # Create canvas
    canvas = {
        "id": f"{base_url}/canvas/1",
        "type": "Canvas",
        "label": {"en": ["3D Model View"]},
        "height": 1000,
        "width": 1000,
        "items": [],
        "annotations": []
    }
    
    # Create annotation page with Choice body for LOD variants
    anno_page = {
        "id": f"{base_url}/canvas/1/page",
        "type": "AnnotationPage",
        "items": []
    }
    
    # Create Choice with LOD items
    choice_items = []
    rendering_items = []
    
    # Sort LOD levels (lod0, lod1, etc.)
    sorted_lods = sorted(lod_files.items(), key=lambda x: x[0])
    
    # Determine relative path from public root
    model_dir_relative = model_dir.replace('public/', '').replace('public\\', '')
    if not model_dir_relative.startswith('/'):
        model_dir_relative = '/' + model_dir_relative
    
    for lod_level, file_info in sorted_lods:
        # Model URL path
        model_url = f"{model_dir_relative}/{file_info['filename']}"
        
        # Create Choice item
        choice_item = {
            "id": model_url,
            "type": "Model",
            "format": "model/gltf-binary",
            "label": {"en": [get_label_for_lod(lod_level)]},
            "profile": "https://www.khronos.org/gltf/",
            "service": [
                {
                    "id": model_url,
                    "type": "ModelService",
                    "profile": "http://iiif.io/api/3d/0/level1.json",
                    "quality": get_quality_for_lod(lod_level),
                    "fileSize": file_info['size'],
                    "lodLevel": lod_level
                }
            ]
        }
        choice_items.append(choice_item)
        
        # Add rendering item
        size_mb = file_info['size'] / (1024 * 1024)
        rendering_item = {
            "id": model_url,
            "type": "Model",
            "label": {"en": [f"Download {lod_level.upper()} ({size_mb:.1f} MB)"]},
            "format": "model/gltf-binary"
        }
        rendering_items.append(rendering_item)
    
    # Create main annotation with Choice
    annotation = {
        "id": f"{base_url}/canvas/1/annotation/1",
        "type": "Annotation",
        "motivation": "painting",
        "target": f"{base_url}/canvas/1",
        "body": {
            "type": "Choice",
            "items": choice_items
        }
    }
    
    anno_page["items"].append(annotation)
    canvas["items"].append(anno_page)
    manifest["items"].append(canvas)
    
    # Set rendering items
    manifest["rendering"] = rendering_items
    
    # Set thumbnail (use smallest LOD)
    if 'lod4' in lod_files:
        thumbnail_lod = 'lod4'
    elif 'lod3' in lod_files:
        thumbnail_lod = 'lod3'
    else:
        thumbnail_lod = sorted_lods[0][0] if sorted_lods else None
    
    if thumbnail_lod:
        thumbnail_url = f"{model_dir_relative}/{lod_files[thumbnail_lod]['filename']}"
        manifest["thumbnail"] = [
            {
                "id": thumbnail_url,
                "type": "Model",
                "format": "model/gltf-binary",
                "service": [
                    {
                        "@id": thumbnail_url,
                        "@type": "ModelService",
                        "profile": "http://iiif.io/api/3d/0/level0.json"
                    }
                ]
            }
        ]
    
    return manifest

def main():
    parser = argparse.ArgumentParser(description='Create IIIF manifest for 3D model with LOD')
    parser.add_argument('model_name', help='Model name (base name without _lod suffix)')
    parser.add_argument('model_dir', help='Directory containing the LOD files')
    parser.add_argument('-u', '--url', default='http://localhost:3000', help='Base URL for the manifest')
    parser.add_argument('-o', '--output', help='Output manifest file path')
    parser.add_argument('--label', help='Display label for the model')
    parser.add_argument('--description', help='Description of the model')
    parser.add_argument('--attribution', help='Attribution text')
    parser.add_argument('--rights', help='Rights/license URL')
    parser.add_argument('-m', '--metadata', action='append', nargs=2, metavar=('KEY', 'VALUE'),
                        help='Add metadata key-value pairs (can be used multiple times)')
    
    args = parser.parse_args()
    
    # Prepare metadata
    metadata = {
        'label': args.label or args.model_name,
        'description': args.description,
        'attribution': args.attribution,
        'rights': args.rights
    }
    
    # Add custom metadata
    if args.metadata:
        for key, value in args.metadata:
            metadata[key] = value
    
    # Remove None values
    metadata = {k: v for k, v in metadata.items() if v is not None}
    
    # Create manifest
    manifest = create_iiif_manifest(
        model_name=args.model_name,
        model_dir=args.model_dir,
        base_url=args.url,
        metadata=metadata
    )
    
    if manifest:
        # Determine output path
        if args.output:
            output_path = args.output
        else:
            output_path = os.path.join(args.model_dir, f"{args.model_name}_manifest.json")
        
        # Write manifest
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        print(f"✅ IIIF manifest created: {output_path}")
        print(f"📊 LOD levels found: {len(manifest['rendering'])}")
        for item in manifest['rendering']:
            print(f"  - {item['label']['en'][0]}")
    else:
        print("❌ Failed to create manifest")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) == 1:
        print("Usage examples:")
        print("  python3 create_model_manifest.py mymodel ./models/mymodel")
        print("  python3 create_model_manifest.py scan ./public/data/models/scan --label '3D Scan'")
        print("  python3 create_model_manifest.py model ./models -o manifest.json --metadata Author 'John Doe'")
        print("\nFor more options: python3 create_model_manifest.py -h")
    else:
        main()