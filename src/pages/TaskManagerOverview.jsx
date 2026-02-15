import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { 
  PlayIcon, 
  ClockIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon,
  CircleStackIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import SessionList from '../components/SessionList';
import CronJobList from '../components/CronJobList';
import { getOpenClawSessions, getCronJobs } from '../api/client';
import { useBotStore } from '../stores/botStore';
import logger from '../utils/logger';

const SUBAGENT_POLLING_INTERVAL = 10000; // 10 seconds

export default function TaskManagerOverview() {
  const setSessionCounts = useBotStore((state) => state.setSessionCounts);
  const [subagents, setSubagents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cronJobs, setCronJobs] = useState([]);
  const [cronJobsLoading, setCronJobsLoading] = useState(true);
  
  const subagentPollingRef = useRef(null);

  // Fetch sessions from OpenClaw Gateway
  const loadSubagents = useCallback(async () => {
    try {
      const data = await getOpenClawSessions();
      const sessions = data || [];
      setSubagents(sessions);
      setError(null);
      setSessionCounts({
        running: sessions.filter(s => s.status === "running").length,
        active: sessions.filter(s => s.status === "active").length,
        idle: sessions.filter(s => s.status === "idle").length,
        total: sessions.length,
      });
    } catch (err) {
      logger.error("Failed to fetch sessions", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [setSessionCounts]);

  // Fetch cron job configuration (one-time, no polling needed)
  const loadCronJobs = useCallback(async () => {
    try {
      setCronJobsLoading(true);
      const data = await getCronJobs();
      setCronJobs(data || []);
    } catch (err) {
      logger.error("Failed to fetch cron jobs", err);
    } finally {
      setCronJobsLoading(false);
    }
  }, []);

  // Calculate metrics from sessions
  const metrics = useMemo(() => {
    const totalTokens = subagents.reduce((sum, session) => {
      return sum + (session.inputTokens || 0) + (session.outputTokens || 0);
    }, 0);

    const totalCost = subagents.reduce((sum, session) => {
      return sum + (session.messageCost || 0);
    }, 0);

    return { totalTokens, totalCost };
  }, [subagents]);

  // Initial load
  useEffect(() => {
    loadSubagents();
    loadCronJobs();
  }, [loadSubagents, loadCronJobs]);

  // Polling for subagents (metrics are derived from sessions)
  useEffect(() => {
    subagentPollingRef.current = setInterval(() => {
      loadSubagents();
    }, SUBAGENT_POLLING_INTERVAL);

    return () => {
      if (subagentPollingRef.current) {
        clearInterval(subagentPollingRef.current);
      }
    };
  }, [loadSubagents]);

  // Refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadSubagents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadSubagents]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadSubagents();
  };

  // Calculate session KPIs
  const runningCount = subagents.filter(s => s.status === "running").length;
  const activeCount = subagents.filter(s => s.status === "active").length;
  const idleCount = subagents.filter(s => s.status === "idle").length;

  // Calculate cron job health metrics
  const cronJobIssues = useMemo(() => {
    let issueCount = 0;
    cronJobs.forEach(job => {
      // Skip disabled jobs
      if (job.enabled === false) return;
      
      // Check if not scheduled (no nextRunAt or lastRunAt)
      if (!job.nextRunAt && !job.lastRunAt) {
        issueCount++;
        return;
      }
      
      // Check if missed (nextRunAt in the past)
      if (job.nextRunAt) {
        const nextRunDate = new Date(job.nextRunAt);
        const now = new Date();
        if (nextRunDate < now) {
          issueCount++;
          return;
        }
      }
      
      // Check explicit error status
      if (job.status === "error") {
        issueCount++;
      }
    });
    return issueCount;
  }, [cronJobs]);

  // Filter sessions for display
  // "Running" = actively processing (updated within 2 min)
  // "Active" = recently used (updated within 30 min)
  // "Idle" = not recently active (updated >30 min ago)
  const runningSessions = subagents.filter(s => s.status === "running");
  const activeSessions = subagents.filter(s => s.status === "active");
  const idleSessions = subagents.filter(s => s.status === "idle");

  if (isLoading && subagents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-dark-400">Loading overview...</p>
        </div>
      </div>
    );
  }

  if (error && subagents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading overview</p>
          <p className="text-dark-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Task Manager Overview" 
        subtitle="Real-time monitoring of agent sessions and task metrics"
        onRefresh={handleRefresh}
      />
      
      <div className="flex-1 p-3 md:p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard 
              label="Running"
              value={runningCount}
              icon={PlayIcon}
              color="green"
            />
            <StatCard 
              label="Active"
              value={activeCount}
              icon={ChartBarIcon}
              color="blue"
            />
            <StatCard 
              label="Idle"
              value={idleCount}
              icon={ClockIcon}
              color="yellow"
            />
            <StatCard 
              label="Cron Jobs"
              sublabel={cronJobIssues > 0 ? `${cronJobIssues} issue${cronJobIssues !== 1 ? 's' : ''}` : 'All healthy'}
              value={cronJobs.length}
              icon={cronJobIssues > 0 ? ExclamationTriangleIcon : CalendarDaysIcon}
              color={cronJobIssues > 0 ? "yellow" : "primary"}
            />
            <StatCard 
              label="Recent Tokens"
              sublabel="Last message per session"
              value={metrics.totalTokens.toLocaleString()}
              icon={CircleStackIcon}
              color="purple"
            />
            <StatCard 
              label="Recent Cost"
              sublabel="Last message per session"
              value={`$${metrics.totalCost.toFixed(4)}`}
              icon={CurrencyDollarIcon}
              color="primary"
            />
          </div>

          {/* Active Sessions (running + active, differentiated by label) */}
          <SessionList 
            sessions={[...runningSessions, ...activeSessions]}
            title="Active Sessions"
            emptyMessage="No active sessions"
          />

          {/* Idle Sessions */}
          <SessionList 
            sessions={idleSessions}
            title="Idle Sessions"
            emptyMessage="No idle sessions"
          />

          {/* Cron Jobs */}
          <CronJobList jobs={cronJobs} isLoading={cronJobsLoading} />
        </div>
      </div>
    </div>
  );
}
