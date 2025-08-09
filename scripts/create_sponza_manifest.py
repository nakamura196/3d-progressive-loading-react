#!/usr/bin/env python3
import json
import os
from datetime import datetime

def create_sponza_iiif_manifest():
    """Create IIIF manifest for Sponza model"""
    
    # Sponza model files with actual sizes
    sponza_files = [
        {"name": "sponza_s_lod0.glb", "size": 177194648, "lod": "lod0", "quality": "high", "label": "Maximum resolution with all details"},
        {"name": "sponza_s_lod1.glb", "size": 34603008, "lod": "lod1", "quality": "medium", "label": "High resolution"},
        {"name": "sponza_s_lod2.glb", "size": 17825792, "lod": "lod2", "quality": "low", "label": "Medium-high resolution"},
        {"name": "sponza_s_lod3.glb", "size": 7340032, "lod": "lod3", "quality": "thumbnail", "label": "Medium-low resolution"},
        {"name": "sponza_s_lod4.glb", "size": 3879731, "lod": "lod4", "quality": "thumbnail", "label": "Lowest resolution for fast preview"}
    ]
    
    manifest = {
        "@context": [
            "http://iiif.io/api/presentation/3/context.json",
            {
                "gltf": "https://www.khronos.org/gltf/",
                "lod": "http://www.w3.org/ns/lod#",
                "quality": "http://iiif.io/api/presentation/3#quality"
            }
        ],
        "id": "http://localhost:3000/sample_manifest.json",
        "type": "Manifest",
        "label": {
            "en": ["Sponza Atrium"]
        },
        "metadata": [
            {
                "label": {"en": ["Author"]},
                "value": {"en": ["Crytek"]}
            },
            {
                "label": {"en": ["License"]},
                "value": {"en": ["CC BY 3.0"]}
            },
            {
                "label": {"en": ["Source"]},
                "value": {"en": ["https://www.crytek.com"]}
            },
            {
                "label": {"en": ["Generated"]},
                "value": {"en": [datetime.now().isoformat()]}
            },
            {
                "label": {"en": ["3D Format"]},
                "value": {"en": ["glTF 2.0 Binary (.glb)"]}
            },
            {
                "label": {"en": ["LOD Support"]},
                "value": {"en": ["5 levels of detail available"]}
            },
            {
                "label": {"en": ["Total Size"]},
                "value": {"en": ["230MB"]}
            }
        ],
        "summary": {
            "en": ["Crytek Sponza Atrium 3D model with 5 LOD levels for progressive loading"]
        },
        "rights": "http://creativecommons.org/licenses/by/3.0/",
        "requiredStatement": {
            "label": {"en": ["Attribution"]},
            "value": {"en": ["Crytek Sponza Atrium, licensed under CC BY 3.0"]}
        },
        "items": [
            {
                "id": "http://localhost:3000/canvas/sponza",
                "type": "Canvas",
                "label": {"en": ["Sponza 3D Model"]},
                "height": 1000,
                "width": 1000,
                "duration": None,
                "items": [
                    {
                        "id": "http://localhost:3000/canvas/sponza/page",
                        "type": "AnnotationPage",
                        "items": [
                            {
                                "id": "http://localhost:3000/canvas/sponza/annotation",
                                "type": "Annotation",
                                "motivation": "painting",
                                "target": "http://localhost:3000/canvas/sponza",
                                "body": {
                                    "type": "Choice",
                                    "items": []
                                }
                            }
                        ]
                    }
                ],
                "annotations": []
            }
        ],
        "thumbnail": [],
        "rendering": [],
        "viewing_direction": "none",
        "behavior": ["continuous", "individuals"],
        "service": [
            {
                "@context": "http://iiif.io/api/3d/0/context.json",
                "@id": "http://localhost:3000",
                "@type": "Model3DService",
                "profile": "http://iiif.io/api/3d/0/level1.json"
            }
        ]
    }
    
    # Add model items
    body_items = []
    rendering_items = []
    
    for file_info in sponza_files:
        model_item = {
            "id": f"/data/models/sponza/{file_info['name']}",
            "type": "Model",
            "format": "model/gltf-binary",
            "label": {"en": [file_info['label']]},
            "profile": "https://www.khronos.org/gltf/",
            "service": [
                {
                    "id": f"/data/models/sponza/{file_info['name']}",
                    "type": "ModelService",
                    "profile": "http://iiif.io/api/3d/0/level1.json",
                    "quality": file_info['quality'],
                    "fileSize": file_info['size'],
                    "lodLevel": file_info['lod']
                }
            ]
        }
        body_items.append(model_item)
        
        # Add to rendering for download links
        size_mb = file_info['size'] / (1024 * 1024)
        rendering_item = {
            "id": f"/data/models/sponza/{file_info['name']}",
            "type": "Model",
            "label": {"en": [f"Download {file_info['lod'].upper()} ({size_mb:.1f} MB)"]},
            "format": "model/gltf-binary"
        }
        rendering_items.append(rendering_item)
    
    # Set the body items
    manifest["items"][0]["items"][0]["items"][0]["body"]["items"] = body_items
    manifest["rendering"] = rendering_items
    
    # Set thumbnail to smallest LOD
    manifest["thumbnail"] = [
        {
            "id": "/data/models/sponza/sponza_s_lod4.glb",
            "type": "Model",
            "format": "model/gltf-binary",
            "service": [
                {
                    "@id": "/data/models/sponza/sponza_s_lod4.glb",
                    "@type": "ModelService",
                    "profile": "http://iiif.io/api/3d/0/level0.json"
                }
            ]
        }
    ]
    
    return manifest

if __name__ == "__main__":
    manifest = create_sponza_iiif_manifest()
    
    # Save manifest
    output_path = "../data/manifests/sponza_iiif.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"Created IIIF manifest: {output_path}")
    print(f"Total models: {len(manifest['items'][0]['items'][0]['items'][0]['body']['items'])}")