#!/usr/bin/env python3

import json
import os
import sys
import glob
from datetime import datetime
from pathlib import Path

def create_iiif_collection(manifest_dir, base_url, collection_metadata=None):
    """Create IIIF Collection from all manifests in a directory"""
    
    # Find all IIIF manifest files
    manifest_files = glob.glob(os.path.join(manifest_dir, '*_iiif.json'))
    
    if not manifest_files:
        print(f"No IIIF manifests found in {manifest_dir}")
        return None
    
    # Create collection structure
    collection = {
        "@context": [
            "http://iiif.io/api/presentation/3/context.json",
            "http://iiif.io/api/extension/navplace/context.json"
        ],
        "id": f"{base_url}/collection.json",
        "type": "Collection",
        "label": {"en": [collection_metadata.get('label', '3D Models Collection')]},
        "metadata": [
            {"label": {"en": ["Generated"]}, "value": {"en": [datetime.now().isoformat()]}},
            {"label": {"en": ["Total Items"]}, "value": {"en": [str(len(manifest_files))]}}
        ],
        "summary": {"en": [collection_metadata.get('description', 'Collection of 3D models with IIIF manifests')]},
        "items": [],
        "navPlace": {
            "id": f"{base_url}/collection/feature-collection",
            "type": "FeatureCollection",
            "features": []
        }
    }
    
    # Add custom metadata
    if collection_metadata:
        for key, value in collection_metadata.items():
            if key not in ['label', 'description']:
                collection['metadata'].append({
                    "label": {"en": [key]},
                    "value": {"en": [value]}
                })
    
    # Process each manifest
    for manifest_path in sorted(manifest_files):
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
            
            # Extract key information from manifest
            manifest_id = f"{base_url}/{os.path.basename(manifest_path)}"
            
            # Create collection item (reference to manifest)
            item = {
                "id": manifest_id,
                "type": "Manifest",
                "label": manifest.get('label', {"en": ["Untitled"]})
            }
            
            # Add thumbnail if available
            if 'thumbnail' in manifest and manifest['thumbnail']:
                item['thumbnail'] = manifest['thumbnail']
            
            # Add summary if available
            if 'summary' in manifest:
                item['summary'] = manifest['summary']
            
            # Add metadata preview
            if 'metadata' in manifest:
                # Extract key metadata for preview
                preview_metadata = []
                for meta in manifest['metadata']:
                    label = meta.get('label', {}).get('en', [''])[0]
                    if label in ['Created', 'Scanner', 'Total Size', 'LOD Levels']:
                        preview_metadata.append(meta)
                if preview_metadata:
                    item['metadata'] = preview_metadata
            
            collection['items'].append(item)
            
            # Extract navPlace if present in manifest
            if 'items' in manifest and manifest['items']:
                canvas = manifest['items'][0]  # First canvas
                if 'navPlace' in canvas and canvas['navPlace'].get('type') == 'FeatureCollection':
                    # Add features to collection's navPlace
                    features = canvas['navPlace'].get('features', [])
                    for feature in features:
                        # Add manifest reference to feature properties
                        if 'properties' not in feature:
                            feature['properties'] = {}
                        feature['properties']['manifest'] = manifest_id
                        collection['navPlace']['features'].append(feature)
        
        except Exception as e:
            print(f"Error processing {manifest_path}: {e}")
            continue
    
    # Remove navPlace if no geographic features found
    if not collection['navPlace']['features']:
        del collection['navPlace']
    
    return collection

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Create IIIF Collection from manifests')
    parser.add_argument('manifest_dir', help='Directory containing IIIF manifest files')
    parser.add_argument('-u', '--url', default='http://localhost:3000/data/manifests',
                        help='Base URL for the collection')
    parser.add_argument('-o', '--output', help='Output collection file path')
    parser.add_argument('--label', default='3D Models Collection', help='Collection label')
    parser.add_argument('--description', help='Collection description')
    parser.add_argument('-m', '--metadata', action='append', nargs=2, metavar=('KEY', 'VALUE'),
                        help='Add metadata key-value pairs')
    
    args = parser.parse_args()
    
    # Prepare metadata
    collection_metadata = {
        'label': args.label,
        'description': args.description or f'Collection of 3D models from {args.manifest_dir}'
    }
    
    if args.metadata:
        for key, value in args.metadata:
            collection_metadata[key] = value
    
    # Create collection
    collection = create_iiif_collection(
        manifest_dir=args.manifest_dir,
        base_url=args.url,
        collection_metadata=collection_metadata
    )
    
    if collection:
        # Determine output path
        output_path = args.output or os.path.join(args.manifest_dir, 'collection.json')
        
        # Write collection
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(collection, f, indent=2, ensure_ascii=False)
        
        print(f"✅ IIIF Collection created: {output_path}")
        print(f"📊 Manifests included: {len(collection['items'])}")
        
        # Show geographic features if any
        if 'navPlace' in collection:
            print(f"🗺️ Geographic features: {len(collection['navPlace']['features'])}")
    else:
        print("❌ Failed to create collection")

if __name__ == "__main__":
    if len(sys.argv) == 1:
        print("Usage:")
        print("  python3 create_collection.py /path/to/manifests")
        print("  python3 create_collection.py ./public/data/manifests --label 'My 3D Collection'")
    else:
        main()