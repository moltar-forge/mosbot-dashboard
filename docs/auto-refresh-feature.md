# Auto-Refresh Feature

## Overview

The dashboard now includes automatic and manual refresh capabilities to ensure users always see the latest task updates without needing to reload the page.

## Features

### 1. Manual Refresh Button

A refresh button in the header allows users to manually fetch the latest data.

**Location**: Header component, next to the search bar

**Behavior**:

- Click to immediately refresh all tasks
- Shows spinning animation during refresh
- Disabled while refresh is in progress
- Hover effect rotates icon 180°

**Visual Feedback**:

- Spinning icon during refresh
- "Updated X ago" timestamp shows when data was last fetched
- Disabled state prevents double-clicks

### 2. Automatic Background Polling

Tasks are automatically refreshed every 30 seconds in the background.

**Polling Interval**: 30 seconds (configurable in `Dashboard.jsx`)

**Behavior**:

- Silent refresh using `isRefreshing` flag (doesn't show main loading spinner)
- Continues while user is on the page
- Stops when user navigates away
- Subtle progress bar appears at top of board during background refresh

**Visual Feedback**:

- Thin blue progress bar at top of Kanban board
- "Updated X ago" timestamp updates automatically
- No disruption to user workflow

### 3. Tab Visibility Detection

Automatically refreshes when user returns to the tab.

**Behavior**:

- Detects when browser tab becomes visible again
- Triggers immediate refresh
- Ensures data is fresh when user returns

**Use Cases**:

- User switches to another tab and comes back
- User minimizes browser and reopens
- User switches to another window and returns

### 4. Post-Mutation Refresh

Automatically refreshes after create, update, or delete operations.

**Behavior**:

- 500ms delay after mutation completes
- Silent background refresh
- Ensures UI shows latest server state

**Triggers**:

- After creating a new task
- After updating a task
- After deleting a task
- After moving a task (drag & drop)

## Implementation Details

### Store Changes (`taskStore.js`)

```javascript
{
  tasks: [],
  isLoading: false,        // User-initiated loading
  isRefreshing: false,     // Background refresh loading
  lastFetchedAt: null,     // Timestamp of last fetch
  
  fetchTasks: async (options = {}) => {
    // Can be called with { silent: true } for background refresh
  },
  
  refreshTasks: async () => {
    // Alias for silent fetch
  }
}
```

### Dashboard Changes (`Dashboard.jsx`)

**Polling Setup**:

```javascript
const POLLING_INTERVAL = 30000; // 30 seconds

useEffect(() => {
  const interval = setInterval(() => {
    refreshTasks();
  }, POLLING_INTERVAL);
  
  return () => clearInterval(interval);
}, [refreshTasks]);
```

**Visibility Detection**:

```javascript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      refreshTasks();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [refreshTasks]);
```

### Header Changes (`Header.jsx`)

**Refresh Button**:

- Uses `ArrowPathIcon` from Heroicons
- Shows spinning animation during refresh
- Displays "Updated X ago" timestamp
- Disabled during refresh operations

**Timestamp Display**:

- "Just now" for < 1 minute
- "Xm ago" for < 1 hour
- "Xh ago" for >= 1 hour

### KanbanBoard Changes (`KanbanBoard.jsx`)

**Visual Indicator**:

- Thin blue progress bar at top during background refresh
- Uses `isRefreshing` flag from store
- Doesn't block user interactions

## Configuration

### Adjust Polling Interval

Edit `POLLING_INTERVAL` in `Dashboard.jsx`:

```javascript
const POLLING_INTERVAL = 30000; // Change to desired milliseconds
```

**Recommended values**:

- 15000 (15s) - High-frequency updates
- 30000 (30s) - Default, balanced
- 60000 (60s) - Low-frequency updates

### Disable Auto-Polling

Comment out the polling `useEffect` in `Dashboard.jsx`:

```javascript
// useEffect(() => {
//   pollingIntervalRef.current = setInterval(() => {
//     refreshTasks();
//   }, POLLING_INTERVAL);
//   
//   return () => {
//     if (pollingIntervalRef.current) {
//       clearInterval(pollingIntervalRef.current);
//     }
//   };
// }, [refreshTasks]);
```

### Adjust Post-Mutation Delay

Edit the timeout in `taskStore.js` mutation methods:

```javascript
setTimeout(() => get().refreshTasks(), 500); // Change 500 to desired ms
```

## User Experience

### Benefits

1. **Always Up-to-Date**: Users see latest changes from other team members
2. **No Manual Reload**: Eliminates need to refresh browser
3. **Unobtrusive**: Background updates don't interrupt workflow
4. **Responsive**: Manual refresh available when needed
5. **Smart**: Refreshes when tab becomes visible again

### Performance Considerations

1. **Silent Refresh**: Background updates use `isRefreshing` flag instead of `isLoading`
2. **Minimal UI Disruption**: Subtle progress bar instead of full loading spinner
3. **Optimized Timing**: 30-second interval balances freshness with server load
4. **Smart Triggers**: Only refreshes when needed (visibility change, post-mutation)

## Testing

### Manual Testing

1. **Manual Refresh**:
   - Click refresh button
   - Verify spinning animation
   - Check timestamp updates

2. **Auto-Polling**:
   - Wait 30 seconds
   - Verify subtle progress bar appears
   - Check timestamp updates

3. **Tab Visibility**:
   - Switch to another tab
   - Wait a few seconds
   - Switch back
   - Verify refresh triggers

4. **Post-Mutation**:
   - Create/update/delete a task
   - Wait 500ms
   - Verify background refresh occurs

### Automated Testing

Add tests for:

- `fetchTasks({ silent: true })` behavior
- `refreshTasks()` calls `fetchTasks` with silent flag
- Polling interval setup and cleanup
- Visibility change event listener
- Post-mutation refresh triggers

## Troubleshooting

### Issue: Refresh button not working

**Check**:

- Console for API errors
- Network tab for failed requests
- `onRefresh` prop passed to Header

### Issue: Auto-polling not working

**Check**:

- Polling interval is set correctly
- `useEffect` cleanup is working
- `refreshTasks` is defined in store

### Issue: Timestamp not updating

**Check**:

- `lastFetchedAt` is being set in store
- `getLastUpdatedText()` logic is correct
- Component is re-rendering on state change

### Issue: Background refresh too frequent

**Solution**:

- Increase `POLLING_INTERVAL` value
- Consider disabling auto-polling
- Add debouncing logic

## Future Enhancements

### WebSocket Support

Replace polling with WebSocket for real-time updates:

```javascript
// In Dashboard.jsx
useEffect(() => {
  const ws = new WebSocket('ws://api.example.com/tasks');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'task_updated') {
      refreshTasks();
    }
  };
  
  return () => ws.close();
}, []);
```

### Smart Polling

Adjust polling frequency based on user activity:

```javascript
const [pollingInterval, setPollingInterval] = useState(30000);

// Slow down when user is idle
useEffect(() => {
  let idleTimer;
  
  const resetIdleTimer = () => {
    clearTimeout(idleTimer);
    setPollingInterval(30000); // Fast polling
    
    idleTimer = setTimeout(() => {
      setPollingInterval(60000); // Slow polling after 5 min idle
    }, 300000);
  };
  
  window.addEventListener('mousemove', resetIdleTimer);
  window.addEventListener('keypress', resetIdleTimer);
  
  return () => {
    window.removeEventListener('mousemove', resetIdleTimer);
    window.removeEventListener('keypress', resetIdleTimer);
  };
}, []);
```

### Optimistic Updates with Conflict Resolution

Show immediate updates, then sync with server:

```javascript
updateTask: async (taskId, updates) => {
  // Optimistic update
  set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
  }));
  
  try {
    const response = await api.patch(`/tasks/${taskId}`, updates);
    // Replace with server version
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? response.data.data : t)
    }));
  } catch (error) {
    // Revert on error
    await get().refreshTasks();
    throw error;
  }
}
```

### Selective Refresh

Only refresh changed tasks instead of full list:

```javascript
// API endpoint: GET /tasks/changes?since=timestamp
refreshChanges: async () => {
  const { lastFetchedAt } = get();
  const response = await api.get(`/tasks/changes?since=${lastFetchedAt}`);
  
  set((state) => {
    const updatedTasks = [...state.tasks];
    response.data.data.forEach(changedTask => {
      const index = updatedTasks.findIndex(t => t.id === changedTask.id);
      if (index >= 0) {
        updatedTasks[index] = changedTask;
      } else {
        updatedTasks.push(changedTask);
      }
    });
    
    return { tasks: updatedTasks, lastFetchedAt: Date.now() };
  });
}
```

## Related Files

- `src/stores/taskStore.js` - Task state management and refresh logic
- `src/pages/Dashboard.jsx` - Polling and visibility detection
- `src/components/Header.jsx` - Manual refresh button and timestamp
- `src/components/KanbanBoard.jsx` - Background refresh visual indicator
- `docs/performance-patterns.mdc` - Performance optimization patterns
- `docs/state-management.mdc` - Zustand store patterns
