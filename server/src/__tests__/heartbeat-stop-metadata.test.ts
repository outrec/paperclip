import { describe, expect, it } from "vitest";
import {
  buildHeartbeatRunStopMetadata,
  inferHeartbeatRunStopReason,
  isProcessLostErrorCode,
  mergeHeartbeatRunStopMetadata,
} from "../services/heartbeat-stop-metadata.js";

describe("heartbeat stop metadata", () => {
  it.each([
    "process_lost",
    "process_lost_server_restart",
    "process_lost_child_pid_exit",
    "process_lost_retry_exhausted",
  ])("normalizes %s as a process-lost stop reason", (errorCode) => {
    expect(isProcessLostErrorCode(errorCode)).toBe(true);
    expect(inferHeartbeatRunStopReason({ outcome: "failed", errorCode })).toBe("process_lost");
  });

  it("preserves process-loss recovery metadata while keeping the stable stop reason", () => {
    const metadata = buildHeartbeatRunStopMetadata({
      adapterType: "codex_local",
      adapterConfig: {},
      outcome: "failed",
      errorCode: "process_lost_child_pid_exit",
      errorMessage: "Process lost -- child pid 123 is no longer running",
    });

    expect(mergeHeartbeatRunStopMetadata({
      processLoss: {
        subcode: "process_lost_child_pid_exit",
        processPid: 123,
        retryDisposition: "safe_retry_queued",
      },
    }, metadata)).toMatchObject({
      stopReason: "process_lost",
      processLoss: {
        subcode: "process_lost_child_pid_exit",
        processPid: 123,
        retryDisposition: "safe_retry_queued",
      },
    });
  });
});
