import React from 'react';
import ReactDOM from 'react-dom/client';
import AzurePage from './AzurePage';
import '../index.css';
import '../casestudies.css';

// Fourth Vite entry point (azure.html). Same stylesheet order as the Projects
// page: home tokens first, then the shared case-study layout.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><AzurePage /></React.StrictMode>
);
