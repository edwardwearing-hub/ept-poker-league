'use client';

import { useState, useEffect } from 'react';

export function usePlayerStatus() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            const name = localStorage.getItem('ept_active_player_v2');
            if (!name) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/player/status?name=${encodeURIComponent(name)}`);
                if (res.ok) {
                    const data = await res.json();
                    setStatus(data);
                }
            } catch (err) {
                console.error('Failed to fetch player status', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();

        // Listen for storage changes (login/logout)
        const handleStorage = () => fetchStatus();
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    return { status, loading };
}
