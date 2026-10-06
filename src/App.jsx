import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import DashboardView from './views/DashboardView';
import AdminView from './views/AdminView';
import Modals from './components/Modals';
import SupportChatWidget from './components/SupportChatWidget';
import './App.css';

function MainApp() {
  const { currentView } = useApp();

  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main-content">
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'admin' && <AdminView />}
      </main>
      <Modals />
      {currentView === 'dashboard' && <BottomNav />}
      {currentView === 'dashboard' && <SupportChatWidget />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
