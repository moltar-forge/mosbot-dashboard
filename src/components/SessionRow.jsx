import { ClockIcon, CpuChipIcon } from '@heroicons/react/24/outline';

export default function SessionRow({ session }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-green-600/10 text-green-500 border-green-500/20';
      case 'queued':
        return 'bg-yellow-600/10 text-yellow-500 border-yellow-500/20';
      case 'completed':
        return 'bg-blue-600/10 text-blue-500 border-blue-500/20';
      case 'failed':
        return 'bg-red-600/10 text-red-500 border-red-500/20';
      default:
        return 'bg-dark-700 text-dark-400 border-dark-600';
    }
  };

  const formatDuration = (startedAt) => {
    if (!startedAt) return 'Not started';
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just started';
    if (diffMins < 60) return `${diffMins}m`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="flex items-center justify-between p-4 bg-dark-800 border border-dark-700 rounded-lg hover:border-dark-600 transition-colors">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-shrink-0">
          <CpuChipIcon className="w-5 h-5 text-dark-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-dark-100 truncate">{session.label || session.id}</p>
          {session.task_id && (
            <p className="text-xs text-dark-500 truncate">Task: {session.task_id}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3 flex-shrink-0">
        {session.started_at && (
          <div className="flex items-center gap-1.5 text-xs text-dark-500">
            <ClockIcon className="w-4 h-4" />
            <span>{formatDuration(session.started_at)}</span>
          </div>
        )}
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(session.status)}`}>
          {session.status}
        </span>
      </div>
    </div>
  );
}
