import { useEffect, useState, useRef } from 'react';
import { 
  PlayIcon, 
  ClockIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import SessionList from '../components/SessionList';
import { getActiveSubagentSessions } from '../api/client';
import { useTaskStore } from '../stores/taskStore';
import logger from '../utils/logger';

const SUBAGENT_POLLING_INTERVAL = 10000; // 10 seconds
const METRICS_REFRESH_INTERVAL = 60000; // 60 seconds

export default function TaskManagerOverview() {
  const { tasks, fetchTasks } = useTaskStore();
  const [subagents, setSubagents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    totalTokens: 0,
    totalCost: 0,
  });
  
  const subagentPollingRef = useRef(null);
  const metricsPollingRef = useRef(null);

  // Fetch subagents
  const loadSubagents = async () => {
    try {
      const data = await getActiveSubagentSessions();
      setSubagents(data || []);
      setError(null);
    } catch (err) {
      logger.error('Failed to fetch subagents', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics from tasks
  const calculateMetrics = () => {
    const totalTokens = tasks.reduce((sum, task) => {
      return sum + 
        (task.agent_tokens_input || 0) +
        (task.agent_tokens_input_cache || 0) +
        (task.agent_tokens_output || 0) +
        (task.agent_tokens_output_cache || 0);
    }, 0);

    const totalCost = tasks.reduce((sum, task) => {
      return sum + (task.agent_cost_usd || 0);
    }, 0);

    setMetrics({ totalTokens, totalCost });
  };

  // Initial load
  useEffect(() => {
    loadSubagents();
    fetchTasks({ silent: true });
  }, [fetchTasks]);

  // Calculate metrics when tasks change
  useEffect(() => {
    calculateMetrics();
  }, [tasks]);

  // Polling for subagents
  useEffect(() => {
    subagentPollingRef.current = setInterval(() => {
      loadSubagents();
    }, SUBAGENT_POLLING_INTERVAL);

    return () => {
      if (subagentPollingRef.current) {
        clearInterval(subagentPollingRef.current);
      }
    };
  }, []);

  // Polling for metrics (less frequent)
  useEffect(() => {
    metricsPollingRef.current = setInterval(() => {
      fetchTasks({ silent: true });
    }, METRICS_REFRESH_INTERVAL);

    return () => {
      if (metricsPollingRef.current) {
        clearInterval(metricsPollingRef.current);
      }
    };
  }, [fetchTasks]);

  // Refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadSubagents();
        fetchTasks({ silent: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchTasks]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([
      loadSubagents(),
      fetchTasks({ silent: false }),
    ]);
  };

  // Calculate KPIs
  const activeCount = subagents.filter(s => s.status === 'running').length;
  const idleCount = subagents.filter(s => s.status === 'queued').length;
  const totalSessions = subagents.length;

  // Filter sessions for display
  const activeSessions = subagents.filter(s => s.status === 'running' || s.status === 'queued');

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard 
              label="Active"
              value={activeCount}
              icon={PlayIcon}
              color="green"
            />
            <StatCard 
              label="Idle"
              value={idleCount}
              icon={ClockIcon}
              color="yellow"
            />
            <StatCard 
              label="Total Sessions"
              value={totalSessions}
              icon={ChartBarIcon}
              color="blue"
            />
            <StatCard 
              label="Tokens Used"
              value={metrics.totalTokens.toLocaleString()}
              icon={CircleStackIcon}
              color="purple"
            />
            <StatCard 
              label="Total Cost"
              value={`$${metrics.totalCost.toFixed(2)}`}
              icon={CurrencyDollarIcon}
              color="primary"
            />
          </div>

          {/* Active Sessions */}
          <SessionList 
            sessions={activeSessions}
            title="Active Sessions"
            emptyMessage="No active or queued sessions"
          />
        </div>
      </div>
    </div>
  );
}
