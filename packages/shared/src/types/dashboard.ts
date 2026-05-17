export interface DashboardRunActivityDay {
  date: string;
  succeeded: number;
  failed: number;
  other: number;
  total: number;
}

export interface DashboardSummary {
  companyId: string;
  agents: {
    active: number;
    running: number;
    paused: number;
    error: number;
  };
  tasks: {
    open: number;
    inProgress: number;
    blocked: number;
    done: number;
  };
  costs: {
    monthSpendCents: number;
    monthBudgetCents: number;
    monthUtilizationPercent: number;
  };
  pendingApprovals: number;
  budgets: {
    activeIncidents: number;
    pendingApprovals: number;
    pausedAgents: number;
    pausedProjects: number;
  };
  heartbeatRunStaleness?: {
    thresholdMs: number;
    staleAgentCount: number;
    totalStaleRunCount: number;
    agents: Array<{
      agentId: string;
      agentName: string;
      lastHeartbeatAt: Date | string | null;
      staleRunCount: number;
    }>;
  };
  runActivity: DashboardRunActivityDay[];
}
