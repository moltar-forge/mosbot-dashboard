import { useEffect, useState, useRef } from 'react';
import { 
  UserGroupIcon, 
  CpuChipIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Header from '../components/Header';
import { getActiveSubagentSessions } from '../api/client';
import { agencyOrgChart, findNodeByLabel } from '../config/agencyOrgChart';
import logger from '../utils/logger';

const POLLING_INTERVAL = 10000; // 10 seconds

export default function OrgChart() {
  const [subagents, setSubagents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);

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

  // Initial load
  useEffect(() => {
    loadSubagents();
  }, []);

  // Polling
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      loadSubagents();
    }, POLLING_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

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
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadSubagents();
  };

  // Check if a node is active based on running sessions
  const getNodeStatus = (label) => {
    const session = subagents.find(s => s.label === label && s.status === 'running');
    if (session) return 'active';
    
    const node = findNodeByLabel(label);
    return node?.status || 'scaffolded';
  };

  // Render status badge
  const StatusBadge = ({ status }) => {
    const config = {
      active: {
        icon: CheckCircleIcon,
        className: 'bg-green-600/10 text-green-500 border-green-500/20',
        label: 'Active',
      },
      scaffolded: {
        icon: ClockIcon,
        className: 'bg-yellow-600/10 text-yellow-500 border-yellow-500/20',
        label: 'Scaffolded',
      },
      deprecated: {
        icon: XCircleIcon,
        className: 'bg-red-600/10 text-red-500 border-red-500/20',
        label: 'Deprecated',
      },
    };

    const { icon: Icon, className, label } = config[status] || config.scaffolded;

    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${className}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </div>
    );
  };

  // Render leadership card
  const LeadershipCard = ({ leader }) => {
    const status = getNodeStatus(leader.label);
    
    return (
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 shadow-card hover:border-dark-600 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-600/10 rounded-lg">
              <UserGroupIcon className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dark-100">{leader.title}</h3>
              <p className="text-xs text-dark-500">{leader.label}</p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
        <p className="text-xs text-dark-400">{leader.description}</p>
      </div>
    );
  };

  // Render subagent card
  const SubagentCard = ({ agent }) => {
    const status = getNodeStatus(agent.label);
    
    return (
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-3 shadow-card hover:border-dark-600 transition-colors">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CpuChipIcon className="w-4 h-4 text-dark-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-dark-100 truncate">{agent.label}</p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
        <p className="text-xs text-dark-400 line-clamp-2">{agent.description}</p>
      </div>
    );
  };

  // Render department section
  const DepartmentSection = ({ department }) => {
    return (
      <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-600/10 rounded-lg">
            <UserGroupIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-dark-100">{department.name}</h3>
            <p className="text-xs text-dark-500">
              {department.subagents.length} subagent{department.subagents.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {department.subagents.map((agent) => (
            <SubagentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
    );
  };

  if (isLoading && subagents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-dark-400">Loading org chart...</p>
        </div>
      </div>
    );
  }

  if (error && subagents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading org chart</p>
          <p className="text-dark-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Organization Chart" 
        subtitle="Multi-agent system hierarchy and status overview"
        onRefresh={handleRefresh}
      />
      
      <div className="flex-1 p-3 md:p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Leadership */}
          <div>
            <h2 className="text-xl font-bold text-dark-100 mb-4">Leadership</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {agencyOrgChart.leadership.map((leader) => (
                <LeadershipCard key={leader.id} leader={leader} />
              ))}
            </div>
          </div>

          {/* Departments */}
          <div>
            <h2 className="text-xl font-bold text-dark-100 mb-4">Departments</h2>
            <div className="space-y-4">
              {agencyOrgChart.departments.map((department) => (
                <DepartmentSection key={department.id} department={department} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
