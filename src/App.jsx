import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Viewer } from './pages/Viewer';
import { ModelsList } from './pages/ModelsList';
import { MapView } from './pages/MapView';
import { GenerateThumbnails } from './pages/GenerateThumbnails';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Layout showFooter={false}>
            <Home />
          </Layout>
        } />
        <Route path="/viewer" element={
          <Layout showFooter={false}>
            <Viewer />
          </Layout>
        } />
        <Route path="/list" element={
          <Layout>
            <ModelsList />
          </Layout>
        } />
        <Route path="/map" element={
          <Layout>
            <MapView />
          </Layout>
        } />
        <Route path="/generate-thumbnails" element={
          <Layout>
            <GenerateThumbnails />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;