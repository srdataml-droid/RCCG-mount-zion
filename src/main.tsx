import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './analytics.ts';

// /admin is intentionally not in the public nav — it's reached only by
// typing the URL directly. Simple pathname check, not a routing library,
// since the rest of the site is a single anchor-scroll page.
const isAdmin = window.location.pathname.startsWith('/admin');

// Loaded on demand so visitors to the public site never download the admin
// panel. Nearly every visitor is a churchgoer, not an administrator.
const AdminApp = lazy(() => import('./admin/AdminApp.tsx'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? (
      <Suspense fallback={<p className="p-6 text-sm text-stone-600">Loading admin…</p>}>
        <AdminApp />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
