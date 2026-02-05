import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaskStore } from './taskStore';
import { api } from '../api/client';
import logger from '../utils/logger';

// Mock the API client
vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('taskStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useTaskStore.setState({
      tasks: [],
      isLoading: false,
      error: null,
      searchQuery: '',
    });
  });

  describe('fetchTasks', () => {
    it('successfully fetches all tasks', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', status: 'todo' },
        { id: 2, title: 'Task 2', status: 'in-progress' },
      ];

      api.get.mockResolvedValue({
        data: {
          data: mockTasks,
          pagination: { page: 1, limit: 10, total: 2 },
        },
      });

      await useTaskStore.getState().fetchTasks();

      expect(api.get).toHaveBeenCalledWith('/tasks');
      expect(useTaskStore.getState().tasks).toEqual(mockTasks);
      expect(useTaskStore.getState().isLoading).toBe(false);
      expect(useTaskStore.getState().error).toBeNull();
    });

    it('handles empty task list', async () => {
      api.get.mockResolvedValue({
        data: {
          data: [],
          pagination: { page: 1, limit: 10, total: 0 },
        },
      });

      await useTaskStore.getState().fetchTasks();

      expect(useTaskStore.getState().tasks).toEqual([]);
      expect(useTaskStore.getState().isLoading).toBe(false);
    });

    it('handles fetch error', async () => {
      const error = new Error('Failed to fetch tasks');
      api.get.mockRejectedValue(error);

      await useTaskStore.getState().fetchTasks();

      expect(useTaskStore.getState().error).toBe('Failed to fetch tasks');
      expect(useTaskStore.getState().isLoading).toBe(false);
      expect(useTaskStore.getState().tasks).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch tasks', error);
    });

    it('sets loading state during fetch', async () => {
      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      api.get.mockReturnValue(promise);

      const fetchPromise = useTaskStore.getState().fetchTasks();
      expect(useTaskStore.getState().isLoading).toBe(true);

      resolvePromise({
        data: {
          data: [],
          pagination: {},
        },
      });

      await fetchPromise;
      expect(useTaskStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchTaskById', () => {
    it('successfully fetches a single task', async () => {
      const mockTask = { id: 1, title: 'Task 1', status: 'todo' };

      api.get.mockResolvedValue({
        data: {
          data: mockTask,
        },
      });

      const result = await useTaskStore.getState().fetchTaskById(1);

      expect(api.get).toHaveBeenCalledWith('/tasks/1');
      expect(result).toEqual(mockTask);
      expect(useTaskStore.getState().tasks).toContainEqual(mockTask);
      expect(useTaskStore.getState().isLoading).toBe(false);
    });

    it('updates existing task in store', async () => {
      const existingTask = { id: 1, title: 'Old Title', status: 'todo' };
      useTaskStore.setState({ tasks: [existingTask] });

      const updatedTask = { id: 1, title: 'New Title', status: 'in-progress' };

      api.get.mockResolvedValue({
        data: {
          data: updatedTask,
        },
      });

      await useTaskStore.getState().fetchTaskById(1);

      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual(updatedTask);
    });

    it('handles fetch error and throws', async () => {
      const error = new Error('Task not found');
      api.get.mockRejectedValue(error);

      await expect(useTaskStore.getState().fetchTaskById(999)).rejects.toThrow();

      expect(useTaskStore.getState().error).toBe('Task not found');
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch task', error);
    });
  });

  describe('createTask', () => {
    it('successfully creates a new task', async () => {
      const newTaskData = { title: 'New Task', description: 'Description' };
      const createdTask = { id: 1, ...newTaskData, status: 'todo' };

      api.post.mockResolvedValue({
        data: {
          data: createdTask,
        },
      });

      const result = await useTaskStore.getState().createTask(newTaskData);

      expect(api.post).toHaveBeenCalledWith('/tasks', newTaskData);
      expect(result).toEqual(createdTask);
      expect(useTaskStore.getState().tasks).toContainEqual(createdTask);
      expect(useTaskStore.getState().isLoading).toBe(false);
    });

    it('handles create error and throws', async () => {
      const error = new Error('Failed to create task');
      api.post.mockRejectedValue(error);

      await expect(
        useTaskStore.getState().createTask({ title: 'Task' })
      ).rejects.toThrow();

      expect(useTaskStore.getState().error).toBe('Failed to create task');
      expect(logger.error).toHaveBeenCalledWith('Failed to create task', error);
    });
  });

  describe('updateTask', () => {
    it('successfully updates a task', async () => {
      const existingTask = { id: 1, title: 'Old Title', status: 'todo' };
      useTaskStore.setState({ tasks: [existingTask] });

      const updates = { title: 'New Title' };
      const updatedTask = { ...existingTask, ...updates };

      api.patch.mockResolvedValue({
        data: {
          data: updatedTask,
        },
      });

      const result = await useTaskStore.getState().updateTask(1, updates);

      expect(api.patch).toHaveBeenCalledWith('/tasks/1', updates);
      expect(result).toEqual(updatedTask);
      expect(useTaskStore.getState().tasks[0]).toEqual(updatedTask);
      expect(useTaskStore.getState().isLoading).toBe(false);
    });

    it('handles update error and throws', async () => {
      const error = new Error('Failed to update task');
      api.patch.mockRejectedValue(error);

      await expect(
        useTaskStore.getState().updateTask(1, { title: 'New' })
      ).rejects.toThrow();

      expect(useTaskStore.getState().error).toBe('Failed to update task');
      expect(logger.error).toHaveBeenCalledWith('Failed to update task', error);
    });
  });

  describe('deleteTask', () => {
    it('successfully deletes a task', async () => {
      const task1 = { id: 1, title: 'Task 1' };
      const task2 = { id: 2, title: 'Task 2' };
      useTaskStore.setState({ tasks: [task1, task2] });

      api.delete.mockResolvedValue({});

      await useTaskStore.getState().deleteTask(1);

      expect(api.delete).toHaveBeenCalledWith('/tasks/1');
      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(useTaskStore.getState().tasks[0]).toEqual(task2);
      expect(useTaskStore.getState().isLoading).toBe(false);
    });

    it('handles delete error and throws', async () => {
      const error = new Error('Failed to delete task');
      api.delete.mockRejectedValue(error);

      await expect(useTaskStore.getState().deleteTask(1)).rejects.toThrow();

      expect(useTaskStore.getState().error).toBe('Failed to delete task');
      expect(logger.error).toHaveBeenCalledWith('Failed to delete task', error);
    });
  });

  describe('moveTask', () => {
    it('successfully moves a task to different status', async () => {
      const task = { id: 1, title: 'Task 1', status: 'todo' };
      useTaskStore.setState({ tasks: [task] });

      api.patch.mockResolvedValue({
        data: {
          data: { ...task, status: 'in-progress' },
        },
      });

      await useTaskStore.getState().moveTask(1, 'in-progress');

      expect(api.patch).toHaveBeenCalledWith('/tasks/1', { status: 'in-progress' });
      expect(useTaskStore.getState().tasks[0].status).toBe('in-progress');
    });

    it('performs optimistic update before API call', async () => {
      const task = { id: 1, title: 'Task 1', status: 'todo' };
      useTaskStore.setState({ tasks: [task] });

      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      api.patch.mockReturnValue(promise);

      const movePromise = useTaskStore.getState().moveTask(1, 'in-progress');

      // Check optimistic update happened immediately
      expect(useTaskStore.getState().tasks[0].status).toBe('in-progress');

      resolvePromise({
        data: {
          data: { ...task, status: 'in-progress' },
        },
      });

      await movePromise;
    });

    it('reverts optimistic update on error', async () => {
      const task = { id: 1, title: 'Task 1', status: 'todo' };
      useTaskStore.setState({ tasks: [task] });

      const error = new Error('Failed to move task');
      api.patch.mockRejectedValue(error);

      await useTaskStore.getState().moveTask(1, 'in-progress');

      // Should revert to original status
      expect(useTaskStore.getState().tasks[0].status).toBe('todo');
      expect(useTaskStore.getState().error).toBe('Failed to move task');
      expect(logger.error).toHaveBeenCalledWith('Failed to move task', error);
    });

    it('does nothing if task not found', async () => {
      useTaskStore.setState({ tasks: [] });

      await useTaskStore.getState().moveTask(999, 'in-progress');

      expect(api.patch).not.toHaveBeenCalled();
    });
  });

  describe('getTasksByStatus', () => {
    it('returns tasks filtered by status', () => {
      const tasks = [
        { id: 1, title: 'Task 1', status: 'todo' },
        { id: 2, title: 'Task 2', status: 'in-progress' },
        { id: 3, title: 'Task 3', status: 'todo' },
      ];
      useTaskStore.setState({ tasks });

      const todoTasks = useTaskStore.getState().getTasksByStatus('todo');

      expect(todoTasks).toHaveLength(2);
      expect(todoTasks[0].id).toBe(1);
      expect(todoTasks[1].id).toBe(3);
    });

    it('returns empty array when no tasks match status', () => {
      useTaskStore.setState({ tasks: [] });

      const tasks = useTaskStore.getState().getTasksByStatus('done');

      expect(tasks).toEqual([]);
    });
  });

  describe('setSearchQuery', () => {
    it('sets the search query', () => {
      useTaskStore.getState().setSearchQuery('test query');

      expect(useTaskStore.getState().searchQuery).toBe('test query');
    });
  });

  describe('getFilteredTasks', () => {
    it('returns all tasks when search query is empty', () => {
      const tasks = [
        { id: 1, title: 'Task 1', description: 'Description 1' },
        { id: 2, title: 'Task 2', description: 'Description 2' },
      ];
      useTaskStore.setState({ tasks, searchQuery: '' });

      const filtered = useTaskStore.getState().getFilteredTasks();

      expect(filtered).toEqual(tasks);
    });

    it('returns all tasks when search query is only whitespace', () => {
      const tasks = [
        { id: 1, title: 'Task 1', description: 'Description 1' },
      ];
      useTaskStore.setState({ tasks, searchQuery: '   ' });

      const filtered = useTaskStore.getState().getFilteredTasks();

      expect(filtered).toEqual(tasks);
    });

    it('filters tasks by title', () => {
      const tasks = [
        { id: 1, title: 'Task One', description: 'Description' },
        { id: 2, title: 'Task Two', description: 'Description' },
        { id: 3, title: 'Other', description: 'Description' },
      ];
      useTaskStore.setState({ tasks, searchQuery: 'Task' });

      const filtered = useTaskStore.getState().getFilteredTasks();

      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe(1);
      expect(filtered[1].id).toBe(2);
    });

    it('filters tasks by description', () => {
      const tasks = [
        { id: 1, title: 'Task 1', description: 'Important task' },
        { id: 2, title: 'Task 2', description: 'Regular task' },
      ];
      useTaskStore.setState({ tasks, searchQuery: 'Important' });

      const filtered = useTaskStore.getState().getFilteredTasks();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(1);
    });

    it('filters tasks case-insensitively', () => {
      const tasks = [
        { id: 1, title: 'Task One', description: 'Description' },
        { id: 2, title: 'task two', description: 'Description' },
      ];
      useTaskStore.setState({ tasks, searchQuery: 'TASK' });

      const filtered = useTaskStore.getState().getFilteredTasks();

      expect(filtered).toHaveLength(2);
    });

    it('handles tasks with missing title or description', () => {
      const tasks = [
        { id: 1, title: null, description: 'Description' },
        { id: 2, title: 'Task', description: null },
        { id: 3, title: 'Task', description: 'Description' },
      ];
      useTaskStore.setState({ tasks, searchQuery: 'Task' });

      const filtered = useTaskStore.getState().getFilteredTasks();

      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe(2);
      expect(filtered[1].id).toBe(3);
    });
  });

  describe('fetchTaskHistory', () => {
    it('successfully fetches task history', async () => {
      const mockHistory = [
        { id: 1, taskId: 1, action: 'created', timestamp: '2024-01-01' },
        { id: 2, taskId: 1, action: 'updated', timestamp: '2024-01-02' },
      ];

      api.get.mockResolvedValue({
        data: {
          data: mockHistory,
          pagination: { page: 1, limit: 10, total: 2 },
        },
      });

      const result = await useTaskStore.getState().fetchTaskHistory(1);

      expect(api.get).toHaveBeenCalledWith('/tasks/1/history');
      expect(result).toEqual(mockHistory);
    });

    it('handles empty history', async () => {
      api.get.mockResolvedValue({
        data: {
          data: [],
          pagination: { page: 1, limit: 10, total: 0 },
        },
      });

      const result = await useTaskStore.getState().fetchTaskHistory(1);

      expect(result).toEqual([]);
    });

    it('handles fetch error and throws', async () => {
      const error = new Error('Failed to fetch history');
      api.get.mockRejectedValue(error);

      await expect(useTaskStore.getState().fetchTaskHistory(1)).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith('Failed to fetch task history', error);
    });
  });
});
