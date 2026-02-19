import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import WorkspaceExplorer from '../components/WorkspaceExplorer';
import { useAgentStore } from '../stores/agentStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useAuthStore } from '../stores/authStore';

const AGENT_ID = 'skills';
const ROOT_PATH = '/shared/skills';

export default function Skills() {
  const { '*': filePathParam } = useParams();
  const { fetchAgents } = useAgentStore();
  const { createDirectory, setWorkspaceRootPath } = useWorkspaceStore();
  const { isAdmin } = useAuthStore();
  const [isEnsuring, setIsEnsuring] = useState(false);
  const [ensureComplete, setEnsureComplete] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    const ensureDir = async () => {
      if (isEnsuring || ensureComplete) return;
      setIsEnsuring(true);
      setWorkspaceRootPath(ROOT_PATH);
      try {
        if (isAdmin()) {
          await createDirectory({ path: '/', agentId: AGENT_ID });
        }
      } catch {
        // Directory likely already exists (409) — that's fine
      } finally {
        setIsEnsuring(false);
        setEnsureComplete(true);
      }
    };
    ensureDir();
  }, [createDirectory, setWorkspaceRootPath, isAdmin, isEnsuring, ensureComplete]);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Skills"
        subtitle="Shared skills space for all agents"
      />

      <div className="flex-1 flex flex-col p-3 md:p-6 overflow-hidden">
        {ensureComplete ? (
          <WorkspaceExplorer
            agentId={AGENT_ID}
            agent={{
              id: AGENT_ID,
              name: 'Skills',
              workspaceRootPath: ROOT_PATH,
              icon: '🧠',
            }}
            initialFilePath={filePathParam || null}
            routeBase="/skills"
            showAgentSelector={false}
            workspaceRootPath={ROOT_PATH}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-dark-400">Setting up skills space...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
