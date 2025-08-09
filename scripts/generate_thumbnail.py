#!/usr/bin/env python3
"""
Generate thumbnail images from GLB files using trimesh and PIL
"""

import trimesh
import numpy as np
from PIL import Image
import os
import sys
import argparse

def generate_thumbnail(glb_path, output_path, size=(512, 512), bg_color=(240, 240, 240)):
    """
    Generate a thumbnail image from a GLB file
    
    Args:
        glb_path: Path to the GLB file
        output_path: Path to save the thumbnail image
        size: Tuple of (width, height) for the thumbnail
        bg_color: Background color as RGB tuple
    """
    print(f"Loading model from {glb_path}...")
    
    # Load the GLB file
    scene = trimesh.load(glb_path, force='scene')
    
    # Get the mesh from the scene
    if hasattr(scene, 'geometry'):
        # Combine all geometries
        meshes = list(scene.geometry.values())
        if meshes:
            mesh = trimesh.util.concatenate(meshes)
        else:
            print("No geometry found in the scene")
            return False
    else:
        mesh = scene
    
    # Create a scene for rendering
    scene_for_render = trimesh.Scene(mesh)
    
    # Set up camera to view the entire mesh
    # Get the bounding box of the mesh
    bounds = mesh.bounds
    center = mesh.centroid
    extents = mesh.extents
    
    # Calculate camera distance based on model size
    max_extent = max(extents)
    camera_distance = max_extent * 2.5
    
    # Set camera position (looking at the model from a 45-degree angle)
    camera_position = center + np.array([camera_distance * 0.7, camera_distance * 0.5, camera_distance * 0.7])
    
    # Create camera with proper field of view
    camera = trimesh.scene.Camera(
        resolution=size,
        fov=(60, 60)
    )
    
    # Add camera to scene
    scene_for_render.camera = camera
    
    # Set camera view
    scene_for_render.set_camera(
        angles=[np.radians(30), np.radians(45), 0],
        distance=camera_distance,
        center=center
    )
    
    # Add lighting
    # Create directional lights for better visualization
    light_directions = [
        [1, 1, 1],
        [-1, 1, 0.5],
        [0, -0.5, 1]
    ]
    
    lights = []
    for direction in light_directions:
        light = trimesh.scene.lighting.DirectionalLight(
            color=[255, 255, 255],
            direction=direction
        )
        lights.append(light)
    
    scene_for_render.lights = lights
    
    try:
        # Render the scene to an image
        print(f"Rendering thumbnail...")
        
        # Use the built-in renderer
        # Note: This requires pyglet or other rendering backend
        try:
            # Try to render with the scene's built-in method
            image_data = scene_for_render.save_image(resolution=size, visible=False)
            
            # Convert bytes to PIL Image
            from io import BytesIO
            image = Image.open(BytesIO(image_data))
            
        except Exception as e:
            print(f"Failed to render with built-in renderer: {e}")
            print("Trying alternative method...")
            
            # Alternative: Use trimesh's simple rendering
            from trimesh.viewer import windowed
            
            # Get a simple rendered view
            # This creates a basic orthographic projection
            rotation_matrix = trimesh.transformations.rotation_matrix(
                np.radians(30), [1, 0, 0]
            ) @ trimesh.transformations.rotation_matrix(
                np.radians(45), [0, 1, 0]
            )
            
            mesh.apply_transform(rotation_matrix)
            
            # Project to 2D
            vertices_2d = mesh.vertices[:, [0, 2]]  # Use X and Z coordinates
            
            # Normalize to image coordinates
            min_vals = vertices_2d.min(axis=0)
            max_vals = vertices_2d.max(axis=0)
            vertices_2d = (vertices_2d - min_vals) / (max_vals - min_vals)
            
            # Scale to image size with padding
            padding = 50
            vertices_2d = vertices_2d * (np.array(size) - 2 * padding) + padding
            
            # Create image
            image = Image.new('RGB', size, bg_color)
            
            # Draw the mesh edges as a wireframe
            from PIL import ImageDraw
            draw = ImageDraw.Draw(image)
            
            if hasattr(mesh, 'faces'):
                for face in mesh.faces[:1000]:  # Limit faces for performance
                    points = vertices_2d[face]
                    for i in range(len(face)):
                        p1 = tuple(points[i].astype(int))
                        p2 = tuple(points[(i + 1) % len(face)].astype(int))
                        draw.line([p1, p2], fill=(100, 100, 100), width=1)
            
            print("Created wireframe thumbnail as fallback")
        
        # Save the thumbnail
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        image.save(output_path, 'PNG')
        print(f"Thumbnail saved to {output_path}")
        
        return True
        
    except Exception as e:
        print(f"Error generating thumbnail: {e}")
        
        # Create a placeholder image as last resort
        print("Creating placeholder thumbnail...")
        image = Image.new('RGB', size, bg_color)
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(image)
        
        # Draw a simple 3D box icon
        box_size = min(size) // 3
        center_x, center_y = size[0] // 2, size[1] // 2
        
        # Draw a simple cube representation
        points = [
            (center_x - box_size//2, center_y - box_size//2),
            (center_x + box_size//2, center_y - box_size//2),
            (center_x + box_size//2, center_y + box_size//2),
            (center_x - box_size//2, center_y + box_size//2),
        ]
        
        # Draw the box
        for i in range(4):
            draw.line([points[i], points[(i+1)%4]], fill=(150, 150, 150), width=3)
        
        # Add "3D" text
        text = "3D"
        try:
            # Try to use a better font if available
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
        except:
            font = ImageFont.load_default()
        
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        text_x = (size[0] - text_width) // 2
        text_y = center_y - text_height // 2
        draw.text((text_x, text_y), text, fill=(100, 100, 100), font=font)
        
        # Save placeholder
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        image.save(output_path, 'PNG')
        print(f"Placeholder thumbnail saved to {output_path}")
        
        return True

def process_all_models(models_dir, thumbnails_dir):
    """
    Process all GLB files in the models directory and generate thumbnails
    """
    # Find all GLB files
    glb_files = []
    for root, dirs, files in os.walk(models_dir):
        for file in files:
            if file.endswith('.glb') and 'lod0' in file:  # Use LOD0 for thumbnails
                glb_files.append(os.path.join(root, file))
    
    if not glb_files:
        print(f"No LOD0 GLB files found in {models_dir}")
        return
    
    print(f"Found {len(glb_files)} models to process")
    
    for glb_path in glb_files:
        # Generate output filename
        base_name = os.path.basename(glb_path).replace('_lod0.glb', '')
        thumbnail_name = f"{base_name}_thumbnail.png"
        thumbnail_path = os.path.join(thumbnails_dir, thumbnail_name)
        
        print(f"\nProcessing {base_name}...")
        generate_thumbnail(glb_path, thumbnail_path)

def main():
    parser = argparse.ArgumentParser(description='Generate thumbnails from GLB files')
    parser.add_argument('input', help='Input GLB file or directory')
    parser.add_argument('-o', '--output', help='Output thumbnail path or directory', 
                       default='public/thumbnails')
    parser.add_argument('-s', '--size', type=int, nargs=2, default=[512, 512],
                       help='Thumbnail size as width height (default: 512 512)')
    
    args = parser.parse_args()
    
    input_path = args.input
    output_path = args.output
    size = tuple(args.size)
    
    if os.path.isfile(input_path):
        # Process single file
        if os.path.isdir(output_path):
            base_name = os.path.basename(input_path).replace('.glb', '')
            output_file = os.path.join(output_path, f"{base_name}_thumbnail.png")
        else:
            output_file = output_path
        
        generate_thumbnail(input_path, output_file, size)
    
    elif os.path.isdir(input_path):
        # Process directory
        process_all_models(input_path, output_path)
    
    else:
        print(f"Error: {input_path} is not a valid file or directory")
        sys.exit(1)

if __name__ == "__main__":
    main()