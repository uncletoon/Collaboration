import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import api from '../services/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null); // Active banner toast: { id, title, content }

  // Fetch notifications from database
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Listen to live socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      console.log('Real-time notification received:', notif);
      setNotifications((prev) => [notif, ...prev]);
      
      // Trigger toast alert banner
      setToast({
        id: notif.id,
        title: notif.title,
        content: notif.content,
        link: notif.link,
      });

      // Automatically hide banner after 6 seconds
      setTimeout(() => {
        setToast((currentToast) => {
          if (currentToast && currentToast.id === notif.id) {
            return null;
          }
          return currentToast;
        });
      }, 6000);
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket]);

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const clearToast = () => setToast(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toast,
        markAsRead,
        markAllAsRead,
        clearToast,
        refreshNotifications: loadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
