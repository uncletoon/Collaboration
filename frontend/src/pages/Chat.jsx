import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  MessageSquarePlus, 
  Users, 
  Send, 
  CornerDownRight, 
  Search,
  Inbox,
  UserCheck,
  MessageCircle
} from 'lucide-react';

const Chat = () => {
  const { user } = useAuth();
  const socket = useSocket();

  // Chat lists
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  // Modals state
  const [showDMModal, setShowDMModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [systemUsers, setSystemUsers] = useState([]);

  // Group creation selections
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Layout refs
  const messagesEndRef = useRef(null);

  // Fetch chat rooms list
  const loadRooms = async () => {
    try {
      const res = await api.getChatRooms();
      setRooms(res.rooms || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  // Fetch messages when room is selected
  useEffect(() => {
    if (!selectedRoom) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const res = await api.getRoomMessages(selectedRoom.id);
        setMessages(res.messages || []);
      } catch (err) {
        alert(err.message);
      }
    };
    loadMessages();

    // Register joining the room on socket server
    if (socket) {
      socket.emit('join_chat_room', selectedRoom.id);
    }

    return () => {
      if (socket && selectedRoom) {
        socket.emit('leave_chat_room', selectedRoom.id);
      }
    };
  }, [selectedRoom, socket]);

  // Listen to live socket messages
  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (chatMsg) => {
      console.log('Incoming live message:', chatMsg);
      // Append if it belongs to selected room
      if (selectedRoom && chatMsg.room_id === selectedRoom.id) {
        setMessages((prev) => [...prev, chatMsg]);
      }
      
      // Refresh the rooms preview list to update previews
      loadRooms();
    };

    socket.on('chat_message', handleIncomingMessage);

    return () => {
      socket.off('chat_message', handleIncomingMessage);
    };
  }, [socket, selectedRoom]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage || !inputMessage.trim() || !selectedRoom) return;

    try {
      await api.sendMessage(selectedRoom.id, inputMessage.trim());
      setInputMessage('');
    } catch (err) {
      alert(err.message);
    }
  };

  // Initiate direct message room
  const startDMRoom = async (targetUserId) => {
    try {
      const res = await api.createDMRoom(targetUserId);
      setShowDMModal(false);
      // Reload rooms list and auto-select
      await loadRooms();
      
      // Find room in the newly fetched list
      const tempRoomsRes = await api.getChatRooms();
      const matched = tempRoomsRes.rooms?.find(r => r.id === res.roomId);
      if (matched) {
        setSelectedRoom(matched);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const openNewDMSelector = async () => {
    setShowDMModal(true);
    try {
      const res = await api.getUsers();
      setSystemUsers(res.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openGroupSelector = async () => {
    setShowGroupModal(true);
    try {
      const res = await api.getUsers();
      setSystemUsers(res.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName || selectedUserIds.length === 0) return;

    try {
      const res = await api.createGroupRoom({
        name: groupName,
        memberIds: selectedUserIds
      });
      setGroupName('');
      setSelectedUserIds([]);
      setShowGroupModal(false);
      
      // Reload rooms list and select
      await loadRooms();
      const tempRoomsRes = await api.getChatRooms();
      const matched = tempRoomsRes.rooms?.find(r => r.id === res.roomId);
      if (matched) {
        setSelectedRoom(matched);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleGroupCheckbox = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const getRoomName = (room) => {
    if (room.is_group) return room.name;
    // Direct message: return name of the other user
    const other = room.other_members?.[0];
    return other ? other.full_name : 'Direct Message';
  };

  const getRoomRole = (room) => {
    if (room.is_group) return 'Academic Group';
    const other = room.other_members?.[0];
    return other ? other.role : '';
  };

  const getRoomAvatar = (room) => {
    const other = room.other_members?.[0];
    if (!room.is_group && other?.avatar_url) {
      return `http://localhost:5000${other.avatar_url}`;
    }
    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80';
  };

  return (
    <div className="h-[calc(100vh-140px)] bg-slatebg-900 border border-slatebg-800 rounded-2xl overflow-hidden flex animate-fade-in">
      {/* 1. Left Room sidebar */}
      <div className="w-80 border-r border-slatebg-800 flex flex-col justify-between shrink-0 bg-slatebg-900/60">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Controls */}
          <div className="p-4 border-b border-slatebg-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Conversations</span>
            <div className="flex gap-1.5">
              <button
                onClick={openNewDMSelector}
                className="p-1.5 bg-slatebg-950 border border-slatebg-800 hover:bg-slatebg-800 text-brand-400 rounded-lg transition-colors"
                title="Start DM Chat"
              >
                <MessageSquarePlus className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={openGroupSelector}
                className="p-1.5 bg-slatebg-950 border border-slatebg-800 hover:bg-slatebg-800 text-brand-400 rounded-lg transition-colors"
                title="Create Group Chat"
              >
                <Users className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Rooms scrollbar lists */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {rooms.length === 0 ? (
              <div className="p-6 text-center text-slatebg-550 text-xs flex flex-col items-center gap-1.5 mt-8">
                <Inbox className="h-7 w-7 stroke-[1.2]" />
                <span>No active chat rooms.</span>
              </div>
            ) : (
              rooms.map((room) => {
                const isActive = selectedRoom && selectedRoom.id === room.id;
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 border ${
                      isActive 
                        ? 'bg-brand-950/20 border-brand-500/35 shadow shadow-brand-900/10' 
                        : 'border-transparent hover:bg-slatebg-850/65'
                    }`}
                  >
                    <img
                      src={getRoomAvatar(room)}
                      alt="avatar"
                      className="w-10 h-10 rounded-full border border-slatebg-700 object-cover"
                    />
                    <div className="overflow-hidden flex-1">
                      <div className="flex justify-between items-center gap-1">
                        <span className="text-xs font-bold text-white truncate">{getRoomName(room)}</span>
                      </div>
                      <span className="text-[10px] text-brand-400 capitalize font-medium block mt-0.5">{getRoomRole(room)}</span>
                      
                      {room.latest_message?.message && (
                        <p className="text-[11px] text-slatebg-400 truncate mt-1 leading-normal">
                          {room.latest_message.sender_id === user.id ? 'You: ' : ''}
                          {room.latest_message.message}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 2. Right messages workspace */}
      <div className="flex-1 flex flex-col justify-between bg-slatebg-950/20 relative">
        {selectedRoom ? (
          <>
            {/* Header banner */}
            <div className="h-16 px-6 bg-slatebg-950/50 border-b border-slatebg-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={getRoomAvatar(selectedRoom)}
                  alt="avatar"
                  className="w-9 h-9 rounded-full border border-slatebg-700 object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">{getRoomName(selectedRoom)}</h4>
                  <span className="text-[10px] text-brand-400 capitalize block font-medium">{getRoomRole(selectedRoom)}</span>
                </div>
              </div>
            </div>

            {/* Messages viewport */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slatebg-550 text-xs gap-1.5">
                  <MessageCircle className="h-8 w-8 stroke-[1.2]" />
                  <span>No message history. Send a greeting to start chatting!</span>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[70%] items-start ${
                        isOwn ? 'ml-auto flex-row-reverse' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <img
                        src={msg.sender_avatar ? `http://localhost:5000${msg.sender_avatar}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                        alt={msg.sender_name}
                        className="w-7.5 h-7.5 rounded-full border border-slatebg-700 object-cover shrink-0"
                      />

                      {/* Bubble */}
                      <div className="space-y-0.5">
                        <div className={`flex items-center gap-1.5 text-[9px] text-slatebg-500 font-medium ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <span>{msg.sender_name}</span>
                          <span>•</span>
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed break-words whitespace-pre-line ${
                          isOwn 
                            ? 'bg-brand-600 text-white rounded-tr-none' 
                            : 'bg-slatebg-900 text-slatebg-100 rounded-tl-none border border-slatebg-850'
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input field */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-slatebg-950/50 border-t border-slatebg-800 flex gap-3"
            >
              <input
                type="text"
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-xs text-white placeholder-slatebg-650 focus:outline-none focus:border-brand-500"
                required
              />
              <button
                type="submit"
                className="px-4.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-colors flex items-center justify-center shrink-0 shadow"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slatebg-550 text-xs gap-1.5">
            <MessageSquarePlus className="h-10 w-10 stroke-[1.2]" />
            <span>Select a conversation or create a chat room from the sidebar.</span>
          </div>
        )}
      </div>

      {/* 3. New DM Selection Modal */}
      {showDMModal && (
        <div className="fixed inset-0 bg-slatebg-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-slatebg-900 border border-slatebg-800 shadow-2xl rounded-2xl p-6 space-y-4 animate-slide-up">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Start DM Conversation</h3>
            
            <div className="max-h-72 overflow-y-auto space-y-2">
              {systemUsers.length === 0 ? (
                <p className="text-xs text-slatebg-500 italic text-center p-4">No other system users found.</p>
              ) : (
                systemUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => startDMRoom(u.id)}
                    className="p-2.5 rounded-xl border border-slatebg-850 hover:bg-slatebg-850 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar_url ? `http://localhost:5000${u.avatar_url}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                        alt={u.full_name}
                        className="w-8.5 h-8.5 rounded-full object-cover"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">{u.full_name}</span>
                        <span className="text-[9px] text-slatebg-500 capitalize block">({u.role} - {u.institution_name || 'Generic'})</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDMModal(false)}
                className="px-4 py-2 bg-slatebg-800 hover:bg-slatebg-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Group Chat Creator Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-slatebg-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-slatebg-900 border border-slatebg-800 shadow-2xl rounded-2xl p-6 space-y-4 animate-slide-up">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Initialize Chat Group</h3>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase">Group Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Deep Learning Study Group"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-2 bg-slatebg-950 border border-slatebg-800 rounded-xl text-xs placeholder-slatebg-650 focus:outline-none focus:border-brand-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase">Select Members *</label>
                <div className="max-h-56 overflow-y-auto space-y-2 border border-slatebg-850 p-2.5 rounded-xl bg-slatebg-950">
                  {systemUsers.map((u) => {
                    const isChecked = selectedUserIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleGroupCheckbox(u.id)}
                        className="flex items-center gap-3 p-1.5 rounded hover:bg-slatebg-850 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // toggled by container div click
                          className="rounded bg-slatebg-950 border-slatebg-800 text-brand-600 focus:ring-brand-550"
                        />
                        <div className="flex items-center gap-2">
                          <img
                            src={u.avatar_url ? `http://localhost:5000${u.avatar_url}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                            alt={u.full_name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <span className="text-[11px] font-bold text-white block">{u.full_name}</span>
                            <span className="text-[9px] text-slatebg-550 block">({u.role})</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 bg-slatebg-800 hover:bg-slatebg-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!groupName || selectedUserIds.length === 0}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
// 
