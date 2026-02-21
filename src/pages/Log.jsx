import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useActivityStore } from '../stores/activityStore';
import { parseDatabaseDate } from '../utils/helpers';
import { format } from 'date-fns';
import {
  ArrowTopRightOnSquareIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Header from '../components/Header';
import LiveAgentStatus from '../components/LiveAgentStatus';
import ActivityFeedFilters from '../components/ActivityFeedFilters';
import logger from '../utils/logger';

// Group feed entries by calendar day
const groupByDay = (logs) => {
  const groups = {};

  logs.forEach((log) => {
    const date = parseDatabaseDate(log.timestamp);
    const dateKey = format(date, 'yyyy-MM-dd');

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date,
        dateLabel: format(date, 'EEEE, MMMM d').toUpperCase(),
        logs: [],
      };
    }

    groups[dateKey].logs.push(log);
  });

  return Object.values(groups).sort((a, b) => b.date - a.date);
};

// Dot color for activity_log category
const getCategoryColor = (category) => {
  const colors = {
    heartbeat:      'bg-yellow-500',
    implementation: 'bg-blue-500',
    improvement:    'bg-green-500',
    bug_fix:        'bg-red-500',
    refactor:       'bg-purple-500',
    feature:        'bg-green-500',
    planning:       'bg-purple-500',
    deployment:     'bg-yellow-500',
    testing:        'bg-blue-500',
    maintenance:    'bg-green-500',
  };
  return colors[category] || 'bg-primary-500';
};

function formatCost(cost) {
  if (!cost || cost === 0) return null;
  if (cost < 0.001) return '<$0.001';
  return `$${cost.toFixed(3)}`;
}

function CronEntry({ log }) {
  const timeLabel = format(parseDatabaseDate(log.timestamp), 'h:mm a');
  const cost = formatCost(log.cost_usd);
  const tokens = log.tokens_input != null
    ? `${((log.tokens_input || 0) + (log.tokens_output || 0)).toLocaleString()} tokens`
    : null;

  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      {/* Cron clock dot */}
      <div className="absolute left-0 top-2 -translate-x-[9px] w-4 h-4 bg-dark-600 rounded-full border-2 border-dark-950 flex items-center justify-center">
        <ClockIcon className="w-2.5 h-2.5 text-dark-400" />
      </div>

      <div className="text-xs text-dark-500 font-medium mb-2">{timeLabel}</div>

      <div className="card p-4 hover:bg-dark-800/50 transition-colors border-dark-700/50">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-sm font-medium text-dark-300">
            {log.job_name || log.title}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            {cost && (
              <span className="text-xs text-dark-500 bg-dark-800 border border-dark-700 rounded px-1.5 py-0.5">
                {cost}
              </span>
            )}
            {tokens && (
              <span className="text-xs text-dark-500 bg-dark-800 border border-dark-700 rounded px-1.5 py-0.5">
                {tokens}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-dark-600 uppercase tracking-wider">Cron</span>
          {log.agent_name && (
            <span className="text-xs text-dark-500">{log.agent_name}</span>
          )}
          {log.model && (
            <span className="text-xs text-dark-600 truncate max-w-[160px]">{log.model}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityEntry({ log }) {
  const timeLabel = format(parseDatabaseDate(log.timestamp), 'h:mm a');

  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      {/* Category dot */}
      <div
        className={`absolute left-0 top-2 -translate-x-[9px] w-4 h-4 ${getCategoryColor(log.category)} rounded-full border-2 border-dark-950`}
      />

      <div className="text-xs text-blue-400 font-medium mb-2">{timeLabel}</div>

      <div className="card p-4 hover:bg-dark-800/50 transition-colors">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-base font-semibold text-dark-200 truncate">
              {log.title}
            </h3>
            {log.agent_name && (
              <span className="text-xs text-dark-500 shrink-0">{log.agent_name}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {log.task_id && (
              <Link
                to={`/task/${log.task_id}`}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded text-xs font-medium transition-colors"
                title={`View task: ${log.task_title || 'Task'}`}
              >
                <span>{log.task_title || 'Task'}</span>
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
        <p className="text-sm text-dark-400 leading-relaxed whitespace-pre-line">
          {log.description}
        </p>
      </div>
    </div>
  );
}

export default function Log() {
  const { logs, isLoading, isLoadingMore, hasMore, fetchActivity, loadMoreActivity } =
    useActivityStore();

  useEffect(() => {
    fetchActivity({ limit: 50 }).catch((error) => {
      logger.error('Failed to fetch activity feed', error);
    });
  }, [fetchActivity]);

  const handleLoadMore = () => {
    loadMoreActivity().catch((error) => {
      logger.error('Failed to load more activity', error);
    });
  };

  const groupedLogs = groupByDay(logs);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Activity Log"
        subtitle={`Workspace-wide agent activity, cron runs, and events • ${logs.length} ${logs.length === 1 ? 'entry' : 'entries'}`}
      />

      <LiveAgentStatus />
      <ActivityFeedFilters />

      <div className="flex-1 p-3 md:p-6 overflow-y-auto bg-dark-950">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="card p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <h3 className="text-lg font-medium text-dark-400">Loading activity...</h3>
            </div>
          ) : logs.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-dark-400 mb-2">No Activity Yet</h3>
              <p className="text-dark-500">Agent activity will appear here as it works</p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedLogs.map((group) => (
                <div key={group.dateLabel} className="space-y-4">
                  {/* Date header */}
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-dark-700 rounded-sm" />
                    <h2 className="text-sm font-semibold text-dark-500 tracking-wider">
                      {group.dateLabel}
                    </h2>
                  </div>

                  {/* Timeline entries */}
                  <div className="ml-1.5 border-l-2 border-dark-800 space-y-0">
                    {group.logs.map((log) =>
                      log.source === 'cron' ? (
                        <CronEntry key={log.id} log={log} />
                      ) : (
                        <ActivityEntry key={log.id} log={log} />
                      )
                    )}
                  </div>
                </div>
              ))}

              {/* Load More */}
              {hasMore && !isLoading && (
                <div className="flex justify-center pt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="btn-secondary flex items-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>Load More</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
