import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import InvoiceViewPage from './pages/InvoiceViewPage.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

// Simple path-based routing without react-router
const path = window.location.pathname;
const invoiceViewMatch = path.match(/^\/invoice\/([a-f0-9]{24})$/);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {invoiceViewMatch ? (
      <InvoiceViewPage invoiceId={invoiceViewMatch[1]} />
    ) : (
      <AuthProvider>
        <App />
      </AuthProvider>
    )}
  </React.StrictMode>
);
