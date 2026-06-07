import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 chime
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.35);
  } catch (err) {
    console.error('AudioContext sound chimes failed:', err);
  }
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server:', newSocket.id);

      // Join general role room, user ID room, and room:userId room
      newSocket.emit('join_room', user.role);
      newSocket.emit('join_room', user._id);
      newSocket.emit('join_room', `room:${user._id}`);
    });

    const handleIncomingNotification = (eventType, data) => {
      const id = Date.now() + Math.random();
      const newNotification = {
        id,
        type: data.type || 'INFO',
        eventType,
        title: data.title || 'Notification',
        message: data.message || '',
        relatedEntityId: data.relatedEntityId || '',
        createdAt: new Date()
      };

      setNotifications((prev) => [newNotification, ...prev]);

      // Play audio cue
      playNotificationSound();

      // Show OS push notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/favicon.ico'
        });
      }

      // Dispatch global window event to trigger reload in bell and dashboards
      window.dispatchEvent(new CustomEvent('new_in_app_notification', { detail: newNotification }));

      // Automatically clear toast after 6 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 6000);
    };

    // Bind listeners for standard events
    const socketEvents = [
      'food_listed',
      'claim_requested',
      'claim_approved',
      'claim_rejected',
      'pickup_scheduled',
      'food_collected',
      'donation_completed'
    ];

    socketEvents.forEach(event => {
      newSocket.on(event, (data) => {
        handleIncomingNotification(event, data);
      });
    });

    // Also support generic fallback listener
    newSocket.on('notification', (data) => {
      handleIncomingNotification(data.eventType || 'INFO', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const value = {
    socket,
    notifications,
    removeNotification
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
