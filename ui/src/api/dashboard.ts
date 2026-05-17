import type { DashboardSummary } from "@paperclipai/shared";
import { api } from "./client";

type DashboardSummaryWire = Omit<DashboardSummary, "heartbeatRunStaleness"> & {
  heartbeatRunStaleness?: DashboardSummary["heartbeatRunStaleness"];
};

type HeartbeatRunStalenessSummary = NonNullable<DashboardSummary["heartbeatRunStaleness"]>;

const emptyHeartbeatRunStaleness: HeartbeatRunStalenessSummary = {
  thresholdMs: 0,
  staleAgentCount: 0,
  totalStaleRunCount: 0,
  agents: [],
};

export function normalizeDashboardSummary(
  summary: DashboardSummaryWire,
): DashboardSummary & { heartbeatRunStaleness: HeartbeatRunStalenessSummary } {
  return {
    ...summary,
    heartbeatRunStaleness: summary.heartbeatRunStaleness ?? emptyHeartbeatRunStaleness,
  };
}

export const dashboardApi = {
  summary: async (companyId: string) =>
    normalizeDashboardSummary(await api.get<DashboardSummaryWire>(`/companies/${companyId}/dashboard`)),
};
