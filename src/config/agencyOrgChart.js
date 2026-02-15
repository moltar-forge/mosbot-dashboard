// Agency Organization Chart Configuration
// This defines the hierarchical structure of the multi-agent system

export const agencyOrgChart = {
  leadership: [
    {
      id: 'ceo',
      title: 'CEO',
      label: 'mosbot-ceo',
      description: 'Chief Executive Officer - Strategic oversight and decision-making',
      status: 'scaffolded', // scaffolded | active | deprecated
    },
    {
      id: 'cto',
      title: 'CTO',
      label: 'mosbot-cto',
      description: 'Chief Technology Officer - Technical architecture and innovation',
      status: 'scaffolded',
    },
    {
      id: 'coo',
      title: 'COO',
      label: 'mosbot-coo',
      description: 'Chief Operating Officer - Operations and workflow management',
      status: 'scaffolded',
    },
    {
      id: 'cmo',
      title: 'CMO',
      label: 'mosbot-cmo',
      description: 'Chief Marketing Officer - Marketing and communications',
      status: 'scaffolded',
    },
  ],
  
  departments: [
    {
      id: 'engineering',
      name: 'Engineering',
      lead: 'cto',
      subagents: [
        {
          id: 'backend-dev',
          label: 'mosbot-backend-developer',
          description: 'Backend API development and database management',
          status: 'scaffolded',
        },
        {
          id: 'frontend-dev',
          label: 'mosbot-frontend-developer',
          description: 'UI/UX development and frontend implementation',
          status: 'scaffolded',
        },
        {
          id: 'devops',
          label: 'mosbot-devops',
          description: 'Infrastructure, deployment, and CI/CD',
          status: 'scaffolded',
        },
      ],
    },
    {
      id: 'operations',
      name: 'Operations',
      lead: 'coo',
      subagents: [
        {
          id: 'task-coordinator',
          label: 'mosbot-task-coordinator',
          description: 'Task assignment and workflow coordination',
          status: 'scaffolded',
        },
        {
          id: 'qa-specialist',
          label: 'mosbot-qa-specialist',
          description: 'Quality assurance and testing',
          status: 'scaffolded',
        },
      ],
    },
    {
      id: 'marketing',
      name: 'Marketing',
      lead: 'cmo',
      subagents: [
        {
          id: 'content-writer',
          label: 'mosbot-content-writer',
          description: 'Content creation and documentation',
          status: 'scaffolded',
        },
        {
          id: 'social-media',
          label: 'mosbot-social-media',
          description: 'Social media management and engagement',
          status: 'scaffolded',
        },
      ],
    },
  ],
};

// Helper function to get all subagent labels
export const getAllSubagentLabels = () => {
  const labels = [];
  agencyOrgChart.departments.forEach(dept => {
    dept.subagents.forEach(agent => {
      labels.push(agent.label);
    });
  });
  return labels;
};

// Helper function to find a node by label
export const findNodeByLabel = (label) => {
  // Check leadership
  const leader = agencyOrgChart.leadership.find(l => l.label === label);
  if (leader) return { ...leader, type: 'leadership' };
  
  // Check departments
  for (const dept of agencyOrgChart.departments) {
    const agent = dept.subagents.find(a => a.label === label);
    if (agent) return { ...agent, type: 'subagent', department: dept.name };
  }
  
  return null;
};
