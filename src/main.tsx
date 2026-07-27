import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AdminApp from './admin/AdminApp.tsx';
import './index.css';
import './analytics.ts';

// /admin is intentionally not in the public nav — it's reached only by
// typing the URL directly. Simple pathname check, not a routing library,
// since the rest of the site is a single anchor-scroll page.
const isAdmin = window.location.pathname.startsWith('/admin');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? <AdminApp /> : <App />}
  </StrictMode>,
);
