import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/context/auth-context';

export interface Badge {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  earned: boolean;
  earnedAt: string | null;
}

export interface LevelStats {
  level: number;
  xp: number;
  prevThreshold: number;
  nextThreshold: number;
  nextLevelXP: number;
  progressPercent: number;
  rankName: string;
}

export interface BadgesData {
  xp: number;
  levelStats: LevelStats;
  badges: Badge[];
  totalBadgesCount: number;
  earnedBadgesCount: number;
  profileCompletion: number;
}

export function useBadges() {
  const { token } = useAuth();
  const [data, setData] = useState<BadgesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_ENDPOINTS.studentBadges, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      console.error('Failed to fetch badges:', e);
      setError(e.message || 'خطأ في تحميل الأوسمة');
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { data, loading, error, fetchBadges };
}