import { create } from 'zustand';

/**
 * Holds scheduler "attention" counts for nav badges (errors, missed).
 * Updated by the Scheduler page when cron jobs are loaded.
 */
export const useSchedulerStore = create((set) => ({
  attention: { errors: 0, missed: 0 },

  setAttention: (counts) =>
    set({ attention: { errors: counts.errors ?? 0, missed: counts.missed ?? 0 } }),
}));
