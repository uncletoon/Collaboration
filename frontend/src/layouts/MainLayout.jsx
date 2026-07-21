import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useNotifications } from '../context/NotificationContext';
import { X, BellRing } from 'lucide-react';

const MainLayout = ({ children, currentTab, setCurrentTab, onSearch, searchValue }) => {
  const { toast, clearToast } = useNotifications();

  return (
    <div className="min-h-screen bg-slatebg-950 flex">
      {/* Navigation Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col pl-64">
        {/* Top Header Navbar */}
        <Navbar 
          currentTab={currentTab} 
          onSearch={onSearch} 
          searchValue={searchValue} 
        />

        {/* Dynamic Page Views */}
        <main className="flex-grow pt-20 px-8 pb-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Real-time Toast Notifications Popup Banner */}
      {toast && (
        <div className="fixed top-6 right-6 w-96 bg-slatebg-900 border border-brand-500/30 shadow-2xl shadow-brand-950/40 rounded-xl p-4 z-50 animate-slide-up flex gap-3.5 backdrop-blur-md">
          <div className="p-2.5 bg-brand-950/40 rounded-lg border border-brand-850 shrink-0 text-brand-400 self-start">
            <BellRing className="h-5 w-5 animate-bounce" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h5 className="text-sm font-semibold text-white truncate">{toast.title}</h5>
            <p className="text-xs text-slatebg-400 mt-1 leading-normal break-words">{toast.content}</p>
          </div>
          <button
            onClick={clearToast}
            className="p-1 rounded hover:bg-slatebg-850 text-slatebg-500 hover:text-slatebg-300 self-start transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
