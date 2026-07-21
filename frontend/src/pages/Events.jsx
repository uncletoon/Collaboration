import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarDays, 
  MapPin, 
  Users, 
  Plus, 
  Trash2, 
  Lock, 
  Globe,
  Clock
} from 'lucide-react';

const Events = () => {
  const { user } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); // Detailed attendee view
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Forms
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLoc, setNewLoc] = useState('');
  const [newCapacity, setNewCapacity] = useState('50');
  const [isInstOnly, setIsInstOnly] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getEvents();
      setEvents(res.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDate || !newLoc) return;

    try {
      await api.createEvent({
        title: newTitle,
        description: newDesc,
        eventDate: newDate,
        location: newLoc,
        capacity: parseInt(newCapacity),
        isInstitutional: isInstOnly
      });
      setNewTitle('');
      setNewDesc('');
      setNewDate('');
      setNewLoc('');
      setNewCapacity('50');
      setIsInstOnly(false);
      setShowCreateModal(false);
      loadEvents();
    } catch (err) {
      alert(err.message || 'Failed to create event.');
    }
  };

  const handleToggleRegister = async (eventId) => {
    try {
      const res = await api.toggleEventRegistration(eventId);
      
      // Update local state listing
      setEvents(prev => prev.map(e => 
        e.id === eventId 
          ? { 
              ...e, 
              is_registered: res.isRegistered, 
              registered_count: res.isRegistered ? e.registered_count + 1 : e.registered_count - 1 
            } 
          : e
      ));

      if (selectedEvent && selectedEvent.event.id === eventId) {
        loadEventDetails(eventId);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const loadEventDetails = async (eventId) => {
    try {
      const res = await api.getEventDetails(eventId);
      setSelectedEvent(res);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to cancel this event? This will delete all registrations.')) return;
    try {
      await api.deleteEvent(eventId);
      setSelectedEvent(null);
      loadEvents();
    } catch (err) {
      alert(err.message);
    }
  };

  // Check roles (only lecturers, researchers, admins can schedule events)
  const canSchedule = user.role !== 'student';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-slatebg-900 border border-slatebg-800 p-6 rounded-2xl">
        <div>
          <h3 className="text-base font-bold text-white">Academic Seminars & Events</h3>
          <p className="text-xs text-slatebg-400 mt-0.5">Register for webinars, defense presentations, and collaborative workshops</p>
        </div>
        {canSchedule && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Schedule Event</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center p-12 text-slatebg-400 text-xs">Loading upcoming academic events...</div>
      ) : events.length === 0 ? (
        <div className="bg-slatebg-900 border border-slatebg-850 rounded-xl p-12 text-center text-slatebg-500 text-xs">
          No academic events are currently scheduled.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Events Listings Grid (2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            {events.map((e) => {
              const eventDateObj = new Date(e.event_date);
              const isFull = e.registered_count >= e.capacity;
              const isRestricted = e.institution_id && e.institution_id !== user.institution_id;

              return (
                <div
                  key={e.id}
                  onClick={() => loadEventDetails(e.id)}
                  className={`bg-slatebg-900 border p-5 rounded-xl transition-all cursor-pointer flex flex-col md:flex-row justify-between gap-4 ${
                    selectedEvent && selectedEvent.event.id === e.id
                      ? 'border-brand-500 shadow shadow-brand-950/20'
                      : 'border-slatebg-800 hover:border-slatebg-700'
                  }`}
                >
                  <div className="space-y-2 flex-grow">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white leading-snug">{e.title}</h4>
                      {e.institution_id && (
                        <span className="px-2 py-0.5 text-[8px] font-bold bg-amber-950/40 text-amber-400 border border-amber-900/30 rounded flex items-center gap-0.5">
                          <Lock className="h-2.5 w-2.5" /> Restricted
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slatebg-400 line-clamp-2 leading-relaxed">{e.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slatebg-500 font-medium">
                      <span className="flex items-center gap-1.5 truncate">
                        <Clock className="h-3.5 w-3.5 text-slatebg-550 shrink-0" />
                        {eventDateObj.toLocaleDateString()} {eventDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3.5 w-3.5 text-slatebg-550 shrink-0" />
                        {e.location}
                      </span>
                    </div>
                  </div>

                  {/* Register Callout button */}
                  <div className="flex flex-row md:flex-col justify-between items-center shrink-0 border-t md:border-t-0 md:border-l border-slatebg-850 pt-3 md:pt-0 md:pl-5 gap-3">
                    <div className="text-center md:w-28">
                      <span className="text-[10px] text-slatebg-500 font-medium block">Occupancy</span>
                      <span className="text-sm font-bold text-white block mt-0.5">
                        {e.registered_count} / {e.capacity}
                      </span>
                    </div>

                    {isRestricted ? (
                      <span className="text-[10px] text-red-400 font-medium text-center leading-tight">
                        Institutional limit
                      </span>
                    ) : (
                      <button
                        onClick={(evt) => { evt.stopPropagation(); handleToggleRegister(e.id); }}
                        disabled={isFull && !e.is_registered}
                        className={`w-full py-1.5 px-3 text-[10px] font-bold rounded-lg uppercase tracking-wider text-center transition-colors ${
                          e.is_registered
                            ? 'bg-slatebg-800 text-slatebg-300 hover:bg-red-950/20 hover:text-red-400'
                            : isFull
                            ? 'bg-slatebg-850 text-slatebg-600 cursor-not-allowed'
                            : 'bg-brand-600 hover:bg-brand-500 text-white'
                        }`}
                      >
                        {e.is_registered ? 'Leave' : isFull ? 'Full Booked' : 'Register'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Details Sidebar panel (Attendees list) */}
          <div className="bg-slatebg-900 border border-slatebg-800 rounded-xl p-5 space-y-5">
            {selectedEvent ? (
              <>
                <div className="flex justify-between items-start gap-3 border-b border-slatebg-800 pb-3.5">
                  <div>
                    <span className="text-[10px] text-brand-400 font-bold block">Organizer</span>
                    <span className="text-xs font-semibold text-white block mt-0.5">{selectedEvent.event.organizer_name}</span>
                    <span className="text-[9px] text-slatebg-500 font-medium block">{selectedEvent.event.institution_name || 'All Institutions'}</span>
                  </div>

                  {/* Cancel Event button for owner / admin */}
                  {(selectedEvent.event.organizer_id === user.id || user.role === 'admin') && (
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent.event.id)}
                      className="p-1.5 text-slatebg-500 hover:text-red-400 rounded-lg hover:bg-slatebg-850 transition-colors"
                      title="Cancel Event"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slatebg-400 uppercase tracking-wider">Registered Attendees ({selectedEvent.attendees.length})</h4>
                  {selectedEvent.attendees.length === 0 ? (
                    <p className="text-xs text-slatebg-500 italic">No attendees signed up yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto">
                      {selectedEvent.attendees.map((att) => (
                        <div key={att.id} className="flex items-center gap-3">
                          <img
                            src={att.avatar_url ? `http://localhost:5000${att.avatar_url}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                            alt={att.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <span className="text-xs font-semibold text-white block">{att.full_name}</span>
                            <span className="text-[9px] text-slatebg-500 capitalize block">({att.role})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center p-8 text-xs text-slatebg-500">
                Select an event from the stream list to inspect details and attendee rosters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Schedule Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slatebg-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-slatebg-900 border border-slatebg-800 shadow-2xl rounded-2xl p-6 space-y-4 animate-slide-up">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Schedule Academic Event</h3>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase">Event Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Thesis Defense: Neural Fields"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm placeholder-slatebg-650 focus:outline-none focus:border-brand-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase">Description</label>
                <textarea
                  placeholder="Outline the schedule, presentation abstract, or topics..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm placeholder-slatebg-650 focus:outline-none focus:border-brand-500 text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slatebg-950 border border-slatebg-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase">Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-slatebg-950 border border-slatebg-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase">Location / Link *</label>
                <input
                  type="text"
                  placeholder="e.g., Auditorium B / Zoom Link"
                  value={newLoc}
                  onChange={(e) => setNewLoc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm placeholder-slatebg-650 focus:outline-none focus:border-brand-500 text-white"
                  required
                />
              </div>

              {user.institution_id && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="event_inst_rest"
                    checked={isInstOnly}
                    onChange={(e) => setIsInstOnly(e.target.checked)}
                    className="rounded bg-slatebg-950 border-slatebg-800 text-brand-600 focus:ring-brand-550"
                  />
                  <label htmlFor="event_inst_rest" className="text-xs text-slatebg-300 select-none">
                    Restrict registrations to: <span className="font-semibold">{user.institution_name}</span>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slatebg-800 hover:bg-slatebg-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
// 
