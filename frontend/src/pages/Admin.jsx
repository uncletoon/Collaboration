import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { 
  ShieldAlert, 
  Users, 
  Trash2, 
  Lock, 
  Unlock, 
  UserCog, 
  BarChart3,
  Calendar,
  AlertCircle
} from 'lucide-react';

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, commsRes, eventsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getCommunities(),
        api.getEvents()
      ]);
      setStats(statsRes);
      setUsersList(usersRes.users || []);
      setCommunities(commsRes.communities || []);
      setEvents(eventsRes.events || []);
    } catch (err) {
      console.error('Failed to load administrative records:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.toggleUserStatus(userId);
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: res.status } : u));
      // Refresh stats in background
      const statsRes = await api.getAdminStats();
      setStats(statsRes);
    } catch (err) {
      alert(err.message || 'Moderation failed.');
    }
  };

  const handleRoleChange = async (userId, nextRole) => {
    try {
      await api.changeUserRole(userId, nextRole);
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: nextRole } : u));
      const statsRes = await api.getAdminStats();
      setStats(statsRes);
    } catch (err) {
      alert(err.message || 'Failed to modify role.');
    }
  };

  const handleDeleteCommunity = async (commId) => {
    if (!window.confirm('Moderator Action: Are you sure you want to permanently delete this community?')) return;
    try {
      await api.adminDeleteCommunity(commId);
      setCommunities(prev => prev.filter(c => c.id !== commId));
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Moderator Action: Are you sure you want to permanently cancel this event?')) return;
    try {
      await api.adminDeleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-slatebg-900 border border-slatebg-800 p-6 rounded-2xl flex items-center gap-4">
        <div className="p-3 bg-red-950/40 border border-red-900/30 rounded-xl text-red-400">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">System Moderation & Audit</h3>
          <p className="text-xs text-slatebg-400 mt-0.5">Manage academic roles, user statuses, and moderate community forums or events</p>
        </div>
      </div>

      {loading && !stats ? (
        <div className="text-center p-12 text-slatebg-400 text-xs">Querying system indexes...</div>
      ) : (
        <>
          {/* Admin Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slatebg-900 border border-slatebg-800 rounded-xl p-5">
                <span className="text-[10px] text-slatebg-400 font-semibold uppercase block">System Users</span>
                <span className="text-xl font-bold text-white block mt-1">{stats.users.total_users} Users</span>
                <span className="text-[9.5px] text-slatebg-550 block mt-1.5">
                  ({stats.users.students} Students • {stats.users.lecturers} Lecturers • {stats.users.researchers} Researchers)
                </span>
              </div>

              <div className="bg-slatebg-900 border border-slatebg-800 rounded-xl p-5">
                <span className="text-[10px] text-slatebg-400 font-semibold uppercase block">Forums & Groups</span>
                <span className="text-xl font-bold text-white block mt-1">{stats.entities.total_communities} Communities</span>
                <span className="text-[9.5px] text-slatebg-550 block mt-1.5">Active academic discussion boards</span>
              </div>

              <div className="bg-slatebg-900 border border-slatebg-800 rounded-xl p-5">
                <span className="text-[10px] text-slatebg-400 font-semibold uppercase block">Collaborative Teams</span>
                <span className="text-xl font-bold text-white block mt-1">{stats.entities.total_projects} Projects</span>
                <span className="text-[9.5px] text-slatebg-550 block mt-1.5">Active workspaces with document sharing</span>
              </div>

              <div className="bg-slatebg-900 border border-slatebg-800 rounded-xl p-5">
                <span className="text-[10px] text-slatebg-400 font-semibold uppercase block">Events Scheduled</span>
                <span className="text-xl font-bold text-white block mt-1">{stats.entities.total_events} Seminars</span>
                <span className="text-[9.5px] text-slatebg-550 block mt-1.5">With institutional limit validations</span>
              </div>
            </div>
          )}

          {/* User management directory (Roster table) */}
          <div className="bg-slatebg-900 border border-slatebg-800 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slatebg-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slatebg-850">
              <Users className="h-4.5 w-4.5 text-brand-400" /> User Administration Directory
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slatebg-800 text-slatebg-500 font-semibold">
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Institution / Dept</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u.id} className="border-b border-slatebg-850/65 hover:bg-slatebg-850/20 text-slatebg-300">
                      <td className="py-3.5 px-3 font-semibold text-white">{u.full_name}</td>
                      <td className="py-3.5 px-3">{u.email}</td>
                      <td className="py-3.5 px-3 truncate max-w-[200px]">
                        {u.institution_name || 'All'} / {u.department_name || 'All'}
                      </td>
                      <td className="py-3.5 px-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-slatebg-950 border border-slatebg-800 rounded px-2 py-1 text-[11px] focus:outline-none"
                        >
                          <option value="student">Student</option>
                          <option value="lecturer">Lecturer</option>
                          <option value="researcher">Researcher</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition-colors ${
                            u.status === 'suspended'
                              ? 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900'
                              : 'bg-red-950/40 text-red-400 hover:bg-red-900/30'
                          }`}
                        >
                          {u.status === 'suspended' ? (
                            <>
                              <Unlock className="h-3 w-3" /> Activate
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3" /> Suspend
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Communities & Events Moderation row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Communities moderation */}
            <div className="bg-slatebg-900 border border-slatebg-800 p-5 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slatebg-400 uppercase tracking-wider pb-2 border-b border-slatebg-850">
                Moderate Forums
              </h4>
              <div className="space-y-3.5 max-h-72 overflow-y-auto">
                {communities.map((c) => (
                  <div key={c.id} className="p-3 bg-slatebg-950/40 border border-slatebg-850 rounded-xl flex items-center justify-between gap-4">
                    <div className="overflow-hidden">
                      <span className="text-xs font-bold text-white block truncate">{c.name}</span>
                      <span className="text-[10px] text-slatebg-550 block">Category: {c.category}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCommunity(c.id)}
                      className="p-1.5 text-slatebg-500 hover:text-red-400 rounded-lg hover:bg-slatebg-850 transition-colors"
                      title="Delete Forum"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Events moderation */}
            <div className="bg-slatebg-900 border border-slatebg-800 p-5 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slatebg-400 uppercase tracking-wider pb-2 border-b border-slatebg-850">
                Moderate Scheduled Events
              </h4>
              <div className="space-y-3.5 max-h-72 overflow-y-auto">
                {events.map((e) => (
                  <div key={e.id} className="p-3 bg-slatebg-950/40 border border-slatebg-850 rounded-xl flex items-center justify-between gap-4">
                    <div className="overflow-hidden">
                      <span className="text-xs font-bold text-white block truncate">{e.title}</span>
                      <span className="text-[10px] text-slatebg-550 block">Location: {e.location} • Date: {new Date(e.event_date).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(e.id)}
                      className="p-1.5 text-slatebg-500 hover:text-red-400 rounded-lg hover:bg-slatebg-850 transition-colors"
                      title="Cancel Event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Admin;
// 
