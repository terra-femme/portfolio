import React from 'react';
import ReactDOM from 'react-dom/client';
import DashboardPage from './DashboardPage';
import Dashboard from './Dashboard';
import BankingDashboard from './BankingDashboard';
import '../index.css';
import './dashboard.css';

/**
 * Second Vite entry point, with two modes.
 *
 * Default: the dashboard framed inside the portfolio's chrome, so it reads as a
 * piece of the site rather than a different site.
 *
 * `?full=1`: the dashboard alone, filling the viewport. A six-page BI report is
 * genuinely better with the whole screen, and the framed view links here so the
 * frame never becomes a constraint. The root gets `data-full` so the stylesheet
 * can paint the page dark instead of the portfolio's white.
 *
 * index.css loads first and dashboard.css second, which matters: the dashboard
 * tokens are scoped under `.dash` precisely so they cannot leak out and repaint
 * the light page around the frame.
 */
const params = new URLSearchParams(window.location.search);
const full = params.has('full');
const report = params.get('report');
if (full) document.documentElement.setAttribute('data-full', '');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {full ? (report === 'coverage' ? <BankingDashboard /> : <Dashboard />) : <DashboardPage />}
  </React.StrictMode>
);
