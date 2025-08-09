#!/usr/bin/env python3

import trimesh
import numpy as np
import os
from pathlib import Path

def create_lod_levels(input_file, output_dir="lod_models"):
    os.makedirs(output_dir, exist_ok=True)
    
    mesh = trimesh.load(input_file, force='mesh')
    
    if isinstance(mesh, trimesh.Scene):
        meshes = []
        for geometry in mesh.geometry.values():
            if isinstance(geometry, trimesh.Trimesh):
                meshes.append(geometry)
        
        if meshes:
            mesh = trimesh.util.concatenate(meshes)
        else:
            print("No valid mesh geometry found in the scene")
            return
    
    original_faces = len(mesh.faces)
    print(f"Original model: {original_faces} faces, {len(mesh.vertices)} vertices")
    
    lod_ratios = {
        "lod0": 1.0,     
        "lod1": 0.5,     
        "lod2": 0.25,    
        "lod3": 0.1,     
    }
    
    for lod_name, ratio in lod_ratios.items():
        if ratio == 1.0:
            simplified = mesh
        else:
            target_faces = int(original_faces * ratio)
            simplified = mesh.simplify_quadric_decimation(face_count=target_faces)
        
        output_file = os.path.join(output_dir, f"model_{lod_name}.glb")
        simplified.export(output_file)
        
        print(f"{lod_name}: {len(simplified.faces)} faces ({ratio*100:.0f}% of original) -> {output_file}")

if __name__ == "__main__":
    input_model = "model.glb"
    create_lod_levels(input_model)
    print("\nLOD models created successfully!")