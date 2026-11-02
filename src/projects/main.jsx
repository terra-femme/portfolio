import React from 'react';
import ReactDOM from 'react-dom/client';
import ProjectsPage from './ProjectsPage';
import '../index.css';
import '../casestudies.css';

// Third Vite entry point (projects.html). Loads the home page's stylesheet
// first so the page shares its tokens, nav, and card styles, then adds the
// case-study layout on top.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><ProjectsPage /></React.StrictMode>
);
