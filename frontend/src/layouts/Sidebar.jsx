import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Users, 
  FolderGit2, 
  CalendarDays, 
  BookOpen, 
  MessageSquareCode, 
  ShieldAlert, 
  UserCircle2, 
  LogOut,
  GraduationCap
} from 'lucide-react';

const Sidebar = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'communities', name: 'Communities', icon: Users },
    { id: 'projects', name: 'Projects', icon: FolderGit2 },
    { id: 'events', name: 'Events', icon: CalendarDays },
    { id: 'research', name: 'Research Repository', icon: BookOpen },
    { id: 'chat', name: 'Real-Time Chat', icon: MessageSquareCode },
    { id: 'profile', name: 'My Profile', icon: UserCircle2 },
  ];

  // Insert Admin Panel if user is admin
  if (user.role === 'admin') {
    menuItems.push({ id: 'admin', name: 'Admin Control', icon: ShieldAlert });
  }

  return (
    <aside className="w-64 bg-slatebg-900 border-r border-slatebg-800 flex flex-col justify-between h-screen fixed left-0 top-0 z-30">
      <div className="flex flex-col">
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slatebg-800 text-brand-400">
          <GraduationCap className="h-8 w-8 stroke-[1.5]" />
          <div>
            <h1 className="font-bold text-sm leading-tight text-white">Academic Link</h1>
            <span className="text-[10px] text-slatebg-400 font-medium tracking-wide uppercase">Collaboration Portal</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/25' 
                    : 'text-slatebg-400 hover:bg-slatebg-800/60 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slatebg-500 group-hover:text-brand-400'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Section at bottom */}
      <div className="p-4 border-t border-slatebg-800">
        <div className="flex items-center gap-3 px-2 py-2 mb-3 bg-slatebg-950/40 rounded-lg border border-slatebg-850">
          <img
            src={user.avatar_url ? `http://localhost:5000${user.avatar_url}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
            alt={user.full_name}
            className="w-10 h-10 rounded-full border border-slatebg-700 object-cover"
          />
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate">{user.full_name}</h4>
            <span className="text-[11px] text-brand-400 capitalize block font-medium">{user.role}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 rounded-lg transition-colors duration-200"
        >
          <LogOut className="h-5 w-5 text-red-500" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
