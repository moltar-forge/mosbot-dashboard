import { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useTaskStore } from '../stores/taskStore';

export default function Header({ title, subtitle, onCreateTask, onRefresh, searchValue, onSearchChange }) {
  const { isRefreshing, lastFetchedAt } = useTaskStore();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    if (isManualRefreshing || isRefreshing) return;
    
    setIsManualRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setIsManualRefreshing(false);
    }
  };
  
  const getLastUpdatedText = () => {
    if (!lastFetchedAt) return '';
    
    const seconds = Math.floor((Date.now() - lastFetchedAt) / 1000);
    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };
  
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-dark-900 border-b border-dark-800">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-dark-100">{title}</h1>
          {lastFetchedAt && (
            <span className="text-xs text-dark-500">
              Updated {getLastUpdatedText()}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-dark-500">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isManualRefreshing || isRefreshing}
            className="p-2 rounded-lg bg-dark-800 border border-dark-700 text-dark-300 hover:text-dark-100 hover:border-dark-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            title="Refresh tasks"
          >
            <ArrowPathIcon 
              className={`w-5 h-5 transition-transform duration-500 ${
                (isManualRefreshing || isRefreshing) ? 'animate-spin' : 'group-hover:rotate-180'
              }`}
            />
          </button>
        )}
        
        {/* Search */}
        {onSearchChange && (
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 bg-dark-800 border border-dark-700 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        )}

        {/* Create Task Button */}
        {onCreateTask && (
          <button onClick={onCreateTask} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            New Task
          </button>
        )}
      </div>
    </div>
  );
}
