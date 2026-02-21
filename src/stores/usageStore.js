import { create } from 'zustand';
import { getUsageAnalytics } from '../api/client';
import logger from '../utils/logger';

export const VALID_RANGES = ['today', '24h', '3d', '7d', '14d', '30d', '3m', '6m'];

export const useUsageStore = create((set, get) => ({
  data: null,
  isLoading: false,
  error: null,
  range: 'today',

  fetchUsage: async (range) => {
    const activeRange = range || get().range;
    set({ isLoading: true, error: null });

    try {
      const data = await getUsageAnalytics(activeRange);
      set({ data, isLoading: false, range: activeRange });
    } catch (error) {
      logger.error('Failed to fetch usage analytics', error);
      set({
        error: error.response?.data?.error?.message || 'Failed to load usage data',
        isLoading: false,
      });
    }
  },

  setRange: (range) => {
    if (!VALID_RANGES.includes(range)) return;
    set({ range, data: null });
    get().fetchUsage(range);
  },
}));
