import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

export function Header() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };
  
  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-icon">🎭</span>
          <span className="logo-text">IIIF 3D</span>
        </Link>
        
        <nav className="nav-menu">
          <Link to="/" className={`nav-link ${isActive('/')}`}>
            Home
          </Link>
          <Link to="/viewer" className={`nav-link ${isActive('/viewer')}`}>
            3D Viewer
          </Link>
          <Link to="/list" className={`nav-link ${isActive('/list')}`}>
            Collection
          </Link>
          <Link to="/map" className={`nav-link ${isActive('/map')}`}>
            Map
          </Link>
        </nav>
        
        <div className="header-actions">
          <a 
            href="/data/manifests/collection.json" 
            target="_blank" 
            rel="noopener noreferrer"
            className="api-link"
            title="IIIF Collection API"
          >
            API
          </a>
          <a 
            href="https://github.com/IIIF/3d" 
            target="_blank" 
            rel="noopener noreferrer"
            className="github-link"
            title="GitHub"
          >
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-section">
          <h4>IIIF 3D Demo</h4>
          <p>Progressive loading and geographic mapping for 3D models using IIIF standards.</p>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <div className="footer-links">
            <Link to="/viewer">3D Viewer</Link>
            <Link to="/list">Collection</Link>
            <Link to="/map">Map View</Link>
            <a href="/data/manifests/collection.json" target="_blank">API</a>
          </div>
        </div>
        
        <div className="footer-section">
          <h4>Resources</h4>
          <div className="footer-links">
            <a href="https://iiif.io" target="_blank" rel="noopener noreferrer">
              IIIF Website
            </a>
            <a href="https://iiif.io/api/presentation/3.0/" target="_blank" rel="noopener noreferrer">
              IIIF Presentation API
            </a>
            <a href="https://iiif.io/api/extension/navplace/" target="_blank" rel="noopener noreferrer">
              navPlace Extension
            </a>
            <a href="https://github.com/IIIF/3d" target="_blank" rel="noopener noreferrer">
              IIIF 3D TSG
            </a>
          </div>
        </div>
        
        <div className="footer-section">
          <h4>Technology</h4>
          <div className="tech-badges">
            <span className="tech-badge">React</span>
            <span className="tech-badge">Three.js</span>
            <span className="tech-badge">IIIF 3.0</span>
            <span className="tech-badge">MapLibre</span>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© 2025 IIIF 3D Demo | Built with IIIF Presentation API 3.0 & navPlace Extension</p>
      </div>
    </footer>
  );
}

export function Layout({ children, showFooter = true }) {
  return (
    <div className={`app-layout ${!showFooter ? 'no-footer' : ''}`}>
      <Header />
      <main className="app-main">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}