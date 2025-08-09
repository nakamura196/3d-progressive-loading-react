import React from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Box, Sphere, Torus, Environment } from '@react-three/drei';
import './Home.css';

function Hero3D() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <group>
          <Box args={[1, 1, 1]} position={[-2, 0, 0]}>
            <meshStandardMaterial color="#6366f1" />
          </Box>
          <Sphere args={[0.7]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#8b5cf6" />
          </Sphere>
          <Torus args={[0.8, 0.3, 16, 100]} position={[2, 0, 0]}>
            <meshStandardMaterial color="#764ba2" />
          </Torus>
        </group>
      </Float>
      <Environment preset="city" />
    </>
  );
}

export function Home() {
  const features = [
    {
      icon: '🔄',
      title: 'Progressive Loading',
      description: 'Smart LOD system that loads models progressively from low to high resolution'
    },
    {
      icon: '🗺️',
      title: 'Geographic Mapping',
      description: 'Explore 3D models on an interactive map using IIIF navPlace extension'
    },
    {
      icon: '📚',
      title: 'IIIF Standards',
      description: 'Built on IIIF Presentation API 3.0 with experimental 3D extensions'
    },
    {
      icon: '⚡',
      title: 'High Performance',
      description: 'Optimized rendering with React Three Fiber and automatic quality adjustment'
    }
  ];

  const stats = [
    { value: '5', label: 'LOD Levels' },
    { value: '95%', label: 'Size Reduction' },
    { value: '60fps', label: 'Performance' },
    { value: '3', label: 'Models Ready' }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-3d">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <Hero3D />
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
          </Canvas>
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="gradient-text">IIIF 3D Collection</span>
          </h1>
          <p className="hero-subtitle">
            Experience 3D models with progressive loading, geographic mapping, and IIIF standards
          </p>
          
          <div className="hero-actions">
            <Link to="/viewer" className="btn-hero primary">
              <span>🎮</span>
              Launch 3D Viewer
            </Link>
            <Link to="/list" className="btn-hero secondary">
              <span>📋</span>
              Browse Collection
            </Link>
            <Link to="/map" className="btn-hero tertiary">
              <span>🗺️</span>
              Explore Map
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Powerful Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Models Preview Section */}
      <section className="models-section">
        <div className="container">
          <h2 className="section-title">Available Models</h2>
          <div className="models-preview">
            <div className="model-preview-card">
              <div className="model-preview-image sponza"></div>
              <h3>Sponza Atrium</h3>
              <p>Classic architectural model with 5 LOD levels</p>
              <Link to="/viewer?manifest=/data/manifests/sponza_iiif.json" className="btn-preview">
                View Model
              </Link>
            </div>
            
            <div className="model-preview-card">
              <div className="model-preview-image scan1"></div>
              <h3>Scaniverse Scan 1</h3>
              <p>3D scan created with Scaniverse app</p>
              <Link to="/viewer?manifest=/data/manifests/scaniverse_iiif.json" className="btn-preview">
                View Model
              </Link>
            </div>
            
            <div className="model-preview-card">
              <div className="model-preview-image scan2"></div>
              <h3>Scaniverse Scan 2</h3>
              <p>Second 3D scan with geographic location</p>
              <Link to="/viewer?manifest=/data/manifests/scaniverse2_iiif.json" className="btn-preview">
                View Model
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="tech-section">
        <div className="container">
          <h2 className="section-title">Built With Modern Technology</h2>
          <div className="tech-stack">
            <div className="tech-item">React</div>
            <div className="tech-item">Three.js</div>
            <div className="tech-item">IIIF 3.0</div>
            <div className="tech-item">MapLibre GL</div>
            <div className="tech-item">WebGL</div>
            <div className="tech-item">Python</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <p>© 2025 IIIF 3D Demo | Built with IIIF Presentation API 3.0</p>
          <div className="footer-links">
            <a href="https://iiif.io" target="_blank" rel="noopener noreferrer">IIIF</a>
            <a href="https://github.com/IIIF/3d" target="_blank" rel="noopener noreferrer">IIIF 3D TSG</a>
            <a href="/data/manifests/collection.json" target="_blank">Collection API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}