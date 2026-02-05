import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { useTaskStore } from '../stores/taskStore';

// Mock stores
vi.mock('../stores/taskStore', () => ({
  useTaskStore: vi.fn(),
}));

// Mock components
vi.mock('../components/KanbanBoard', () => ({
  default: ({ onTaskClick }) => (
    <div data-testid="kanban-board">
      <button onClick={() => onTaskClick({ id: 1, title: 'Test Task' })}>
        Click Task
      </button>
    </div>
  ),
}));

vi.mock('../components/Header', () => ({
  default: ({ title, onCreateTask, searchValue, onSearchChange }) => (
    <div data-testid="header">
      <h1>{title}</h1>
      <button onClick={onCreateTask}>Create Task</button>
      <input
        data-testid="search-input"
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  ),
}));

vi.mock('../components/TaskModal', () => ({
  default: ({ isOpen, onClose, task }) =>
    isOpen ? (
      <div data-testid="task-modal">
        <button onClick={onClose}>Close</button>
        {task ? <div>Editing: {task.title}</div> : <div>Creating new task</div>}
      </div>
    ) : null,
}));

describe('Dashboard', () => {
  const mockFetchTasks = vi.fn();
  const mockSetSearchQuery = vi.fn();
  const mockGetState = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetState.mockReturnValue({ tasks: [] });
    useTaskStore.mockReturnValue({
      fetchTasks: mockFetchTasks,
      isLoading: false,
      error: null,
      searchQuery: '',
      setSearchQuery: mockSetSearchQuery,
      tasks: [],
      getState: mockGetState,
    });
    useTaskStore.getState = mockGetState;
  });

  it('renders dashboard with header', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders kanban board', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
  });

  it('fetches tasks on mount', () => {
    render(<Dashboard />);

    expect(mockFetchTasks).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when loading and no tasks', () => {
    mockGetState.mockReturnValue({ tasks: [] });
    useTaskStore.mockReturnValue({
      fetchTasks: mockFetchTasks,
      isLoading: true,
      error: null,
      searchQuery: '',
      setSearchQuery: mockSetSearchQuery,
      tasks: [],
      getState: mockGetState,
    });
    useTaskStore.getState = mockGetState;

    render(<Dashboard />);

    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  it('does not show loading when tasks exist', () => {
    const tasks = [{ id: 1, title: 'Task 1' }];
    mockGetState.mockReturnValue({ tasks });
    useTaskStore.mockReturnValue({
      fetchTasks: mockFetchTasks,
      isLoading: true,
      error: null,
      searchQuery: '',
      setSearchQuery: mockSetSearchQuery,
      tasks,
      getState: mockGetState,
    });
    useTaskStore.getState = mockGetState;

    render(<Dashboard />);

    expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
  });

  it('shows error state when error occurs', () => {
    useTaskStore.mockReturnValue({
      fetchTasks: mockFetchTasks,
      isLoading: false,
      error: 'Failed to load tasks',
      searchQuery: '',
      setSearchQuery: mockSetSearchQuery,
      tasks: [],
    });

    render(<Dashboard />);

    expect(screen.getByText('Error loading tasks')).toBeInTheDocument();
    expect(screen.getByText('Failed to load tasks')).toBeInTheDocument();
  });

  it('opens modal when create task is clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(<Dashboard />);

    const createButton = screen.getByText('Create Task');
    await user.click(createButton);

    expect(screen.getByTestId('task-modal')).toBeInTheDocument();
    expect(screen.getByText('Creating new task')).toBeInTheDocument();
  });

  it('opens modal with task when task is clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(<Dashboard />);

    const taskButton = screen.getByText('Click Task');
    await user.click(taskButton);

    await waitFor(() => {
      expect(screen.getByTestId('task-modal')).toBeInTheDocument();
      expect(screen.getByText('Editing: Test Task')).toBeInTheDocument();
    });
  });

  it('closes modal when close is clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(<Dashboard />);

    // Open modal
    const createButton = screen.getByText('Create Task');
    await user.click(createButton);

    expect(screen.getByTestId('task-modal')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('task-modal')).not.toBeInTheDocument();
    });
  });

  it('passes search query to header', () => {
    useTaskStore.mockReturnValue({
      fetchTasks: mockFetchTasks,
      isLoading: false,
      error: null,
      searchQuery: 'test query',
      setSearchQuery: mockSetSearchQuery,
      tasks: [],
    });

    render(<Dashboard />);

    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toHaveValue('test query');
  });

  it('updates search query when header search changes', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(<Dashboard />);

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'new search');

    expect(mockSetSearchQuery).toHaveBeenCalled();
  });
});
