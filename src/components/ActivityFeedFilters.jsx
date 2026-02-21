import { useState, useEffect } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useActivityStore } from '../stores/activityStore';
import { api } from '../api/client';
import logger from '../utils/logger';

const CATEGORIES = [
  { value: 'heartbeat',      label: 'Heartbeat' },
  { value: 'implementation', label: 'Implementation' },
  { value: 'improvement',    label: 'Improvement' },
  { value: 'bug_fix',        label: 'Bug Fix' },
  { value: 'refactor',       label: 'Refactor' },
  { value: 'feature',        label: 'Feature' },
  { value: 'planning',       label: 'Planning' },
  { value: 'deployment',     label: 'Deployment' },
  { value: 'testing',        label: 'Testing' },
  { value: 'maintenance',    label: 'Maintenance' },
];

const DATE_PRESETS = [
  { label: 'Today',    days: 0 },
  { label: 'Last 7d',  days: 7 },
  { label: 'Last 30d', days: 30 },
];

function getPresetDates(days) {
  const end = new Date();
  const start = new Date();
  if (days === 0) {
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
  }
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export default function ActivityFeedFilters() {
  const { filters, setFilters, resetFilters } = useActivityStore();
  const [agents, setAgents] = useState([]);
  const [activePreset, setActivePreset] = useState(null);
  const [showCustomDates, setShowCustomDates] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    api.get('/openclaw/agents')
      .then((r) => setAgents(r.data?.data || []))
      .catch((err) => logger.error('Failed to fetch agents for filter', err));
  }, []);

  const hasActiveFilters =
    filters.category ||
    filters.agentId ||
    filters.startDate ||
    filters.endDate ||
    (filters.source && filters.source !== 'all');

  const handlePreset = (preset) => {
    if (activePreset === preset.label) {
      setActivePreset(null);
      setFilters({ startDate: null, endDate: null });
      return;
    }
    setActivePreset(preset.label);
    setShowCustomDates(false);
    setFilters(getPresetDates(preset.days));
  };

  const handleCustomApply = () => {
    if (!customStart && !customEnd) return;
    setActivePreset(null);
    setFilters({
      startDate: customStart ? new Date(customStart).toISOString() : null,
      endDate: customEnd ? new Date(customEnd + 'T23:59:59').toISOString() : null,
    });
  };

  const handleReset = () => {
    setActivePreset(null);
    setShowCustomDates(false);
    setCustomStart('');
    setCustomEnd('');
    resetFilters();
  };

  return (
    <div className="px-3 md:px-6 py-3 bg-dark-900 border-b border-dark-800">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3">

        {/* Source toggle */}
        <div className="flex items-center gap-1 bg-dark-800 rounded-lg p-1 border border-dark-700">
          {['all', 'activity', 'cron'].map((s) => (
            <button
              key={s}
              onClick={() => setFilters({ source: s })}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${
                filters.source === s
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              {s === 'all' ? 'All' : s === 'activity' ? 'Activity' : 'Cron'}
            </button>
          ))}
        </div>

        {/* Date presets */}
        <div className="flex items-center gap-1">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                activePreset === preset.label
                  ? 'bg-primary-600/20 border-primary-500/50 text-primary-400'
                  : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-dark-200 hover:border-dark-600'
              }`}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={() => { setShowCustomDates((v) => !v); setActivePreset(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              showCustomDates
                ? 'bg-primary-600/20 border-primary-500/50 text-primary-400'
                : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-dark-200 hover:border-dark-600'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Category dropdown */}
        <select
          value={filters.category || ''}
          onChange={(e) => setFilters({ category: e.target.value || null })}
          className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-xs text-dark-300 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {/* Agent dropdown */}
        {agents.length > 0 && (
          <select
            value={filters.agentId || ''}
            onChange={(e) => setFilters({ agentId: e.target.value || null })}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-xs text-dark-300 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon ? `${a.icon} ` : ''}{a.name || a.id}
              </option>
            ))}
          </select>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-dark-400 hover:text-dark-200 border border-dark-700 hover:border-dark-600 bg-dark-800 transition-colors"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
            Clear
          </button>
        )}

        {!hasActiveFilters && (
          <FunnelIcon className="w-4 h-4 text-dark-600 ml-auto" />
        )}
      </div>

      {/* Custom date inputs */}
      {showCustomDates && (
        <div className="max-w-5xl mx-auto mt-2 flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-xs text-dark-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <span className="text-xs text-dark-500">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-xs text-dark-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <button
            onClick={handleCustomApply}
            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
