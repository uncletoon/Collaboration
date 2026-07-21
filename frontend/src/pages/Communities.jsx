import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  MessageSquare, 
  ThumbsUp, 
  Trash2, 
  Plus, 
  Globe, 
  CornerDownRight, 
  ArrowLeft,
  GraduationCap
} from 'lucide-react';

const Communities = () => {
  const { user } = useAuth();
  
  // Tab states
  const [communities, setCommunities] = useState([]);
  const [selectedComm, setSelectedComm] = useState(null); // Active community details
  const [posts, setPosts] = useState([]);
  
  // Post/Comment expansions
  const [activePostComments, setActivePostComments] = useState({}); // postId -> commentArray
  const [commentInputs, setCommentInputs] = useState({}); // postId -> commentText

  // Loading/Forms
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form fields
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Research');
  const [isInstRestricted, setIsInstRestricted] = useState(false);
  
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  const loadCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCommunities();
      setCommunities(res.communities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  const loadCommunityPosts = async (commId) => {
    try {
      const res = await api.getCommunityPosts(commId);
      setPosts(res.posts || []);
    } catch (err) {
      console.error(err);
    }
  };

  const selectCommunity = async (comm) => {
    setSelectedComm(comm);
    loadCommunityPosts(comm.id);
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!newName || !newCategory) return;
    try {
      await api.createCommunity({
        name: newName,
        description: newDesc,
        category: newCategory,
        isInstitutional: isInstRestricted
      });
      setNewName('');
      setNewDesc('');
      setShowCreateModal(false);
      loadCommunities();
    } catch (err) {
      alert(err.message || 'Failed to create community');
    }
  };

  const handleToggleJoin = async (e, commId) => {
    e.stopPropagation();
    try {
      const res = await api.toggleJoinCommunity(commId);
      
      // Update local state
      setCommunities(prev => prev.map(c => 
        c.id === commId ? { ...c, is_member: res.isMember, member_count: res.isMember ? c.member_count + 1 : c.member_count - 1 } : c
      ));

      if (selectedComm && selectedComm.id === commId) {
        setSelectedComm(prev => ({ ...prev, is_member: res.isMember }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostTitle || !newPostContent) return;
    try {
      const res = await api.createPost(selectedComm.id, {
        title: newPostTitle,
        content: newPostContent
      });
      setPosts(prev => [res.post, ...prev]);
      setNewPostTitle('');
      setNewPostContent('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await api.toggleLikePost(postId);
      setPosts(prev => prev.map(p => 
        p.id === postId ? { 
          ...p, 
          is_liked: res.isLiked, 
          like_count: res.isLiked ? p.like_count + 1 : p.like_count - 1 
        } : p
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchComments = async (postId) => {
    // Toggle comments collapse
    if (activePostComments[postId]) {
      setActivePostComments(prev => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      return;
    }

    try {
      const res = await api.getPostComments(postId);
      setActivePostComments(prev => ({ ...prev, [postId]: res.comments }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    try {
      const res = await api.addComment(postId, { content: commentText });
      setActivePostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.comment]
      }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Main Directory Listing */}
      {!selectedComm ? (
        <>
          <div className="flex justify-between items-center bg-slatebg-900 border border-slatebg-800 p-6 rounded-2xl">
            <div>
              <h3 className="text-base font-bold text-white">Academic Communities</h3>
              <p className="text-xs text-slatebg-400 mt-0.5">Explore institutional and cross-institutional forums</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Create Forum</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center p-12 text-slatebg-400 text-xs">Loading academic communities...</div>
          ) : communities.length === 0 ? (
            <div className="bg-slatebg-900 border border-slatebg-850 rounded-xl p-12 text-center text-slatebg-500 text-xs">
              No academic communities found. Be the first to build a community!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {communities.map((comm) => (
                <div
                  key={comm.id}
                  onClick={() => selectCommunity(comm)}
                  className="bg-slatebg-900 border border-slatebg-800 hover:border-slatebg-700 p-5 rounded-xl transition-all cursor-pointer flex flex-col justify-between h-48 hover:translate-y-[-2px]"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-brand-950/40 text-brand-400 border border-brand-900/30">
                        {comm.category}
                      </span>
                      {comm.institution_id && (
                        <span className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                          🔒 Host Institution Restricted
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white mt-2.5 truncate">{comm.name}</h4>
                    <p className="text-xs text-slatebg-400 mt-1 line-clamp-2 leading-relaxed">{comm.description}</p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-slatebg-850">
                    <span className="text-[10px] text-slatebg-500 font-medium">
                      👥 {comm.member_count} members
                    </span>
                    <button
                      onClick={(e) => handleToggleJoin(e, comm.id)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                        comm.is_member
                          ? 'bg-slatebg-800 text-slatebg-300 hover:bg-red-950/20 hover:text-red-400'
                          : 'bg-brand-600 hover:bg-brand-500 text-white'
                      }`}
                    >
                      {comm.is_member ? 'Leave' : 'Join Forum'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* 2. Specific Community Feed View */
        <div className="space-y-6">
          {/* Header row */}
          <div className="flex items-center gap-4 bg-slatebg-900 border border-slatebg-800 p-5 rounded-2xl">
            <button
              onClick={() => { setSelectedComm(null); loadCommunities(); }}
              className="p-2 rounded-lg bg-slatebg-950 hover:bg-slatebg-800 text-slatebg-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white truncate">{selectedComm.name}</h3>
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-brand-950/40 text-brand-400">
                  {selectedComm.category}
                </span>
              </div>
              <p className="text-xs text-slatebg-400 mt-0.5 truncate">{selectedComm.description}</p>
            </div>
            
            <button
              onClick={(e) => handleToggleJoin(e, selectedComm.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
                selectedComm.is_member
                  ? 'bg-slatebg-800 text-slatebg-300 hover:bg-red-950/20 hover:text-red-400'
                  : 'bg-brand-600 hover:bg-brand-500 text-white'
              }`}
            >
              {selectedComm.is_member ? 'Leave Community' : 'Join Community'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left/Middle feed (Posts) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Write new post (only if member) */}
              {selectedComm.is_member ? (
                <form onSubmit={handleCreatePost} className="bg-slatebg-900 border border-slatebg-800 rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Write a Post</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Give your topic an descriptive title..."
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      className="w-full px-4 py-2 bg-slatebg-950 border border-slatebg-800 rounded-lg text-sm text-white placeholder-slatebg-600 focus:outline-none focus:border-brand-500"
                      required
                    />
                    <textarea
                      placeholder="Share updates, research discoveries, or start discussion..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows="3"
                      className="w-full px-4 py-2 bg-slatebg-950 border border-slatebg-800 rounded-lg text-sm text-white placeholder-slatebg-600 focus:outline-none focus:border-brand-500 resize-none"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Publish Post
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slatebg-900/30 border border-slatebg-850 p-5 rounded-xl text-center text-xs text-slatebg-400">
                  You must be a member of this community to create posts.
                </div>
              )}

              {/* Posts feed */}
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="bg-slatebg-900 border border-slatebg-850 rounded-xl p-10 text-center text-xs text-slatebg-550">
                    No posts published yet in this community feed.
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="bg-slatebg-900 border border-slatebg-800 rounded-xl p-5 space-y-4">
                      {/* Author Header */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={post.author_avatar ? `http://localhost:5000${post.author_avatar}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                            alt={post.author_name}
                            className="w-9 h-9 rounded-full border border-slatebg-700 object-cover"
                          />
                          <div>
                            <span className="text-xs font-semibold text-white block">{post.author_name}</span>
                            <span className="text-[10px] text-slatebg-550 capitalize block">
                              {post.author_role} • {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Delete option for creator or admin */}
                        {(post.user_id === user.id || user.role === 'admin') && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 text-slatebg-500 hover:text-red-400 rounded-lg hover:bg-slatebg-850 transition-colors"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-white">{post.title}</h4>
                        <p className="text-xs text-slatebg-300 leading-relaxed break-words whitespace-pre-line">{post.content}</p>
                      </div>

                      {/* Engagement Bar */}
                      <div className="flex items-center gap-5 pt-3 border-t border-slatebg-850 text-slatebg-400">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center gap-1.5 text-xs font-medium hover:text-white transition-colors ${
                            post.is_liked ? 'text-brand-400' : ''
                          }`}
                        >
                          <ThumbsUp className={`h-4.5 w-4.5 ${post.is_liked ? 'fill-brand-500/20' : ''}`} />
                          <span>{post.like_count} Likes</span>
                        </button>

                        <button
                          onClick={() => handleFetchComments(post.id)}
                          className="flex items-center gap-1.5 text-xs font-medium hover:text-white transition-colors"
                        >
                          <MessageSquare className="h-4.5 w-4.5 text-slatebg-500" />
                          <span>{post.comment_count} Comments</span>
                        </button>
                      </div>

                      {/* Expanded Comments section */}
                      {activePostComments[post.id] && (
                        <div className="pt-3 border-t border-slatebg-850/60 space-y-4">
                          <div className="space-y-3 pl-4 border-l border-slatebg-800">
                            {activePostComments[post.id].length === 0 ? (
                              <span className="text-[11px] text-slatebg-550 italic block">No comments written yet.</span>
                            ) : (
                              activePostComments[post.id].map((comm) => (
                                <div key={comm.id} className="flex gap-2.5 items-start">
                                  <CornerDownRight className="h-4 w-4 text-slatebg-600 shrink-0 mt-0.5" />
                                  <div className="flex-grow bg-slatebg-950/40 p-2.5 rounded-lg border border-slatebg-850/60">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[11px] font-bold text-white">{comm.author_name}</span>
                                      <span className="text-[9px] text-slatebg-500 capitalize">({comm.author_role})</span>
                                    </div>
                                    <p className="text-xs text-slatebg-300 break-words leading-normal">{comm.content}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Comment write field */}
                          {selectedComm.is_member && (
                            <form
                              onSubmit={(e) => handleAddComment(e, post.id)}
                              className="flex gap-2 pl-4"
                            >
                              <input
                                type="text"
                                placeholder="Write a comment..."
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                className="flex-1 px-3 py-1.5 bg-slatebg-950 border border-slatebg-800 rounded-lg text-xs text-white placeholder-slatebg-650 focus:outline-none focus:border-brand-500"
                                required
                              />
                              <button
                                type="submit"
                                className="px-3 bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-bold rounded-lg transition-colors"
                              >
                                Send
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right sidebar details (Metadata/Members list) */}
            <div className="bg-slatebg-900 border border-slatebg-800 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-semibold text-slatebg-400 uppercase tracking-wider">Forum Members</h4>
              <div className="space-y-3">
                {/* Dynamically loads members when page is retrieved */}
                {!selectedComm.is_member ? (
                  <p className="text-xs text-slatebg-500 italic">Join this community to inspect community member rosters.</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2.5">
                    {/* Placeholder loaded during detailed fetch */}
                    {/* The caller fetches this into selectedComm or local state */}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Create Community Forum Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slatebg-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-slatebg-900 border border-slatebg-800 shadow-2xl rounded-2xl p-6 space-y-4 animate-slide-up">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Community Forum</h3>
            
            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase">Forum Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Quantum Computing Group"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm placeholder-slatebg-650 focus:outline-none focus:border-brand-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase">Description</label>
                <textarea
                  placeholder="Explain the purpose of this community..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm placeholder-slatebg-650 focus:outline-none focus:border-brand-500 text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm text-white focus:outline-none"
                >
                  <option value="Research">Research Group</option>
                  <option value="Departmental">Departmental Club</option>
                  <option value="Colloquium">Seminar / Colloquium</option>
                  <option value="General">General Academic Discussion</option>
                </select>
              </div>

              {user.institution_id && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="inst_rest"
                    checked={isInstRestricted}
                    onChange={(e) => setIsInstRestricted(e.target.checked)}
                    className="rounded bg-slatebg-950 border-slatebg-800 text-brand-600 focus:ring-brand-550"
                  />
                  <label htmlFor="inst_rest" className="text-xs text-slatebg-300 select-none">
                    Restrict membership to my institution: <span className="font-semibold">{user.institution_name}</span>
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communities;
