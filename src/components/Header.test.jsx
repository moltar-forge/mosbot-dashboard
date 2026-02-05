import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';

describe('Header', () => {
  it('renders title', () => {
    render(<Header title="Test Title" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<Header title="Title" subtitle="Subtitle text" />);

    expect(screen.getByText('Subtitle text')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<Header title="Title" />);

    expect(screen.queryByText(/Subtitle/)).not.toBeInTheDocument();
  });

  it('renders create task button when onCreateTask is provided', () => {
    const mockOnCreateTask = vi.fn();
    render(<Header title="Title" onCreateTask={mockOnCreateTask} />);

    expect(screen.getByText('New Task')).toBeInTheDocument();
  });

  it('calls onCreateTask when create button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnCreateTask = vi.fn();
    render(<Header title="Title" onCreateTask={mockOnCreateTask} />);

    const createButton = screen.getByText('New Task');
    await user.click(createButton);

    expect(mockOnCreateTask).toHaveBeenCalledTimes(1);
  });

  it('does not render create button when onCreateTask is not provided', () => {
    render(<Header title="Title" />);

    expect(screen.queryByText('New Task')).not.toBeInTheDocument();
  });

  it('renders search input when onSearchChange is provided', () => {
    const mockOnSearchChange = vi.fn();
    render(<Header title="Title" onSearchChange={mockOnSearchChange} />);

    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
  });

  it('calls onSearchChange when search input changes', async () => {
    const user = userEvent.setup();
    const mockOnSearchChange = vi.fn();
    render(<Header title="Title" onSearchChange={mockOnSearchChange} />);

    const searchInput = screen.getByPlaceholderText('Search tasks...');
    await user.type(searchInput, 'test');

    expect(mockOnSearchChange).toHaveBeenCalled();
  });

  it('displays search value', () => {
    const mockOnSearchChange = vi.fn();
    render(
      <Header
        title="Title"
        searchValue="current search"
        onSearchChange={mockOnSearchChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search tasks...');
    expect(searchInput).toHaveValue('current search');
  });

  it('uses empty string for search value when not provided', () => {
    const mockOnSearchChange = vi.fn();
    render(<Header title="Title" onSearchChange={mockOnSearchChange} />);

    const searchInput = screen.getByPlaceholderText('Search tasks...');
    expect(searchInput).toHaveValue('');
  });

  it('does not render search input when onSearchChange is not provided', () => {
    render(<Header title="Title" />);

    expect(screen.queryByPlaceholderText('Search tasks...')).not.toBeInTheDocument();
  });

  it('renders both search and create button when both props provided', () => {
    const mockOnCreateTask = vi.fn();
    const mockOnSearchChange = vi.fn();
    render(
      <Header
        title="Title"
        onCreateTask={mockOnCreateTask}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('New Task')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
  });
});
