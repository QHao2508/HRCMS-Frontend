import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useAuth } from './useAuth.js';
import api from '../services/api.js';
import { createNotificationFeed } from '../services/notificationFeed.js';
import { notifyRealtime, subscribeRealtime } from '../services/realtimeEvents.js';

export function useNotifications() {
    const { user } = useAuth();
    const scope = `${user?.id ?? ''}:${user?.role ?? ''}`;
    const feed = useMemo(() => {
        // Scope is part of the controller identity; no data survives a user/role change.
        void scope;
        return createNotificationFeed(api, notifyRealtime);
    }, [scope]);
    const state = useSyncExternalStore(feed.subscribe, feed.getSnapshot, feed.getSnapshot);
    useEffect(() => {
        void feed.start();
        const unsubscribe = subscribeRealtime(() => void feed.refresh());
        return () => { unsubscribe(); feed.stop(); };
    }, [feed]);
    return { state, feed };
}
