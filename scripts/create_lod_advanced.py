#!/usr/bin/env python3

import trimesh
import numpy as np
import os
import sys
import argparse
import requests
from pathlib import Path
from urllib.parse import urlparse
import tempfile
import time

def download_model(url, cache_dir=".model_cache"):
    """Download model from URL with caching"""
    os.makedirs(cache_dir, exist_ok=True)
    
    filename = os.path.basename(urlparse(url).path)
    if not filename:
        filename = "model.glb"
    
    cache_path = os.path.join(cache_dir, filename)
    
    if os.path.exists(cache_path):
        print(f"Using cached model: {cache_path}")
        return cache_path
    
    print(f"Downloading model from {url}...")
    print("This may take a while for large files...")
    
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        block_size = 8192
        downloaded = 0
        
        with open(cache_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=block_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        print(f"Progress: {percent:.1f}% ({downloaded:,} / {total_size:,} bytes)", end='\r')
        
        print(f"\nDownloaded to: {cache_path}")
        return cache_path
    
    except Exception as e:
        print(f"Error downloading model: {e}")
        if os.path.exists(cache_path):
            os.remove(cache_path)
        raise

def create_lod_levels(input_source, output_dir="lod_models", lod_config=None, max_memory_mb=2048):
    """
    Create LOD levels from a GLB model
    
    Args:
        input_source: File path or URL to the GLB model
        output_dir: Directory to save LOD models
        lod_config: Dictionary with LOD ratios (default: {"lod0": 1.0, "lod1": 0.5, "lod2": 0.25, "lod3": 0.1})
        max_memory_mb: Maximum memory to use in MB (for large models)
    """
    
    if input_source.startswith(('http://', 'https://')):
        input_file = download_model(input_source)
    else:
        input_file = input_source
        if not os.path.exists(input_file):
            raise FileNotFoundError(f"Model file not found: {input_file}")
    
    os.makedirs(output_dir, exist_ok=True)
    
    if lod_config is None:
        lod_config = {
            "lod0": 1.0,
            "lod1": 0.5,
            "lod2": 0.25,
            "lod3": 0.1,
            "lod4": 0.05,
        }
    
    print(f"\nLoading model: {input_file}")
    start_time = time.time()
    
    try:
        mesh = trimesh.load(input_file, force='mesh', process=False)
    except Exception as e:
        print(f"Error loading with trimesh, trying with process=True: {e}")
        mesh = trimesh.load(input_file, force='mesh', process=True)
    
    if isinstance(mesh, trimesh.Scene):
        print("Model is a scene, combining meshes...")
        meshes = []
        for name, geometry in mesh.geometry.items():
            if isinstance(geometry, trimesh.Trimesh):
                print(f"  - Found mesh: {name} ({len(geometry.faces)} faces)")
                meshes.append(geometry)
        
        if meshes:
            mesh = trimesh.util.concatenate(meshes)
        else:
            print("No valid mesh geometry found in the scene")
            return
    
    load_time = time.time() - start_time
    original_faces = len(mesh.faces)
    original_vertices = len(mesh.vertices)
    
    file_size_mb = os.path.getsize(input_file) / (1024 * 1024)
    
    print(f"\nModel loaded in {load_time:.2f} seconds")
    print(f"Original file size: {file_size_mb:.2f} MB")
    print(f"Original geometry: {original_faces:,} faces, {original_vertices:,} vertices")
    print(f"Bounds: {mesh.bounds[0]} to {mesh.bounds[1]}")
    
    base_filename = Path(input_file).stem
    
    print(f"\nCreating {len(lod_config)} LOD levels...")
    
    for lod_name, ratio in sorted(lod_config.items(), key=lambda x: -x[1]):
        print(f"\nProcessing {lod_name} (target: {ratio*100:.0f}%)...")
        start_time = time.time()
        
        if ratio == 1.0:
            simplified = mesh
        else:
            target_faces = max(int(original_faces * ratio), 12)
            
            try:
                print(f"  Simplifying to {target_faces:,} faces...")
                simplified = mesh.simplify_quadric_decimation(face_count=target_faces)
            except MemoryError:
                print(f"  Memory error! Trying with more aggressive simplification...")
                target_faces = max(int(target_faces * 0.5), 12)
                simplified = mesh.simplify_quadric_decimation(face_count=target_faces)
            except Exception as e:
                print(f"  Error during simplification: {e}")
                print(f"  Skipping {lod_name}")
                continue
        
        output_file = os.path.join(output_dir, f"{base_filename}_{lod_name}.glb")
        
        try:
            simplified.export(output_file)
            process_time = time.time() - start_time
            output_size_mb = os.path.getsize(output_file) / (1024 * 1024)
            
            actual_ratio = len(simplified.faces) / original_faces * 100
            
            print(f"  ✓ {lod_name}: {len(simplified.faces):,} faces ({actual_ratio:.1f}%)")
            print(f"    File: {output_file}")
            print(f"    Size: {output_size_mb:.2f} MB")
            print(f"    Time: {process_time:.2f}s")
            
        except Exception as e:
            print(f"  Error exporting {lod_name}: {e}")

def main():
    parser = argparse.ArgumentParser(description='Create LOD levels from GLB models')
    parser.add_argument('input', help='Path or URL to GLB model')
    parser.add_argument('-o', '--output', default='lod_models', help='Output directory (default: lod_models)')
    parser.add_argument('--lod0', type=float, default=1.0, help='LOD0 ratio (default: 1.0)')
    parser.add_argument('--lod1', type=float, default=0.5, help='LOD1 ratio (default: 0.5)')
    parser.add_argument('--lod2', type=float, default=0.25, help='LOD2 ratio (default: 0.25)')
    parser.add_argument('--lod3', type=float, default=0.1, help='LOD3 ratio (default: 0.1)')
    parser.add_argument('--lod4', type=float, default=0.05, help='LOD4 ratio (default: 0.05)')
    parser.add_argument('--no-lod4', action='store_true', help='Skip LOD4 generation')
    parser.add_argument('--max-memory', type=int, default=2048, help='Max memory in MB (default: 2048)')
    
    args = parser.parse_args()
    
    lod_config = {
        "lod0": args.lod0,
        "lod1": args.lod1,
        "lod2": args.lod2,
        "lod3": args.lod3,
    }
    
    if not args.no_lod4:
        lod_config["lod4"] = args.lod4
    
    lod_config = {k: v for k, v in lod_config.items() if v > 0}
    
    try:
        create_lod_levels(args.input, args.output, lod_config, args.max_memory)
        print("\n✅ LOD models created successfully!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) == 1:
        print("Usage examples:")
        print("  python3 create_lod_advanced.py model.glb")
        print("  python3 create_lod_advanced.py https://example.com/model.glb")
        print("  python3 create_lod_advanced.py model.glb -o output_dir --lod1 0.6 --lod2 0.3")
        print("\nFor more options: python3 create_lod_advanced.py -h")
    else:
        main()