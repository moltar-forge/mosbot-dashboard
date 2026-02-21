import { create } from 'zustand';
import { api } from '../api/client';
import logger from '../utils/logger';

const DEFAULT_FILTERS = {
  startDate: null,
  endDate: null,
  category: null,
  agentId: null,
  source: 'all',
};

export const useActivityStore = create((set, get) => ({
  logs: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasMore: true,
  currentOffset: 0,
  pageSize: 50,
  filters: { ...DEFAULT_FILTERS },

  // Live sessions for the status bar on /log
  liveSessions: [],
  isLoadingSessions: false,

  // Apply new filters and re-fetch from the top
  setFilters: (newFilters) => {
    const merged = { ...get().filters, ...newFilters };
    set({ filters: merged, currentOffset: 0, logs: [], hasMore: true });
    get().fetchActivity({ limit: get().pageSize, offset: 0, ...merged });
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS }, currentOffset: 0, logs: [], hasMore: true });
    get().fetchActivity({ limit: get().pageSize, offset: 0 });
  },

  // Fetch the unified feed (replaces existing logs)
  fetchActivity: async ({ limit = 50, offset = 0, category, agentId, source, startDate, endDate } = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = { limit, offset };
      const activeFilters = { category, agentId, source, startDate, endDate };

      // Fall back to store filters for any undefined param
      const storeFilters = get().filters;
      if (activeFilters.category ?? storeFilters.category) params.category = activeFilters.category ?? storeFilters.category;
      if (activeFilters.agentId ?? storeFilters.agentId) params.agent_id = activeFilters.agentId ?? storeFilters.agentId;
      if ((activeFilters.source ?? storeFilters.source) && (activeFilters.source ?? storeFilters.source) !== 'all') {
        params.source = activeFilters.source ?? storeFilters.source;
      }
      if (activeFilters.startDate ?? storeFilters.startDate) params.start_date = activeFilters.startDate ?? storeFilters.startDate;
      if (activeFilters.endDate ?? storeFilters.endDate) params.end_date = activeFilters.endDate ?? storeFilters.endDate;

      const response = await api.get('/activity/feed', { params });
      const logs = response.data.data || [];
      const pagination = response.data.pagination || {};

      set({
        logs,
        isLoading: false,
        currentOffset: offset,
        hasMore: pagination.total ? (offset + logs.length) < pagination.total : logs.length >= limit,
      });
      return logs;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      logger.error('Failed to fetch activity feed', error);
      throw error;
    }
  },

  // Append next page to existing logs
  loadMoreActivity: async () => {
    const state = get();
    if (state.isLoadingMore || !state.hasMore) return;

    set({ isLoadingMore: true, error: null });
    try {
      const newOffset = state.currentOffset + state.pageSize;
      const f = state.filters;
      const params = { limit: state.pageSize, offset: newOffset };
      if (f.category) params.category = f.category;
      if (f.agentId) params.agent_id = f.agentId;
      if (f.source && f.source !== 'all') params.source = f.source;
      if (f.startDate) params.start_date = f.startDate;
      if (f.endDate) params.end_date = f.endDate;

      const response = await api.get('/activity/feed', { params });
      const newLogs = response.data.data || [];
      const pagination = response.data.pagination || {};

      set((s) => ({
        logs: [...s.logs, ...newLogs],
        isLoadingMore: false,
        currentOffset: newOffset,
        hasMore: pagination.total
          ? (newOffset + newLogs.length) < pagination.total
          : newLogs.length >= s.pageSize,
      }));
      return newLogs;
    } catch (error) {
      set({ error: error.message, isLoadingMore: false });
      logger.error('Failed to load more activity', error);
      throw error;
    }
  },

  // Fetch activity logs for a specific task (used by TaskModal — kept for backward compat)
  fetchTaskActivity: async (taskId, { limit = 100, offset = 0 } = {}) => {
    try {
      const response = await api.get(`/tasks/${taskId}/activity`, { params: { limit, offset } });
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to fetch task activity logs', error);
      throw error;
    }
  },

  // Create a new activity log entry
  createActivity: async (activityData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/activity', activityData);
      const newLog = response.data.data;
      set((s) => ({
        logs: [newLog, ...s.logs],
        isLoading: false,
      }));
      return newLog;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      logger.error('Failed to create activity log', error);
      throw error;
    }
  },

  // Fetch live agent sessions for the status bar
  fetchLiveSessions: async () => {
    set({ isLoadingSessions: true });
    try {
      const response = await api.get('/openclaw/sessions');
      const sessions = response.data?.data || response.data || [];
      set({ liveSessions: Array.isArray(sessions) ? sessions : [], isLoadingSessions: false });
    } catch (error) {
      logger.error('Failed to fetch live sessions', error);
      set({ isLoadingSessions: false });
    }
  },

  clearLogs: () => set({ logs: [], error: null }),
}));
