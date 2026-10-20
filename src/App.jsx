import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import DashboardView from './views/DashboardView';
import StorefrontView from './views/StorefrontView';
import AdminView from './views/AdminView';
import Modals from './components/Modals';
import SupportChatWidget from './components/SupportChatWidget';
import './App.css';

function MainApp() {
  const { currentView, isLoggedIn } = useApp();

  // If user is logged in, only dashboard will show (unless explicitly navigating to /admin)
  const effectiveView = currentView === 'admin' ? 'admin' : (isLoggedIn ? 'dashboard' : currentView);

  if (effectiveView === 'admin') {
    return (
      <div className="admin-root-shell">
        <AdminView />
        <Modals />
      </div>
    );
  }

  return (
    <div className={`app-shell ${effectiveView === 'storefront' ? 'storefront-shell' : ''}`}>
      {effectiveView !== 'storefront' && <Navbar />}
      <main className="app-main-content">
        {effectiveView === 'storefront' && <StorefrontView />}
        {effectiveView === 'dashboard' && <DashboardView />}
      </main>
      <Modals />
      {effectiveView === 'dashboard' && <BottomNav />}
      <SupportChatWidget />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error Caught by Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isAdminRoute = typeof window !== 'undefined' && 
        window.location.pathname === '/admin' &&
        localStorage.getItem('websynx_admin_auth') === 'true';

      if (isAdminRoute) {
        return (
          <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: '#0f172a',
            color: '#f8fafc',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            <div style={{
              background: '#1e293b',
              padding: '32px',
              borderRadius: '16px',
              maxWidth: '520px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}>
              <h2 style={{ margin: '0 0 12px 0', color: '#38bdf8' }}>Ecomxstocks Operations Console</h2>
              <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '14px' }}>
                Console session refreshed. Click below to reload console state.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    this.setState({ hasError: false });
                    window.location.reload();
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Refresh Console
                </button>
                <button
                  onClick={() => {
                    this.setState({ hasError: false });
                    window.location.href = '/';
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: '#334155',
                    color: '#cbd5e1',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        );
      }

      // Normal member app recovery (NO admin controls or mentions shown)
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f8fafc',
          color: '#1e293b',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '36px 28px',
            borderRadius: '20px',
            maxWidth: '460px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '24px'
            }}>
              ⚡
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
              Welcome back to Ecomxstocks
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
              Your session was refreshed to keep your balance and campaign progress completely synchronized.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/';
                }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
                }}
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                style={{
                  padding: '12px 18px',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </ErrorBoundary>
  );
}
