#!/usr/bin/env python3

import json
import os
import sys
import argparse
from pathlib import Path
from datetime import datetime
import hashlib

def get_file_info(file_path):
    """Get file size and create ID from path"""
    if os.path.exists(file_path):
        size = os.path.getsize(file_path)
        with open(file_path, 'rb') as f:
            file_hash = hashlib.md5(f.read(1024)).hexdigest()[:8]
        return size, file_hash
    return 0, ""

def create_3d_manifest(
    model_base_path,
    base_url,
    manifest_id=None,
    label="3D Model",
    description="",
    lod_files=None,
    metadata=None
):
    """
    Create IIIF Presentation API 3.0 manifest for 3D model with LOD support
    
    Args:
        model_base_path: Base path to model files
        base_url: Base URL where files will be served
        manifest_id: ID for the manifest (default: base_url + /manifest.json)
        label: Label for the manifest
        description: Description of the 3D object
        lod_files: Dict of LOD files (e.g., {"lod0": "model_lod0.glb", ...})
        metadata: Additional metadata as list of {"label": ..., "value": ...}
    """
    
    if manifest_id is None:
        manifest_id = f"{base_url}/manifest.json"
    
    if lod_files is None:
        # Auto-detect LOD files
        lod_files = {}
        for lod_level in ["lod0", "lod1", "lod2", "lod3", "lod4"]:
            possible_files = [
                f"model_{lod_level}.glb",
                f"model_{lod_level}.gltf",
                f"{Path(model_base_path).stem}_{lod_level}.glb",
                f"{Path(model_base_path).stem}_{lod_level}.gltf"
            ]
            for file_name in possible_files:
                file_path = os.path.join(os.path.dirname(model_base_path), file_name)
                if os.path.exists(file_path):
                    lod_files[lod_level] = file_name
                    break
    
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
        "id": manifest_id,
        "type": "Manifest",
        "label": {"en": [label]},
        "metadata": metadata or [],
        "summary": {"en": [description]} if description else None,
        "rights": "http://creativecommons.org/licenses/by/4.0/",
        "requiredStatement": {
            "label": {"en": ["Attribution"]},
            "value": {"en": ["Provided via IIIF 3D Extension"]}
        },
        "items": []
    }
    
    # Remove None values
    manifest = {k: v for k, v in manifest.items() if v is not None}
    
    # Create canvas for 3D scene
    canvas_id = f"{base_url}/canvas/1"
    canvas = {
        "id": canvas_id,
        "type": "Canvas",
        "label": {"en": ["3D Model View"]},
        "height": 1000,
        "width": 1000,
        "duration": None,  # Can be used for animations
        "items": [],
        "annotations": []
    }
    
    # Create annotation page for 3D content
    anno_page = {
        "id": f"{canvas_id}/page",
        "type": "AnnotationPage",
        "items": []
    }
    
    # Add LOD variants as choices
    if lod_files:
        choices = []
        
        # Sort LODs by quality (lod0 = highest)
        sorted_lods = sorted(lod_files.items(), key=lambda x: x[0])
        
        for lod_name, file_name in sorted_lods:
            file_path = os.path.join(os.path.dirname(model_base_path), file_name)
            file_size, file_hash = get_file_info(file_path)
            
            # Determine quality level
            quality_map = {
                "lod0": "high",
                "lod1": "medium",
                "lod2": "low", 
                "lod3": "thumbnail",
                "lod4": "thumbnail"
            }
            quality = quality_map.get(lod_name, "default")
            
            # Determine recommended viewing distance/context
            context_map = {
                "lod0": "Close inspection / Full detail",
                "lod1": "Standard viewing",
                "lod2": "Overview / Fast loading",
                "lod3": "Preview / Mobile",
                "lod4": "Thumbnail / Listing"
            }
            viewing_hint = context_map.get(lod_name, "General viewing")
            
            choice_item = {
                "id": f"{base_url}/{file_name}",
                "type": "Model",
                "format": "model/gltf-binary",
                "label": {"en": [f"Level {lod_name.upper()} - {viewing_hint}"]},
                "profile": "https://www.khronos.org/gltf/",
                "service": [
                    {
                        "id": f"{base_url}/{file_name}",
                        "type": "ModelService",
                        "profile": "http://iiif.io/api/3d/0/level1.json",
                        "quality": quality,
                        "fileSize": file_size,
                        "lodLevel": lod_name
                    }
                ]
            }
            choices.append(choice_item)
        
        # Create main annotation with choice
        main_annotation = {
            "id": f"{anno_page['id']}/annotation/1",
            "type": "Annotation",
            "motivation": "painting",
            "target": canvas_id,
            "body": {
                "type": "Choice",
                "items": choices
            }
        }
        anno_page["items"].append(main_annotation)
    
    # Add thumbnail using lowest LOD
    if "lod3" in lod_files or "lod4" in lod_files:
        thumbnail_file = lod_files.get("lod4", lod_files.get("lod3"))
        manifest["thumbnail"] = [
            {
                "id": f"{base_url}/{thumbnail_file}",
                "type": "Model",
                "format": "model/gltf-binary",
                "service": [
                    {
                        "@id": f"{base_url}/{thumbnail_file}",
                        "@type": "ModelService",
                        "profile": "http://iiif.io/api/3d/0/level0.json"
                    }
                ]
            }
        ]
    
    # Add rendering for direct model access
    manifest["rendering"] = []
    for lod_name, file_name in sorted(lod_files.items()):
        file_path = os.path.join(os.path.dirname(model_base_path), file_name)
        file_size, _ = get_file_info(file_path)
        
        manifest["rendering"].append({
            "id": f"{base_url}/{file_name}",
            "type": "Model",
            "label": {"en": [f"Download {lod_name.upper()} ({file_size / 1024 / 1024:.1f} MB)"]},
            "format": "model/gltf-binary"
        })
    
    canvas["items"].append(anno_page)
    manifest["items"].append(canvas)
    
    # Add viewer recommendation
    manifest["viewing_direction"] = "none"
    manifest["behavior"] = ["continuous", "individuals"]
    
    # Add 3D-specific services
    manifest["service"] = [
        {
            "@context": "http://iiif.io/api/3d/0/context.json",
            "@id": base_url,
            "@type": "Model3DService",
            "profile": "http://iiif.io/api/3d/0/level1.json"
        }
    ]
    
    return manifest

def main():
    parser = argparse.ArgumentParser(description='Create IIIF manifest for 3D models with LOD')
    parser.add_argument('model_path', help='Path to the base model or directory')
    parser.add_argument('base_url', help='Base URL where models will be served')
    parser.add_argument('-o', '--output', default='manifest.json', help='Output manifest file')
    parser.add_argument('--label', default='3D Model', help='Label for the manifest')
    parser.add_argument('--description', default='', help='Description of the model')
    parser.add_argument('--metadata', action='append', nargs=2, metavar=('LABEL', 'VALUE'),
                        help='Add metadata (can be used multiple times)')
    
    args = parser.parse_args()
    
    # Process metadata
    metadata = []
    if args.metadata:
        for label, value in args.metadata:
            metadata.append({"label": {"en": [label]}, "value": {"en": [value]}})
    
    # Add default metadata
    metadata.extend([
        {"label": {"en": ["Generated"]}, "value": {"en": [datetime.now().isoformat()]}},
        {"label": {"en": ["3D Format"]}, "value": {"en": ["glTF 2.0 Binary (.glb)"]}},
        {"label": {"en": ["LOD Support"]}, "value": {"en": ["Multiple levels of detail available"]}}
    ])
    
    manifest = create_3d_manifest(
        model_base_path=args.model_path,
        base_url=args.base_url.rstrip('/'),
        label=args.label,
        description=args.description,
        metadata=metadata
    )
    
    # Write manifest
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"✅ IIIF manifest created: {args.output}")
    
    # Show summary
    if "rendering" in manifest:
        print(f"\n📊 LOD Levels included:")
        for render in manifest["rendering"]:
            print(f"  - {render['label']['en'][0]}")

if __name__ == "__main__":
    if len(sys.argv) == 1:
        print("Usage examples:")
        print("  python3 create_iiif_manifest.py model.glb https://example.com/3d")
        print("  python3 create_iiif_manifest.py lod_models/ https://example.com/3d --label 'Ancient Vase'")
        print("  python3 create_iiif_manifest.py model.glb https://example.com/3d --metadata Creator 'John Doe'")
        print("\nFor more options: python3 create_iiif_manifest.py -h")
    else:
        main()