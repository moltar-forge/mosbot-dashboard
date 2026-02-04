import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { 
  XMarkIcon, 
  PencilIcon, 
  ClockIcon,
  PlusCircleIcon,
  ArrowPathIcon,
  ArchiveBoxIcon,
  ArrowUturnLeftIcon,
  TrashIcon,
  PencilSquareIcon,
  ChatBubbleLeftRightIcon,
  ShareIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import { useTaskStore } from '../stores/taskStore';
import { TASK_STATUS, TASK_PRIORITY, TASK_TYPE, PRIORITY_CONFIG, STATUS_CONFIG, TASK_TYPE_CONFIG } from '../utils/constants';
import { api } from '../api/client';
import { formatDateTimeLocal, parseDatabaseDate, classNames } from '../utils/helpers';

export default function TaskModal({ isOpen, onClose, task = null }) {
  const { createTask, updateTask, deleteTask, fetchTaskHistory } = useTaskStore();
  
  // Preserve the task internally to prevent glitches during modal close animation
  const [internalTask, setInternalTask] = useState(null);
  
  // View/Edit mode: 'view' for existing tasks, 'edit' for new tasks or when editing
  const [mode, setMode] = useState('edit');
  
  // History data
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Users list for assignee dropdown
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Share button state
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: TASK_STATUS.PLANNING,
    priority: TASK_PRIORITY.MEDIUM,
    type: TASK_TYPE.TASK,
    dueDate: '',
    assignee_id: '',
    tags: '',
  });

  // Fetch active users for assignee dropdown
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get('/users', { params: { active_only: 'true' } });
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    // Only update internal task and form when modal opens
    if (isOpen) {
      setInternalTask(task);
      
      // Fetch users for dropdown
      fetchUsers();
      
      // Set mode: view for existing tasks, edit for new tasks
      setMode(task ? 'view' : 'edit');
      
      if (task) {
        setFormData({
          title: task.title || '',
          description: task.summary || '', // API uses 'summary', frontend uses 'description'
          status: task.status || TASK_STATUS.PLANNING,
          priority: task.priority || TASK_PRIORITY.MEDIUM,
          type: task.type || TASK_TYPE.TASK,
          dueDate: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '', // API uses 'due_date'
          assignee_id: task.assignee_id || '', // Use assignee_id from API
          tags: task.tags ? (Array.isArray(task.tags) ? task.tags.join(', ') : task.tags) : '',
        });
        
        // Fetch history for existing tasks
        loadHistory(task.id);
      } else {
        setFormData({
          title: '',
          description: '',
          status: TASK_STATUS.PLANNING,
          priority: TASK_PRIORITY.MEDIUM,
          type: TASK_TYPE.TASK,
          dueDate: '',
          assignee_id: '',
          tags: '',
        });
        setHistory([]);
      }
    }
  }, [task, isOpen]);
  
  const loadHistory = async (taskId) => {
    setLoadingHistory(true);
    try {
      const historyData = await fetchTaskHistory(taskId);
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Transform data to match API format (field name mapping)
    const taskData = {
      title: formData.title,
      summary: formData.description || null, // API expects 'summary', not 'description'
      status: formData.status || TASK_STATUS.PLANNING,
      priority: formData.priority || null,
      type: formData.type || TASK_TYPE.TASK,
      due_date: formData.dueDate || null, // API expects 'due_date', not 'dueDate'
      assignee_id: formData.assignee_id || null, // Use assignee_id from dropdown
      // Note: API doesn't support 'tags', only 'assignee_id' (UUID)
    };

    try {
      if (internalTask) {
        const updated = await updateTask(internalTask.id, taskData);
        setInternalTask(updated);
        // Reload history after update
        await loadHistory(internalTask.id);
        setMode('view');
      } else {
        await createTask(taskData);
        onClose();
      }
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleDelete = async () => {
    if (internalTask && window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(internalTask.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleArchive = async () => {
    if (internalTask && window.confirm('Archive this task? It will be moved to the Archived section.')) {
      try {
        await updateTask(internalTask.id, { status: TASK_STATUS.ARCHIVE });
        onClose();
      } catch (error) {
        console.error('Failed to archive task:', error);
      }
    }
  };

  const handleRestore = async () => {
    if (internalTask) {
      try {
        await updateTask(internalTask.id, { status: TASK_STATUS.DONE });
        onClose();
      } catch (error) {
        console.error('Failed to restore task:', error);
      }
    }
  };

  const handleShare = async () => {
    if (internalTask) {
      const taskUrl = `${window.location.origin}/task/${internalTask.id}`;
      try {
        await navigator.clipboard.writeText(taskUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Format history entry for display
  const formatHistoryEntry = (entry) => {
    const changes = [];
    
    if (entry.old_values && entry.new_values) {
      Object.keys(entry.new_values).forEach(key => {
        const oldVal = entry.old_values[key];
        const newVal = entry.new_values[key];
        
        if (oldVal !== newVal) {
          const formattedKey = key.replace(/_/g, ' ');
          changes.push({
            field: formattedKey,
            oldValue: oldVal,
            newValue: newVal
          });
        }
      });
    }
    
    return changes;
  };
  
  const formatValue = (value, isLongText = false) => {
    if (value === null || value === undefined) return 'none';
    if (typeof value === 'boolean') return value ? 'yes' : 'no';
    
    // Check if it's a date string (ISO format or database timestamp)
    if (typeof value === 'string') {
      // Check for ISO date format (contains 'T' and date-like pattern)
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;
      if (isoDatePattern.test(value.trim())) {
        const formatted = formatDateTimeLocal(value);
        return formatted || value; // Fallback to original if parsing fails
      }
      
      // Check for other date-like patterns (database timestamps without T)
      const dbDatePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;
      if (dbDatePattern.test(value.trim())) {
        const formatted = formatDateTimeLocal(value);
        return formatted || value;
      }
      
      // Don't truncate if isLongText is true
      if (!isLongText && value.length > 50) return value.substring(0, 47) + '...';
    }
    
    return String(value);
  };
  
  // Check if a value is long text (for special rendering)
  const isLongText = (value) => {
    return typeof value === 'string' && value.length > 100;
  };
  
  const getEventIcon = (eventType) => {
    const iconClass = "w-5 h-5";
    switch (eventType) {
      case 'CREATED':
        return <PlusCircleIcon className={iconClass} />;
      case 'STATUS_CHANGED':
        return <ArrowPathIcon className={iconClass} />;
      case 'ARCHIVED_AUTO':
      case 'ARCHIVED_MANUAL':
        return <ArchiveBoxIcon className={iconClass} />;
      case 'RESTORED':
        return <ArrowUturnLeftIcon className={iconClass} />;
      case 'DELETED':
        return <TrashIcon className={iconClass} />;
      default:
        return <PencilSquareIcon className={iconClass} />;
    }
  };
  
  const getEventColor = (eventType) => {
    switch (eventType) {
      case 'CREATED':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'STATUS_CHANGED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'ARCHIVED_AUTO':
      case 'ARCHIVED_MANUAL':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'RESTORED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'DELETED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-primary-500/10 text-primary-400 border-primary-500/20';
    }
  };
  
  const getEventLabel = (eventType) => {
    switch (eventType) {
      case 'CREATED':
        return 'Created';
      case 'STATUS_CHANGED':
        return 'Status changed';
      case 'ARCHIVED_AUTO':
        return 'Auto-archived';
      case 'ARCHIVED_MANUAL':
        return 'Archived';
      case 'RESTORED':
        return 'Restored';
      case 'DELETED':
        return 'Deleted';
      case 'UPDATED':
        return 'Updated';
      default:
        return eventType;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-lg bg-dark-900 border border-dark-800 p-6 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1 min-w-0 mr-4">
                    <Dialog.Title className="text-xl font-semibold text-dark-100">
                      {internalTask ? (mode === 'view' ? formData.title : 'Edit Task') : 'Create New Task'}
                    </Dialog.Title>
                    {internalTask && mode === 'view' && (
                      <p className="text-xs text-dark-500 mt-1 font-mono">ID: {internalTask.id}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {internalTask && mode === 'view' && (
                      <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-lg transition-colors text-sm border border-dark-700"
                        title="Copy task link"
                      >
                        {copied ? (
                          <>
                            <CheckIcon className="w-4 h-4 text-green-500" />
                            <span className="text-green-500">Copied!</span>
                          </>
                        ) : (
                          <>
                            <ShareIcon className="w-4 h-4" />
                            Share
                          </>
                        )}
                      </button>
                    )}
                    {internalTask && mode === 'view' && internalTask.status !== TASK_STATUS.ARCHIVE && (
                      <button
                        onClick={() => setMode('edit')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="text-dark-400 hover:text-dark-200 transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* View Mode */}
                {mode === 'view' && internalTask && (
                  <>
                    {/* Main Content */}
                    <div className="space-y-6 mb-6">
                          {/* Description and Metadata - Side by Side */}
                          <div className="grid grid-cols-3 gap-6">
                            {/* Main Column - Description */}
                            <div className="col-span-2">
                              {formData.description && (
                                <div>
                                  <label className="block text-sm font-medium text-dark-400 mb-2">Description</label>
                                  <div className="prose prose-invert prose-sm max-w-none text-dark-200 bg-dark-800 p-4 rounded-lg">
                                    <ReactMarkdown
                                      components={{
                                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-dark-100 mt-4 mb-2" {...props} />,
                                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-dark-100 mt-3 mb-2" {...props} />,
                                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-dark-100 mt-3 mb-2" {...props} />,
                                        p: ({node, ...props}) => <p className="text-dark-200 mb-2" {...props} />,
                                        ul: ({node, ...props}) => <ul className="list-disc list-inside text-dark-200 mb-2 space-y-1" {...props} />,
                                        ol: ({node, ...props}) => <ol className="list-decimal list-inside text-dark-200 mb-2 space-y-1" {...props} />,
                                        li: ({node, ...props}) => <li className="text-dark-200" {...props} />,
                                        code: ({node, inline, ...props}) => 
                                          inline 
                                            ? <code className="bg-dark-900 px-1.5 py-0.5 rounded text-primary-400 text-sm" {...props} />
                                            : <code className="block bg-dark-900 p-3 rounded text-primary-400 text-sm overflow-x-auto mb-2" {...props} />,
                                        pre: ({node, ...props}) => <pre className="bg-dark-900 p-3 rounded overflow-x-auto mb-2" {...props} />,
                                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-dark-600 pl-4 italic text-dark-300 mb-2" {...props} />,
                                        hr: ({node, ...props}) => <hr className="border-dark-700 my-4" {...props} />,
                                        strong: ({node, ...props}) => <strong className="font-semibold text-dark-100" {...props} />,
                                        em: ({node, ...props}) => <em className="italic text-dark-200" {...props} />,
                                        a: ({node, ...props}) => <a className="text-primary-400 hover:text-primary-300 underline" {...props} />,
                                      }}
                                    >
                                      {formData.description}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                              
                              {formData.tags && (
                                <div className="mt-4">
                                  <label className="block text-sm font-medium text-dark-400 mb-2">Tags</label>
                                  <p className="text-dark-100">{formData.tags}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Right Column - Metadata */}
                            <div>
                              <label className="block text-sm font-medium text-dark-400 mb-2">Details</label>
                              <div className="bg-dark-800 p-4 rounded-lg space-y-4">
                                <div>
                                  <label className="block text-xs font-medium text-dark-500 mb-2 uppercase tracking-wider">Status</label>
                                <span className={classNames(
                                  'inline-block px-2 py-1 text-xs font-medium rounded',
                                  STATUS_CONFIG[formData.status]?.color || 'bg-dark-700 text-dark-300'
                                )}>
                                  {STATUS_CONFIG[formData.status]?.label || formData.status}
                                </span>
                              </div>
                              
                              <div className="border-t border-dark-700 pt-4">
                                <label className="block text-xs font-medium text-dark-500 mb-2 uppercase tracking-wider">Priority</label>
                                <span className={classNames(
                                  'inline-block px-2 py-1 text-xs font-medium rounded',
                                  PRIORITY_CONFIG[formData.priority]?.color || 'bg-dark-700 text-dark-300'
                                )}>
                                  {PRIORITY_CONFIG[formData.priority]?.label || formData.priority}
                                </span>
                              </div>
                              
                              <div className="border-t border-dark-700 pt-4">
                                <label className="block text-xs font-medium text-dark-500 mb-2 uppercase tracking-wider">Type</label>
                                <span className={classNames(
                                  'inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded bg-dark-800',
                                  TASK_TYPE_CONFIG[formData.type]?.color || 'text-dark-300'
                                )}>
                                  {TASK_TYPE_CONFIG[formData.type]?.label || formData.type}
                                </span>
                              </div>
                              
                              {formData.dueDate && (
                                <div className="border-t border-dark-700 pt-4">
                                  <label className="block text-xs font-medium text-dark-500 mb-1 uppercase tracking-wider">Due Date</label>
                                  <p className="text-dark-100">{new Date(formData.dueDate).toLocaleDateString()}</p>
                                </div>
                              )}
                              
                              {formData.assignee_id && (
                                <div className="border-t border-dark-700 pt-4">
                                  <label className="block text-xs font-medium text-dark-500 mb-1 uppercase tracking-wider">Assignee</label>
                                  <p className="text-dark-100">
                                    {users.find(u => u.id === formData.assignee_id)?.name || 'Unknown'}
                                  </p>
                                </div>
                              )}
                              
                              <div className="border-t border-dark-700 pt-4">
                                <label className="block text-xs font-medium text-dark-500 mb-1 uppercase tracking-wider">Reporter</label>
                                <p className="text-dark-100">{internalTask?.reporter_name || 'Not set'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                    </div>
                    
                    {/* Archive Notices */}
                    {internalTask.status === TASK_STATUS.DONE && (
                      <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg mb-6">
                        <p className="text-sm text-blue-300">
                          This task is marked as Done. It will be automatically archived after 7 days, or you can archive it manually.
                        </p>
                      </div>
                    )}
                    
                    {internalTask.status === TASK_STATUS.ARCHIVE && (
                      <div className="p-3 bg-dark-800 border border-dark-700 rounded-lg mb-6">
                        <p className="text-sm text-dark-300">
                          This task is archived. You can restore it to move it back to Done status.
                        </p>
                      </div>
                    )}
                    
                    {/* Tabs Section */}
                    <Tab.Group>
                      <Tab.List className="flex gap-6 border-b border-dark-800 mb-4">
                        <Tab className={({ selected }) =>
                          `pb-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2
                          ${selected
                            ? 'border-primary-500 text-primary-400'
                            : 'border-transparent text-dark-400 hover:text-dark-200 hover:border-dark-600'
                          }`
                        }>
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                          Comments
                        </Tab>
                        <Tab className={({ selected }) =>
                          `pb-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2
                          ${selected
                            ? 'border-primary-500 text-primary-400'
                            : 'border-transparent text-dark-400 hover:text-dark-200 hover:border-dark-600'
                          }`
                        }>
                          <ClockIcon className="w-4 h-4" />
                          History
                        </Tab>
                      </Tab.List>
                      <Tab.Panels>
                        {/* Comments Panel */}
                        <Tab.Panel>
                          <div className="space-y-4 min-h-[200px]">
                            <div className="text-center py-12">
                              <p className="text-dark-400">Comments feature coming soon</p>
                            </div>
                          </div>
                        </Tab.Panel>
                        
                        {/* History Panel */}
                        <Tab.Panel>
                          {loadingHistory ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : history.length === 0 ? (
                            <div className="text-center py-12">
                              <p className="text-dark-400">No history available</p>
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                              {history.map((entry) => (
                                <div 
                                  key={entry.id} 
                                  className="flex gap-4 p-4 bg-dark-800/50 rounded-lg border border-dark-700/50 hover:border-dark-600/50 transition-colors"
                                >
                                  {/* Icon */}
                                  <div className={classNames(
                                    "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border",
                                    getEventColor(entry.event_type)
                                  )}>
                                    {getEventIcon(entry.event_type)}
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <div className="flex-1">
                                        <p className="font-semibold text-dark-100 text-sm">
                                          {getEventLabel(entry.event_type)}
                                        </p>
                                        <p className="text-xs text-dark-400 mt-0.5">
                                          by {entry.actor_name || 'System'}
                                        </p>
                                      </div>
                                      <time className="text-xs text-dark-500 whitespace-nowrap">
                                        {formatDateTimeLocal(entry.occurred_at)}
                                      </time>
                                    </div>
                                    
                                    {/* Changes */}
                                    {formatHistoryEntry(entry).length > 0 && (
                                      <div className="mt-3 pt-3 border-t border-dark-700/50">
                                        <div className="space-y-3">
                                          {formatHistoryEntry(entry).map((change, idx) => {
                                            const oldIsLong = isLongText(change.oldValue);
                                            const newIsLong = isLongText(change.newValue);
                                            const anyLong = oldIsLong || newIsLong;
                                            const isSummary = change.field === 'summary';
                                            
                                            return (
                                              <div key={idx} className="space-y-2">
                                                <p className="text-xs font-medium text-dark-400 uppercase tracking-wide">
                                                  {change.field}
                                                </p>
                                                
                                                {anyLong ? (
                                                  // Stacked layout for long text
                                                  <div className="space-y-2">
                                                    <div className="bg-red-900/10 border border-red-800/30 rounded p-2">
                                                      <p className="text-[10px] font-medium text-red-400 mb-1 uppercase tracking-wide">Old</p>
                                                      {isSummary && change.oldValue ? (
                                                        <div className="prose prose-invert prose-xs max-w-none text-dark-300">
                                                          <ReactMarkdown
                                                            components={{
                                                              h1: ({node, ...props}) => <h1 className="text-sm font-bold text-dark-100 mt-2 mb-1" {...props} />,
                                                              h2: ({node, ...props}) => <h2 className="text-xs font-semibold text-dark-100 mt-2 mb-1" {...props} />,
                                                              h3: ({node, ...props}) => <h3 className="text-xs font-semibold text-dark-100 mt-1 mb-1" {...props} />,
                                                              p: ({node, ...props}) => <p className="text-xs text-dark-300 mb-1" {...props} />,
                                                              ul: ({node, ...props}) => <ul className="list-disc list-inside text-dark-300 mb-1 space-y-0.5 text-xs" {...props} />,
                                                              ol: ({node, ...props}) => <ol className="list-decimal list-inside text-dark-300 mb-1 space-y-0.5 text-xs" {...props} />,
                                                              li: ({node, ...props}) => <li className="text-dark-300 text-xs" {...props} />,
                                                              code: ({node, inline, ...props}) => 
                                                                inline 
                                                                  ? <code className="bg-dark-900 px-1 py-0.5 rounded text-primary-400 text-[10px]" {...props} />
                                                                  : <code className="block bg-dark-900 p-2 rounded text-primary-400 text-[10px] overflow-x-auto mb-1" {...props} />,
                                                              pre: ({node, ...props}) => <pre className="bg-dark-900 p-2 rounded overflow-x-auto mb-1" {...props} />,
                                                              blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-dark-600 pl-2 italic text-dark-400 mb-1 text-xs" {...props} />,
                                                              hr: ({node, ...props}) => <hr className="border-dark-700 my-2" {...props} />,
                                                              strong: ({node, ...props}) => <strong className="font-semibold text-dark-100" {...props} />,
                                                              em: ({node, ...props}) => <em className="italic text-dark-300" {...props} />,
                                                              a: ({node, ...props}) => <a className="text-primary-400 hover:text-primary-300 underline" {...props} />,
                                                            }}
                                                          >
                                                            {String(change.oldValue)}
                                                          </ReactMarkdown>
                                                        </div>
                                                      ) : (
                                                        <p className="text-xs text-dark-300 whitespace-pre-wrap break-words">
                                                          {formatValue(change.oldValue, true)}
                                                        </p>
                                                      )}
                                                    </div>
                                                    <div className="bg-green-900/10 border border-green-800/30 rounded p-2">
                                                      <p className="text-[10px] font-medium text-green-400 mb-1 uppercase tracking-wide">New</p>
                                                      {isSummary && change.newValue ? (
                                                        <div className="prose prose-invert prose-xs max-w-none text-dark-300">
                                                          <ReactMarkdown
                                                            components={{
                                                              h1: ({node, ...props}) => <h1 className="text-sm font-bold text-dark-100 mt-2 mb-1" {...props} />,
                                                              h2: ({node, ...props}) => <h2 className="text-xs font-semibold text-dark-100 mt-2 mb-1" {...props} />,
                                                              h3: ({node, ...props}) => <h3 className="text-xs font-semibold text-dark-100 mt-1 mb-1" {...props} />,
                                                              p: ({node, ...props}) => <p className="text-xs text-dark-300 mb-1" {...props} />,
                                                              ul: ({node, ...props}) => <ul className="list-disc list-inside text-dark-300 mb-1 space-y-0.5 text-xs" {...props} />,
                                                              ol: ({node, ...props}) => <ol className="list-decimal list-inside text-dark-300 mb-1 space-y-0.5 text-xs" {...props} />,
                                                              li: ({node, ...props}) => <li className="text-dark-300 text-xs" {...props} />,
                                                              code: ({node, inline, ...props}) => 
                                                                inline 
                                                                  ? <code className="bg-dark-900 px-1 py-0.5 rounded text-primary-400 text-[10px]" {...props} />
                                                                  : <code className="block bg-dark-900 p-2 rounded text-primary-400 text-[10px] overflow-x-auto mb-1" {...props} />,
                                                              pre: ({node, ...props}) => <pre className="bg-dark-900 p-2 rounded overflow-x-auto mb-1" {...props} />,
                                                              blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-dark-600 pl-2 italic text-dark-400 mb-1 text-xs" {...props} />,
                                                              hr: ({node, ...props}) => <hr className="border-dark-700 my-2" {...props} />,
                                                              strong: ({node, ...props}) => <strong className="font-semibold text-dark-100" {...props} />,
                                                              em: ({node, ...props}) => <em className="italic text-dark-300" {...props} />,
                                                              a: ({node, ...props}) => <a className="text-primary-400 hover:text-primary-300 underline" {...props} />,
                                                            }}
                                                          >
                                                            {String(change.newValue)}
                                                          </ReactMarkdown>
                                                        </div>
                                                      ) : (
                                                        <p className="text-xs text-dark-300 whitespace-pre-wrap break-words">
                                                          {formatValue(change.newValue, true)}
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>
                                                ) : (
                                                  // Side-by-side layout for short text
                                                  <div className="grid grid-cols-2 gap-2">
                                                    <div className="bg-red-900/10 border border-red-800/30 rounded p-2">
                                                      <p className="text-[10px] font-medium text-red-400 mb-1 uppercase tracking-wide">Old</p>
                                                      {isSummary && change.oldValue ? (
                                                        <div className="prose prose-invert prose-xs max-w-none text-dark-300">
                                                          <ReactMarkdown
                                                            components={{
                                                              h1: ({node, ...props}) => <h1 className="text-sm font-bold text-dark-100 mt-2 mb-1" {...props} />,
                                                              h2: ({node, ...props}) => <h2 className="text-xs font-semibold text-dark-100 mt-2 mb-1" {...props} />,
                                                              h3: ({node, ...props}) => <h3 className="text-xs font-semibold text-dark-100 mt-1 mb-1" {...props} />,
                                                              p: ({node, ...props}) => <p className="text-xs text-dark-300 mb-1" {...props} />,
                                                              ul: ({node, ...props}) => <ul className="list-disc list-inside text-dark-300 mb-1 space-y-0.5 text-xs" {...props} />,
                                                              ol: ({node, ...props}) => <ol className="list-decimal list-inside text-dark-300 mb-1 space-y-0.5 text-xs" {...props} />,
                                                              li: ({node, ...props}) => <li className="text-dark-300 text-xs" {...props} />,
                                                              code: ({node, inline, ...props}) => 
                                                                inline 
                                                                  ? <code className="bg-dark-900 px-1 py-0.5 rounded text-primary-400 text-[10px]" {...props} />
                                                                  : <code className="block bg-dark-900 p-2 rounded text-primary-400 text-[10px] overflow-x-auto mb-1" {...props} />,
                                                              pre: ({node, ...props}) => <pre className="bg-dark-900 p-2 rounded overflow-x-auto mb-1" {...props} />,
                                                              blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-dark-600 pl-2 italic text-dark-400 mb-1 text-xs" {...props} />,
                                                              hr: ({node, ...props}) => <hr className="border-dark-700 my-2" {...props} />,
                                                              strong: ({node, ...props}) => <strong className="font-semibold text-dark-100" {...props} />,
                                                              em: ({node, ...props}) => <em className="italic text-dark-300" {...props} />,
                                                              a: ({node, ...props}) => <a className="text-primary-400 hover:text-primary-300 underline" {...props} />,
                                                            }}
                                                          >
                                                            {String(change.oldValue)}
                                                          </ReactMarkdown>
                                                        </div>
                                                      ) : (
                                                        <p className="text-xs text-dark-300 break-words">
                                                          {formatValue(change.oldValue, true)}
                                                        </p>
                                                      )}
                                                    </div>
                                                    <div className="bg-green-900/10 border border-green-800/30 rounded p-2">
                                                      <p className="text-[10px] font-medium text-green-400 mb-1 uppercase tracking-wide">New</p>
                                                      {isSummary && change.newValue ? (
                                                        <div className="prose prose-invert prose-xs max-w-none text-dark-300">
                                                          <ReactMarkdown
                                                            components={{
                                                              h1: ({node, ...props}) => <h1 className="text-sm font-bold text-dark-100 mt-2 mb-1" {...props} />,
                                                              h2: ({node, ...props}) => <h2 className="text-xs font-semibold text-dark-100 mt-2 mb-1" {...props} />,
                                                              h3: ({node, ...props}) => <h3 className="text-xs font-semibold text-dark-100 mt-1 mb-1" {...props} />,
                                                              p: ({node, ...props}) => <p className="text-xs text-dark-300 mb-1" {...props} />,
                                                              ul: ({node, ...props}) => <ul className="list-disc list-inside text-dark-300 mb-1 space-y-0.5 text-xs" {...props} />,
                                                              ol: ({node, ...props}) => <ol className="list-decimal list-inside text-dark-300 mb-1 space-y-0.5 text-xs" {...props} />,
                                                              li: ({node, ...props}) => <li className="text-dark-300 text-xs" {...props} />,
                                                              code: ({node, inline, ...props}) => 
                                                                inline 
                                                                  ? <code className="bg-dark-900 px-1 py-0.5 rounded text-primary-400 text-[10px]" {...props} />
                                                                  : <code className="block bg-dark-900 p-2 rounded text-primary-400 text-[10px] overflow-x-auto mb-1" {...props} />,
                                                              pre: ({node, ...props}) => <pre className="bg-dark-900 p-2 rounded overflow-x-auto mb-1" {...props} />,
                                                              blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-dark-600 pl-2 italic text-dark-400 mb-1 text-xs" {...props} />,
                                                              hr: ({node, ...props}) => <hr className="border-dark-700 my-2" {...props} />,
                                                              strong: ({node, ...props}) => <strong className="font-semibold text-dark-100" {...props} />,
                                                              em: ({node, ...props}) => <em className="italic text-dark-300" {...props} />,
                                                              a: ({node, ...props}) => <a className="text-primary-400 hover:text-primary-300 underline" {...props} />,
                                                            }}
                                                          >
                                                            {String(change.newValue)}
                                                          </ReactMarkdown>
                                                        </div>
                                                      ) : (
                                                        <p className="text-xs text-dark-300 break-words">
                                                          {formatValue(change.newValue, true)}
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Tab.Panel>
                      </Tab.Panels>
                    </Tab.Group>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-between pt-6 border-t border-dark-800 mt-6">
                      <div className="flex gap-3">
                        {internalTask.status === TASK_STATUS.ARCHIVE && (
                          <button
                            type="button"
                            onClick={handleRestore}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                          >
                            Restore Task
                          </button>
                        )}
                        {internalTask.status === TASK_STATUS.DONE && (
                          <button
                            type="button"
                            onClick={handleArchive}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                          >
                            Archive Task
                          </button>
                        )}
                        {internalTask.status !== TASK_STATUS.ARCHIVE && (
                          <button
                            type="button"
                            onClick={handleDelete}
                            className="px-4 py-2 text-red-500 hover:text-red-400 font-medium transition-colors"
                          >
                            Delete Task
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}

                {/* Edit Mode Form */}
                {mode === 'edit' && (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-3 gap-6">
                    {/* Main Column - Title and Description */}
                    <div className="col-span-2 space-y-4">
                      {/* Title */}
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-dark-300 mb-2">
                          Title *
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          required
                          value={formData.title}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="Enter task title"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-dark-300 mb-2">
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          rows={12}
                          value={formData.description}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="Enter task description (supports Markdown)"
                        />
                      </div>

                      {/* Tags */}
                      <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-dark-300 mb-2">
                          Tags
                        </label>
                        <input
                          type="text"
                          id="tags"
                          name="tags"
                          value={formData.tags}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="Enter tags separated by commas"
                        />
                      </div>
                    </div>
                    
                    {/* Right Column - Metadata */}
                    <div className="space-y-4">
                      <div className="bg-dark-800 p-4 rounded-lg space-y-4">
                        {/* Status */}
                        <div>
                          <label htmlFor="status" className="block text-xs font-medium text-dark-500 mb-2 uppercase tracking-wider">
                            Status
                          </label>
                          <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="input-field"
                            disabled={internalTask && internalTask.status === TASK_STATUS.ARCHIVE}
                          >
                            <option value={TASK_STATUS.PLANNING}>Planning</option>
                            <option value={TASK_STATUS.TODO}>To Do</option>
                            <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
                            <option value={TASK_STATUS.DONE}>Done</option>
                          </select>
                        </div>

                        {/* Priority */}
                        <div className="border-t border-dark-700 pt-4">
                          <label htmlFor="priority" className="block text-xs font-medium text-dark-500 mb-2 uppercase tracking-wider">
                            Priority
                          </label>
                          <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="input-field"
                          >
                            <option value={TASK_PRIORITY.LOW}>Low</option>
                            <option value={TASK_PRIORITY.MEDIUM}>Medium</option>
                            <option value={TASK_PRIORITY.HIGH}>High</option>
                          </select>
                        </div>

                        {/* Type */}
                        <div className="border-t border-dark-700 pt-4">
                          <label htmlFor="type" className="block text-xs font-medium text-dark-500 mb-2 uppercase tracking-wider">
                            Type
                          </label>
                          <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="input-field"
                          >
                            <option value={TASK_TYPE.TASK}>Task</option>
                            <option value={TASK_TYPE.BUG}>Bug</option>
                            <option value={TASK_TYPE.FEATURE}>Feature</option>
                            <option value={TASK_TYPE.IMPROVEMENT}>Improvement</option>
                            <option value={TASK_TYPE.RESEARCH}>Research</option>
                          </select>
                        </div>

                        {/* Due Date */}
                        <div className="border-t border-dark-700 pt-4">
                          <label htmlFor="dueDate" className="block text-xs font-medium text-dark-500 mb-2 uppercase tracking-wider">
                            Due Date
                          </label>
                          <input
                            type="date"
                            id="dueDate"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            className="input-field"
                          />
                        </div>

                        {/* Assignee */}
                        <div className="border-t border-dark-700 pt-4">
                          <label htmlFor="assignee_id" className="block text-xs font-medium text-dark-500 mb-2 uppercase tracking-wider">
                            Assignee
                          </label>
                          <select
                            id="assignee_id"
                            name="assignee_id"
                            value={formData.assignee_id}
                            onChange={handleChange}
                            className="input-field"
                          >
                            <option value="">None</option>
                            {loadingUsers ? (
                              <option disabled>Loading users...</option>
                            ) : (
                              users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name} {user.email ? `(${user.email})` : ''}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                        
                        {/* Reporter (read-only in edit mode) */}
                        {internalTask && (
                          <div className="border-t border-dark-700 pt-4">
                            <label className="block text-xs font-medium text-dark-500 mb-1 uppercase tracking-wider">Reporter</label>
                            <p className="text-dark-300 text-sm">{internalTask.reporter_name || 'Not set'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  
                  {/* Archive Notices */}
                  {internalTask && internalTask.status === TASK_STATUS.DONE && (
                    <div className="col-span-3 p-3 bg-blue-900/20 border border-blue-800 rounded-lg mt-4">
                      <p className="text-sm text-blue-300">
                        This task is marked as Done. It will be automatically archived after 7 days, or you can archive it manually.
                      </p>
                    </div>
                  )}

                  {internalTask && internalTask.status === TASK_STATUS.ARCHIVE && (
                    <div className="col-span-3 p-3 bg-dark-800 border border-dark-700 rounded-lg mt-4">
                      <p className="text-sm text-dark-300">
                        This task is archived. You can restore it to move it back to Done status.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="col-span-3 flex items-center justify-between pt-6 border-t border-dark-800 mt-6">
                    <div className="flex gap-3">
                      {internalTask && internalTask.status !== TASK_STATUS.ARCHIVE && (
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="px-4 py-2 text-red-500 hover:text-red-400 font-medium transition-colors"
                        >
                          Delete Task
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {internalTask && (
                        <button
                          type="button"
                          onClick={() => setMode('view')}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      )}
                      {!internalTask && (
                        <button
                          type="button"
                          onClick={onClose}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      )}
                      {internalTask?.status !== TASK_STATUS.ARCHIVE && (
                        <button
                          type="submit"
                          className="btn-primary"
                        >
                          {internalTask ? 'Update Task' : 'Create Task'}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
