import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, 
  FolderGit2, 
  Calendar, 
  BookOpen, 
  UserCircle, 
  MessageSquare,
  Download,
  ExternalLink,
  Inbox
} from 'lucide-react';

const Search = ({ queryStr, setCurrentTab }) => {
  const [results, setResults] = useState({ users: [], communities: [], projects: [], research: [], events: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!queryStr || queryStr.trim() === '') return;

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(queryStr);
        setResults(data);
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce to limit key triggers

    return () => clearTimeout(delayDebounceFn);
  }, [queryStr]);

  if (!queryStr || queryStr.trim() === '') {
    return (
      <div className="h-[40vh] flex flex-col justify-center items-center text-slatebg-550 gap-2">
        <Inbox className="h-10 w-10 stroke-[1.2]" />
        <span className="text-xs">Type search terms inside the header navbar input box...</span>
      </div>
    );
  }

  const hasResults = 
    results.users.length > 0 ||
    results.communities.length > 0 ||
    results.projects.length > 0 ||
    results.research.length > 0 ||
    results.events.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-slatebg-900 border border-slatebg-800 p-5 rounded-2xl">
        <h3 className="text-sm font-bold text-white">Global Search</h3>
        <p className="text-xs text-slatebg-400 mt-0.5">Showing matching results for keyword: <span className="text-brand-400 font-bold font-mono">"{queryStr}"</span></p>
      </div>

      {loading ? (
        <div className="text-center p-12 text-slatebg-400 text-xs">Querying database...</div>
      ) : !hasResults ? (
        <div className="bg-slatebg-900 border border-slatebg-850 rounded-xl p-12 text-center text-slatebg-500 text-xs">
          No records matching your search query. Try keywords like "Physics", "Deep", "Seminar", or user names.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* 1. Matching Academics */}
          {results.users.length > 0 && (
            <div className="bg-slatebg-900 border border-slatebg-800 rounded-xl p-5 space-y-3.5">
              <h4 className="text-xs font-bold text-slatebg-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slatebg-850">
                <UserCircle className="h-4.5 w-4.5 text-brand-400" /> Matches: Academics ({results.users.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.users.map((u) => (
                  <div key={u.id} className="p-3 bg-slatebg-950/40 border border-slatebg-850 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar_url ? `http://localhost:5000${u.avatar_url}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                        alt={u.full_name}
                        className="w-9.5 h-9.5 rounded-full object-cover"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">{u.full_name}</span>
                        <span className="text-[10px] text-slatebg-500 block capitalize">
                          {u.role} • {u.institution_name || 'All Institutions'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentTab('chat')}
                      className="px-2.5 py-1.5 bg-slatebg-800 hover:bg-slatebg-700 text-brand-400 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Chat
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Communities */}
          {results.communities.length > 0 && (
            <div className="bg-slatebg-900 border border-slatebg-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slatebg-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slatebg-850">
                <Users className="h-4.5 w-4.5 text-emerald-400" /> Matches: Communities ({results.communities.length})
              </h4>
              <div className="space-y-3">
                {results.communities.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setCurrentTab('communities')}
                    className="p-3.5 bg-slatebg-950/40 border border-slatebg-850 hover:border-slatebg-800 rounded-xl cursor-pointer flex justify-between items-center gap-4 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block truncate">{c.name}</span>
                      <p className="text-[11px] text-slatebg-400 line-clamp-1 mt-0.5">{c.description}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slatebg-550 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Research Publications */}
          {results.research.length > 0 && (
            <div className="bg-slatebg-900 border border-slatebg-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slatebg-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slatebg-850">
                <BookOpen className="h-4.5 w-4.5 text-sky-400" /> Matches: Research repository ({results.research.length})
              </h4>
              <div className="space-y-3.5">
                {results.research.map((p) => (
                  <div key={p.id} className="p-4 bg-slatebg-950/40 border border-slatebg-850 rounded-xl flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-white block">{p.title}</span>
                      <span className="text-[10px] text-slatebg-400 block mt-0.5">Authors: {p.authors}</span>
                    </div>
                    <button
                      onClick={() => setCurrentTab('research')}
                      className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 self-start sm:self-center"
                    >
                      <Download className="h-3.5 w-3.5" /> Repository
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Events */}
          {results.events.length > 0 && (
            <div className="bg-slatebg-900 border border-slatebg-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slatebg-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slatebg-850">
                <Calendar className="h-4.5 w-4.5 text-amber-400" /> Matches: Academic Seminars ({results.events.length})
              </h4>
              <div className="space-y-3">
                {results.events.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => setCurrentTab('events')}
                    className="p-3.5 bg-slatebg-950/40 border border-slatebg-850 hover:border-slatebg-800 rounded-xl cursor-pointer flex justify-between items-center gap-4 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block truncate">{e.title}</span>
                      <span className="text-[10px] text-slatebg-500 block mt-0.5">Location: {e.location} • Date: {new Date(e.event_date).toLocaleDateString()}</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slatebg-550 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
// 
