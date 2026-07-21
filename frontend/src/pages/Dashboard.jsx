import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  FolderGit2, 
  Calendar, 
  BookOpen, 
  PlusCircle, 
  ExternalLink,
  GraduationCap
} from 'lucide-react';

const Dashboard = ({ setCurrentTab }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ communities: 0, projects: 0, events: 0, papers: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch projects, events, communities, papers
        const [projRes, eventRes, commRes, paperRes] = await Promise.all([
          api.getProjects(),
          api.getEvents(),
          api.getCommunities(),
          api.getResearch()
        ]);

        const joinedComms = commRes.communities?.filter(c => c.is_member).length || 0;

        setStats({
          communities: joinedComms,
          projects: projRes.projects?.length || 0,
          events: eventRes.events?.length || 0,
          papers: paperRes.papers?.length || 0
        });

        setRecentProjects(projRes.projects?.slice(0, 3) || []);
        setUpcomingEvents(eventRes.events?.slice(0, 3) || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const cardItems = [
    { title: 'Joined Communities', count: stats.communities, icon: Users, tab: 'communities', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30' },
    { title: 'My Active Projects', count: stats.projects, icon: FolderGit2, tab: 'projects', color: 'text-indigo-400 bg-indigo-950/40 border-indigo-900/30' },
    { title: 'Available Events', count: stats.events, icon: Calendar, tab: 'events', color: 'text-amber-400 bg-amber-950/40 border-amber-900/30' },
    { title: 'Published Papers', count: stats.papers, icon: BookOpen, tab: 'research', color: 'text-sky-400 bg-sky-950/40 border-sky-900/30' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-slatebg-900 border border-slatebg-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-brand-900/5 rounded-full blur-[40px] pointer-events-none"></div>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Welcome back, <span className="text-brand-400 font-extrabold">{user.full_name}</span>
          </h1>
          <p className="text-xs text-slatebg-400 mt-1">
            {user.institution_name ? `${user.institution_name} • ` : ''} 
            {user.department_name ? `${user.department_name} • ` : ''} 
            <span className="capitalize">{user.role}</span>
          </p>
        </div>

        {/* Global CTA button */}
        <div className="flex gap-2.5">
          <button
            onClick={() => setCurrentTab('chat')}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Open Chat board</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardItems.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              onClick={() => setCurrentTab(c.tab)}
              className="bg-slatebg-900 border border-slatebg-800 rounded-xl p-5 hover:border-slatebg-700 cursor-pointer transition-all hover:translate-y-[-2px] flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-xs text-slatebg-400 font-medium block">{c.title}</span>
                <span className="text-2xl font-bold text-white block">
                  {loading ? '...' : c.count}
                </span>
              </div>
              <div className={`p-3 rounded-lg border ${c.color}`}>
                <Icon className="h-6 w-6 stroke-[1.5]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Layout columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Collaborative Projects List (Left Column) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Active Collaborations</h3>
            <button onClick={() => setCurrentTab('projects')} className="text-xs font-medium text-brand-400 hover:underline flex items-center gap-1">
              <span>View all</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="p-8 text-center text-slatebg-500 text-xs">Loading projects...</div>
            ) : recentProjects.length === 0 ? (
              <div className="bg-slatebg-900/40 border border-slatebg-850 rounded-xl p-8 text-center text-slatebg-500 text-xs">
                You aren't in any collaboration projects yet. Create one on the Projects tab.
              </div>
            ) : (
              recentProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setCurrentTab('projects')}
                  className="bg-slatebg-900 border border-slatebg-800 rounded-xl p-5 hover:border-slatebg-700 transition-colors cursor-pointer flex flex-col sm:flex-row justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">{p.title}</h4>
                    <p className="text-xs text-slatebg-400 line-clamp-2 max-w-lg">{p.description}</p>
                    <div className="flex items-center gap-3 pt-2 text-[10px] text-slatebg-500 font-medium">
                      <span>Owner: {p.creator_name}</span>
                      <span>•</span>
                      <span>Members: {p.member_count}</span>
                    </div>
                  </div>
                  <div className="sm:self-center shrink-0">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      p.status === 'active' ? 'bg-brand-950/50 text-brand-400 border border-brand-850' : 
                      p.status === 'completed' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900' : 
                      'bg-slatebg-850 text-slatebg-400'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Academic Events (Right Column) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Upcoming Events</h3>
            <button onClick={() => setCurrentTab('events')} className="text-xs font-medium text-brand-400 hover:underline flex items-center gap-1">
              <span>View all</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="p-8 text-center text-slatebg-500 text-xs">Loading events...</div>
            ) : upcomingEvents.length === 0 ? (
              <div className="bg-slatebg-900/40 border border-slatebg-850 rounded-xl p-8 text-center text-slatebg-500 text-xs">
                No scheduled academic events at this time.
              </div>
            ) : (
              upcomingEvents.map((e) => (
                <div
                  key={e.id}
                  onClick={() => setCurrentTab('events')}
                  className="bg-slatebg-900 border border-slatebg-800 rounded-xl p-4 hover:border-slatebg-700 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-white truncate max-w-[180px]">{e.title}</h4>
                    <span className="text-[10px] text-brand-400 font-semibold shrink-0">
                      {new Date(e.event_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-slatebg-400 line-clamp-2 leading-relaxed">{e.description}</p>
                  <div className="text-[10px] text-slatebg-500 flex justify-between pt-1">
                    <span>📍 {e.location}</span>
                    <span>Seats: {e.registered_count} / {e.capacity}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
