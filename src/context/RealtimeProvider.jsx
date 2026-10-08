import { useEffect } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useAuth } from './useAuth.js';
import api, { refreshSession } from '../services/api.js';
import { getSession } from '../services/sessionStore.js';
import { notifyRealtime } from '../services/realtimeEvents.js';

export function RealtimeProvider({ children }) {
    const { user, isAuthenticated } = useAuth();
    useEffect(() => {
        if (!isAuthenticated || !user?.id || import.meta.env.VITE_REALTIME_ENABLED !== 'true') return;
        let disposed = false;
        let retry;
        const generation = getSession().generation;
        const connection = new HubConnectionBuilder()
            .withUrl((import.meta.env.VITE_API_BASE_URL?.trim() || '') + '/hubs/club', {
                accessTokenFactory: async () => {
                    if (disposed || getSession().generation !== generation) throw new Error('Session changed');
                    if (getSession().expiresAt <= Date.now() + 30000) await refreshSession();
                    await api.get('/api/auth/me'); // Revalidate stamp on each connection/reconnect.
                    if (disposed || getSession().generation !== generation) throw new Error('Session changed');
                    return getSession().accessToken;
                },
            })
            .configureLogging(LogLevel.None)
            .withAutomaticReconnect()
            .build();
        connection.on('NotificationCreated', notifyRealtime);
        connection.on('NotificationsChanged', notifyRealtime);
        connection.on('DataChanged', notifyRealtime);
        connection.onreconnected(() => { if (!disposed) notifyRealtime(); });
        async function start() {
            if (disposed || getSession().generation !== generation) return;
            try {
                await connection.start();
                if (disposed) { await connection.stop(); return; }
                notifyRealtime(); // Recover notifications missed while disconnected.
            } catch {
                if (!disposed && getSession().generation === generation) retry = setTimeout(start, 5000);
            }
        }
        connection.onclose(() => {
            if (!disposed && getSession().generation === generation) retry = setTimeout(start, 5000);
        });
        void start();
        return () => {
            disposed = true;
            clearTimeout(retry);
            connection.off('NotificationCreated', notifyRealtime);
            connection.off('NotificationsChanged', notifyRealtime);
            connection.off('DataChanged', notifyRealtime);
            void connection.stop();
        };
    }, [isAuthenticated, user?.id]);
    return children;
}
