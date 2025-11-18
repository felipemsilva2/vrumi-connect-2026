import React from 'react';
import { createRoot } from 'react-dom/client';
import TrafficSignsLibrary from './src/pages/TrafficSignsLibrary.tsx';

// Simple test to verify the component can be imported and rendered
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<TrafficSignsLibrary />);
}