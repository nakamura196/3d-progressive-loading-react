#!/usr/bin/env node

/**
 * Generate thumbnails for GLB models using Puppeteer and Three.js
 * This script runs Three.js in a headless browser to render thumbnails
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// HTML template for rendering
const generateHTML = (modelPath, modelName) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; overflow: hidden; background: #f0f0f5; }
        canvas { display: block; }
    </style>
</head>
<body>
    <script type="module">
        import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
        import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f5);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-5, 5, -5);
        scene.add(directionalLight2);
        
        // Camera
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        
        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer.setSize(512, 512);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);
        
        // Load model
        const loader = new GLTFLoader();
        loader.load(
            '${modelPath}',
            (gltf) => {
                const model = gltf.scene;
                scene.add(model);
                
                // Center and scale
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                model.position.x = -center.x;
                model.position.y = -center.y;
                model.position.z = -center.z;
                
                // Position camera
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = camera.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
                cameraZ *= 1.5;
                
                camera.position.set(cameraZ * 0.7, cameraZ * 0.5, cameraZ * 0.7);
                camera.lookAt(0, 0, 0);
                
                // Render multiple frames for better quality
                for(let i = 0; i < 3; i++) {
                    renderer.render(scene, camera);
                }
                
                // Signal completion
                setTimeout(() => {
                    window.RENDER_COMPLETE = true;
                }, 500);
            },
            undefined,
            (error) => {
                console.error('Error loading model:', error);
                window.RENDER_ERROR = true;
            }
        );
    </script>
</body>
</html>
`;

async function generateThumbnail(modelPath, outputPath, modelName) {
    console.log(`Generating thumbnail for ${modelName}...`);
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--allow-file-access-from-files']
    });
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 512, height: 512 });
        
        // Create HTML content with absolute file path
        const html = generateHTML(modelPath, modelName);
        
        // Write HTML to temp file
        const tempHtml = path.join(__dirname, '..', 'temp_thumbnail.html');
        fs.writeFileSync(tempHtml, html);
        
        // Navigate to file
        await page.goto(`file://${path.resolve(tempHtml)}`, { waitUntil: 'networkidle0' });
        
        // Wait for render to complete
        await page.waitForFunction(
            () => window.RENDER_COMPLETE || window.RENDER_ERROR,
            { timeout: 30000 }
        );
        
        // Check for errors
        const hasError = await page.evaluate(() => window.RENDER_ERROR);
        if (hasError) {
            throw new Error('Failed to load model');
        }
        
        // Wait a bit more for final render
        await page.waitForTimeout(1000);
        
        // Take screenshot
        await page.screenshot({
            path: outputPath,
            type: 'png',
            omitBackground: false
        });
        
        console.log(`✓ Saved thumbnail to ${outputPath}`);
        
        // Clean up temp file
        fs.unlinkSync(tempHtml);
        
    } catch (error) {
        console.error(`✗ Error generating thumbnail for ${modelName}:`, error.message);
    } finally {
        await browser.close();
    }
}

async function main() {
    // Models to process
    const models = [
        {
            name: 'sponza_s',
            input: 'public/data/models/sponza/sponza_s_lod2.glb',
            output: 'public/thumbnails/sponza_s_thumbnail.png'
        },
        {
            name: 'scaniverse',
            input: 'public/data/models/scaniverse/scaniverse_lod2.glb',
            output: 'public/thumbnails/scaniverse_thumbnail.png'
        },
        {
            name: 'scaniverse2',
            input: 'public/data/models/scaniverse2/scaniverse2_lod2.glb',
            output: 'public/thumbnails/scaniverse2_thumbnail.png'
        }
    ];
    
    // Ensure output directory exists
    const outputDir = path.join(__dirname, '..', 'public', 'thumbnails');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Process each model
    for (const model of models) {
        const absolutePath = `file://${path.resolve(path.join(__dirname, '..', model.input))}`;
        const outputPath = path.join(__dirname, '..', model.output);
        await generateThumbnail(absolutePath, outputPath, model.name);
    }
    
    console.log('\nAll thumbnails generated!');
}

// Run
main().catch(console.error);