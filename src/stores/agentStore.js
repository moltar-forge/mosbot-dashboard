import { create } from 'zustand';
import { getAgents } from '../api/client';
import logger from '../utils/logger';

// Fallback agents if API fails or returns empty
const fallbackAgents = [
  {
    id: 'coo',
    name: 'MostBot',
    label: 'MostBot (COO)',
    description: 'operations director',
    workspaceRootPath: '/workspace-coo',
    icon: '📊',
    isDefault: true
  },
  {
    id: 'cto',
    name: 'Elon',
    label: 'Elon (CTO)',
    description: 'tech architect',
    workspaceRootPath: '/workspace-cto',
    icon: '💼',
    isDefault: false
  },
  {
    id: 'cmo',
    name: 'Gary',
    label: 'Gary (CMO)',
    description: 'marketing strategist',
    workspaceRootPath: '/workspace-cmo',
    icon: '📢',
    isDefault: false
  },
  {
    id: 'cpo',
    name: 'Alex',
    label: 'Alex (CPO)',
    description: 'product strategist',
    workspaceRootPath: '/workspace-cpo',
    icon: '💡',
    isDefault: false
  },
];

export const useAgentStore = create((set, get) => ({
  agents: [],
  isLoading: false,
  error: null,
  isInitialized: false,

  // Fetch agents from API (auto-discovery)
  fetchAgents: async () => {
    const state = get();
    
    // Don't fetch if already loaded
    if (state.isInitialized && state.agents.length > 0) {
      return state.agents;
    }

    set({ isLoading: true, error: null });

    try {
      const agentsData = await getAgents();
      
      // Transform workspace paths to workspaceRootPath format for consistency
      const agents = agentsData.map(agent => ({
        ...agent,
        workspaceRootPath: agent.workspace 
          ? agent.workspace.replace('/home/node/.openclaw', '') 
          : `/workspace-${agent.id}`,
      }));

      set({ 
        agents: agents.length > 0 ? agents : fallbackAgents, 
        isLoading: false, 
        error: null,
        isInitialized: true 
      });

      return agents;
    } catch (error) {
      logger.error('Failed to fetch agents, using fallback', error);
      
      set({ 
        agents: fallbackAgents, 
        isLoading: false, 
        error: error.message,
        isInitialized: true 
      });

      return fallbackAgents;
    }
  },

  // Get agent by ID
  getAgentById: (id) => {
    const { agents } = get();
    return agents.find(agent => agent.id === id) || agents.find(a => a.isDefault) || agents[0];
  },

  // Get default agent
  getDefaultAgent: () => {
    const { agents } = get();
    return agents.find(agent => agent.isDefault) || agents[0];
  },

  // Check if agent ID is valid
  isValidAgentId: (id) => {
    const { agents } = get();
    return agents.some(agent => agent.id === id);
  },

  // Reset store
  reset: () => {
    set({ 
      agents: [], 
      isLoading: false, 
      error: null, 
      isInitialized: false 
    });
  },
}));
