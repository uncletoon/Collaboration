import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Search, CheckCheck, Inbox } from 'lucide-react';

const Navbar = ({ currentTab, onSearch, searchValue }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'communities': return 'Academic Communities';
      case 'projects': return 'Collaborative Projects';
      case 'events': return 'Academic Events';
      case 'research': return 'Research Repository';
      case 'chat': return 'Real-Time Message Board';
      case 'profile': return 'My User Profile';
      case 'admin': return 'Administrator Control Dashboard';
      case 'search': return 'Global Search Results';
      default: return 'Portal';
    }
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    setDropdownOpen(false);
    // Navigating can happen relative to the context tab if required
    // Links are stored like /communities/2. Since we are using custom state routing,
    // the UI can detect or the user can just click it and it marks as read
  };

  return (
    <header className="h-16 bg-slatebg-900 border-b border-slatebg-800 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-20">
      {/* Title / Action */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-white">{getPageTitle()}</h2>
      </div>

      {/* Right Navbar utilities */}
      <div className="flex items-center gap-6">
        {/* Global Search Bar */}
        <div className="relative w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slatebg-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search communities, papers, events..."
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slatebg-950 border border-slatebg-800 rounded-lg text-sm text-slatebg-100 placeholder-slatebg-550 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Notifications Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-2 rounded-full text-slatebg-400 hover:text-white hover:bg-slatebg-800 transition-colors relative"
          >
            <Bell className="h-5.5 w-5.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-600 text-[10px] font-bold text-white flex items-center justify-center rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-slatebg-900 border border-slatebg-800 rounded-xl shadow-xl z-50 overflow-hidden animate-slide-up">
              <div className="px-4 py-3 bg-slatebg-950 border-b border-slatebg-850 flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Notifications ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Notification List scroll container */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slatebg-500 flex flex-col items-center gap-2">
                    <Inbox className="h-8 w-8 stroke-[1.2]" />
                    <span className="text-xs">No notifications yet</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-4 py-3 border-b border-slatebg-850/60 cursor-pointer transition-colors hover:bg-slatebg-850 flex flex-col gap-0.5 ${
                        !notif.is_read ? 'bg-brand-950/10 border-l-2 border-brand-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white truncate">{notif.title}</span>
                        <span className="text-[9px] text-slatebg-500 shrink-0">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slatebg-400 line-clamp-2">{notif.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
// 
