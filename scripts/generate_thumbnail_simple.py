#!/usr/bin/env python3
"""
Simple thumbnail generator for GLB files using trimesh
"""

import trimesh
import numpy as np
from PIL import Image
import os
import sys
import argparse

def generate_thumbnail(glb_path, output_path, size=(512, 512)):
    """
    Generate a thumbnail image from a GLB file
    """
    print(f"Loading model from {glb_path}...")
    
    try:
        # Load the GLB file
        mesh = trimesh.load(glb_path, force='mesh')
        
        if mesh.is_empty:
            print("Warning: Mesh is empty")
            return create_placeholder(output_path, size)
        
        # Apply a nice rotation for viewing
        rotation = trimesh.transformations.rotation_matrix(
            angle=np.radians(-30),
            direction=[1, 0, 0],
            point=[0, 0, 0]
        )
        mesh.apply_transform(rotation)
        
        rotation = trimesh.transformations.rotation_matrix(
            angle=np.radians(45),
            direction=[0, 1, 0],
            point=[0, 0, 0]
        )
        mesh.apply_transform(rotation)
        
        # Create a scene
        scene = trimesh.Scene(mesh)
        
        try:
            # Try to export as image
            png = scene.save_image(resolution=size, visible=False)
            
            # Save the image
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'wb') as f:
                f.write(png)
            
            print(f"Thumbnail saved to {output_path}")
            return True
            
        except Exception as e:
            print(f"Could not render with built-in renderer: {e}")
            return create_placeholder(output_path, size)
            
    except Exception as e:
        print(f"Error loading GLB: {e}")
        return create_placeholder(output_path, size)

def create_placeholder(output_path, size=(512, 512)):
    """
    Create a placeholder thumbnail image
    """
    print("Creating placeholder thumbnail...")
    
    # Create a gradient background
    image = Image.new('RGB', size, (240, 240, 245))
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(image)
    
    # Draw a simple 3D cube wireframe
    center_x, center_y = size[0] // 2, size[1] // 2
    box_size = min(size) // 3
    
    # Front face
    front_points = [
        (center_x - box_size//2, center_y - box_size//2),
        (center_x + box_size//2, center_y - box_size//2),
        (center_x + box_size//2, center_y + box_size//2),
        (center_x - box_size//2, center_y + box_size//2),
    ]
    
    # Back face (offset)
    offset = box_size // 4
    back_points = [
        (p[0] + offset, p[1] - offset) for p in front_points
    ]
    
    # Draw back face
    for i in range(4):
        draw.line([back_points[i], back_points[(i+1)%4]], fill=(180, 180, 200), width=2)
    
    # Draw connecting lines
    for i in range(4):
        draw.line([front_points[i], back_points[i]], fill=(180, 180, 200), width=2)
    
    # Draw front face
    for i in range(4):
        draw.line([front_points[i], front_points[(i+1)%4]], fill=(100, 100, 150), width=3)
    
    # Add "3D Model" text
    text = "3D Model"
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
        except:
            font = ImageFont.load_default()
    
    # Calculate text position
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_x = (size[0] - text_width) // 2
    text_y = center_y + box_size // 2 + 30
    
    # Draw text with shadow
    draw.text((text_x + 2, text_y + 2), text, fill=(200, 200, 200), font=font)
    draw.text((text_x, text_y), text, fill=(80, 80, 120), font=font)
    
    # Save image
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    image.save(output_path, 'PNG')
    print(f"Placeholder saved to {output_path}")
    return True

def process_all_models(models_dir, thumbnails_dir):
    """
    Process all GLB files in the models directory
    """
    # Find all LOD0 GLB files
    glb_files = []
    for root, dirs, files in os.walk(models_dir):
        for file in files:
            if file.endswith('_lod0.glb'):
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
                       help='Thumbnail size (default: 512 512)')
    
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