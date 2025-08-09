#!/usr/bin/env python3
"""
Fix hardcoded localhost URLs in IIIF manifests to use relative paths
"""

import json
import os
import sys
from pathlib import Path

def fix_urls_in_dict(data):
    """Recursively fix localhost URLs in dictionary"""
    if isinstance(data, dict):
        new_dict = {}
        for key, value in data.items():
            if key == "id" and isinstance(value, str):
                # Fix manifest IDs - use relative paths
                if "http://localhost:3000" in value:
                    # Remove localhost for paths
                    if "/data/" in value or "/thumbnails/" in value:
                        new_dict[key] = value.replace("http://localhost:3000", "")
                    else:
                        # For other IDs, use placeholder
                        new_dict[key] = value.replace("http://localhost:3000", "https://example.org")
                else:
                    new_dict[key] = value
            elif key == "target" and isinstance(value, str):
                # Fix target URLs
                if "http://localhost:3000" in value:
                    new_dict[key] = value.replace("http://localhost:3000", "https://example.org")
                else:
                    new_dict[key] = value
            elif key == "@id" and isinstance(value, str):
                # Fix @id URLs
                if "http://localhost:3000" in value:
                    new_dict[key] = value.replace("http://localhost:3000", "https://example.org")
                else:
                    new_dict[key] = value
            else:
                new_dict[key] = fix_urls_in_dict(value)
        return new_dict
    elif isinstance(data, list):
        return [fix_urls_in_dict(item) for item in data]
    elif isinstance(data, str):
        # Fix any remaining localhost URLs in strings
        if "http://localhost:3000/data/" in data:
            return data.replace("http://localhost:3000", "")
        elif "http://localhost:3000/thumbnails/" in data:
            return data.replace("http://localhost:3000", "")
        elif "http://localhost:3000" in data:
            return data.replace("http://localhost:3000", "https://example.org")
    return data

def fix_manifest_file(filepath):
    """Fix URLs in a single manifest file"""
    print(f"Processing: {filepath}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Fix URLs
    fixed_data = fix_urls_in_dict(data)
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(fixed_data, f, indent=2, ensure_ascii=False)
    
    print(f"  ✅ Fixed: {filepath}")

def main():
    # Find all manifest files
    manifest_dir = Path("public/data/manifests")
    
    if not manifest_dir.exists():
        print(f"Error: Directory {manifest_dir} does not exist")
        sys.exit(1)
    
    # Process all JSON files
    json_files = list(manifest_dir.glob("*.json"))
    
    if not json_files:
        print(f"No JSON files found in {manifest_dir}")
        sys.exit(1)
    
    print(f"Found {len(json_files)} manifest files to process\n")
    
    for json_file in json_files:
        fix_manifest_file(json_file)
    
    print(f"\n✅ Successfully fixed {len(json_files)} manifest files")

if __name__ == "__main__":
    main()