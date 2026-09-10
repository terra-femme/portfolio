import React from 'react';
import ReactDOM from 'react-dom/client';
import Dashboard from './Dashboard';
import './dashboard.css';

// Second Vite entry point. The dashboard is a separate document from the
// portfolio, not a route inside it, so it gets its own root, its own stylesheet
// and its own bundle -- visitors who never open it never download it.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Dashboard /></React.StrictMode>
);
