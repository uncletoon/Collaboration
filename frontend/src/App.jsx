import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import MainLayout from './layouts/MainLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Communities from './pages/Communities';
import Projects from './pages/Projects';
import Events from './pages/Events';
import Research from './pages/Research';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Search from './pages/Search';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [searchValue, setSearchValue] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const handleSearch = (value) => {
    setSearchValue(value);
    if (value.trim() !== '') {
      setCurrentTab('search');
    } else if (currentTab === 'search') {
      setCurrentTab('dashboard');
    }
  };

  // Switch tabs cleanly resetting searches
  const handleTabChange = (tabId) => {
    setSearchValue('');
    setCurrentTab(tabId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slatebg-950 flex flex-col justify-center items-center gap-2">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slatebg-400 font-semibold tracking-wider uppercase">Loading Portal...</span>
      </div>
    );
  }

  // Not Logged In
  if (!user) {
    return showRegister ? (
      <Register onSwitchLogin={() => setShowRegister(false)} />
    ) : (
      <Login onSwitchRegister={() => setShowRegister(true)} />
    );
  }

  // Logged In Views
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setCurrentTab={handleTabChange} />;
      case 'communities':
        return <Communities />;
      case 'projects':
        return <Projects />;
      case 'events':
        return <Events />;
      case 'research':
        return <Research />;
      case 'chat':
        return <Chat />;
      case 'profile':
        return <Profile />;
      case 'admin':
        return user.role === 'admin' ? <Admin /> : <Dashboard setCurrentTab={handleTabChange} />;
      case 'search':
        return <Search queryStr={searchValue} setCurrentTab={handleTabChange} />;
      default:
        return <Dashboard setCurrentTab={handleTabChange} />;
    }
  };

  return (
    <MainLayout
      currentTab={currentTab}
      setCurrentTab={handleTabChange}
      onSearch={handleSearch}
      searchValue={searchValue}
    >
      {renderTabContent()}
    </MainLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
