import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { AppNotification } from '@/shared/components/NotificationCenter';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // ✅ onAuthStateChange suffit — il fire au mount avec la session courante (INITIAL_SESSION)
    // getSession() retiré car il causait NavigatorLockAcquireTimeoutError
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listen to Supabase notifications for the logged in user
  useEffect(() => {
    // Fetch initial global notifications (visible to everyone)
    const fetchGlobalNotifications = async () => {
      const { data } = await supabase
        .from('global_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        setNotifications(prev => {
          const globalOnes: AppNotification[] = data.map(n => ({
            id: `global-${n.id}`,
            title: n.title,
            message: n.message,
            type: n.type as any,
            read: localStorage.getItem(`read-global-${n.id}`) === 'true',
            timestamp: new Date(n.created_at)
          }));
          
          // Combine and remove duplicates based on ID
          const combined = [...prev, ...globalOnes];
          const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
          return unique.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        });
      }
    };

    fetchGlobalNotifications();

    // Subscribe to global notifications
    const globalChannel = supabase
      .channel('global-notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'global_notifications'
      }, (payload) => {
        const n = payload.new;
        const newGlobal: AppNotification = {
          id: `global-${n.id}`,
          title: n.title,
          message: n.message,
          type: n.type as any,
          read: false,
          timestamp: new Date(n.created_at)
        };
        
        setNotifications(prev => [newGlobal, ...prev]);

        // Show native notification
        if ('Notification' in window && window.Notification.permission === 'granted') {
          new window.Notification(n.title, {
            body: n.message,
            icon: '/favicon.ico'
          });
        }
      })
      .subscribe();

    if (!userId) {
      // If no user, we only have global notifications (already fetched/subscribed above)
      return () => {
        supabase.removeChannel(globalChannel);
      };
    }

    // Fetch initial private notifications
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (data) {
        setNotifications(prev => {
          const privateOnes: AppNotification[] = data.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type as any,
            read: n.status === 'read',
            timestamp: new Date(n.created_at)
          }));
          const combined = [...prev, ...privateOnes];
          const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
          return unique.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        });
      }
    };

    fetchNotifications();

    // Subscribe to private notifications
    const privateChannel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const n = payload.new;
          setNotifications(prev => [{
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type as any,
            read: n.status === 'read',
            timestamp: new Date(n.created_at)
          }, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const n = payload.new;
          setNotifications(prev => prev.map(item => 
            item.id === n.id ? { ...item, read: n.status === 'read' } : item
          ));
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
      supabase.removeChannel(privateChannel);
    };
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = async (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    // ✅ Toujours mettre à jour le state local immédiatement
    // (avant : state ignoré si userId présent → cloche toujours vide)
    const newNotification: AppNotification = {
      ...n,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);

    // Persister en DB en arrière-plan si connecté (non bloquant)
    if (userId) {
      supabase.from('notifications').insert([{
        user_id: userId,
        title: n.title,
        message: n.message,
        type: n.type,
        status: 'unread',
      }]).then(({ error }) => {
        if (error) console.warn('Notification non persistée en DB :', error.message);
      });
    }

    // Notification native navigateur
    if ('Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(n.title, {
        body: n.message,
        icon: '/favicon.ico',
      });
    }
  };

  const markAsRead = async (id: string) => {
    if (id.startsWith('global-')) {
      localStorage.setItem(`read-${id}`, 'true');
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      return;
    }

    if (userId) {
      try {
        await supabase
          .from('notifications')
          .update({ status: 'read' })
          .eq('id', id);
      } catch (error) {
        // (log désactivé en prod)
      }
    } else {
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    }
  };

  const clearAll = async () => {
    if (userId && notifications.length > 0) {
      try {
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', userId);
      } catch (error) {
        // (log désactivé en prod)
      }
    } else {
      setNotifications([]);
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      // (log désactivé en prod)
      return false;
    }
    
    const permission = await window.Notification.requestPermission();
    if (permission === 'granted' && userId) {
      // For real push, you'd integrate with a service like Web Push or OneSignal
      // For now we just track that we have permission
    }
    return permission === 'granted';
  };

  // Initial setup if user is already logged in and permission is granted
  useEffect(() => {
    if (userId && Notification.permission === 'granted') {
      requestPermission();
    }
  }, [userId]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      addNotification, 
      markAsRead, 
      clearAll,
      requestPermission
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
