import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TaskManagerOverview from './pages/TaskManagerOverview';
import KanbanPage from './pages/KanbanPage';
import OrgChart from './pages/OrgChart';
import Workspace from './pages/Workspace';
import Subagents from './pages/Subagents';
import Log from './pages/Log';
import Archived from './pages/Archived';
import Settings from './pages/Settings';
import TaskView from './pages/TaskView';
import { useAuthStore } from './stores/authStore';
import { useAgentStore } from './stores/agentStore';

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const { fetchAgents, getDefaultAgent, agents } = useAgentStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  // Fetch agents on mount for auto-discovery
  useEffect(() => {
    if (agents.length === 0) {
      fetchAgents();
    }
  }, [agents.length, fetchAgents]);

  return (
    <ErrorBoundary>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/tasks/overview" replace />} />
            <Route path="/tasks" element={<Navigate to="/tasks/overview" replace />} />
            <Route path="/tasks/overview" element={<Layout><TaskManagerOverview /></Layout>} />
            <Route path="/tasks/kanban" element={<Layout><KanbanPage /></Layout>} />
            <Route path="/tasks/org-chart" element={<Layout><OrgChart /></Layout>} />
            <Route path="/docs" element={<Navigate to={`/workspaces/${getDefaultAgent()?.id || 'coo'}`} replace />} />
            <Route path="/workspaces" element={<Navigate to={`/workspaces/${getDefaultAgent()?.id || 'coo'}`} replace />} />
            <Route path="/workspaces/:agentId/*" element={<Layout><Workspace /></Layout>} />
            <Route path="/subagents" element={<Layout><Subagents /></Layout>} />
            <Route path="/log" element={<Layout><Log /></Layout>} />
            <Route path="/archived" element={<Layout><Archived /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
            <Route path="/settings/users" element={<Layout><Settings /></Layout>} />
            <Route path="/task/:id" element={<Layout><TaskView /></Layout>} />
          </Route>
        </Routes>
        <ToastContainer />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
