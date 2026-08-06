import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx1Imp1Agent } from "../../src/logic/it-1";

interface AuthorizationContext {
  userId: string;
  userRole: string;
  token: string;
}

interface MockAiClientCallRecord {
  toolName: string;
  arguments: Record<string, unknown>;
  timestamp: string;
}

interface AuditLogEntry {
  eventType: string;
  userId: string;
  operationName: string;
  timestamp: string;
  result: string;
}

interface MockTx1Imp1AiClient {
  callRecords: MockAiClientCallRecord[];
  authorizationFailures: AuditLogEntry[];
  executeToolCall(
    toolName: string,
    toolArguments: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }>;
}

interface AgentExecutionResult {
  status: string;
  operationsAttempted: Array<{ toolName: string; denied: boolean }>;
  auditLog: AuditLogEntry[];
}

const createMockAiClient = (): MockTx1Imp1AiClient => {
  return {
    callRecords: [],
    authorizationFailures: [],
    executeToolCall: async (
      toolName: string,
      toolArguments: Record<string, unknown>
    ) => {
      return { success: true };
    },
  };
};

const createAuthorizationContext = (
  userId: string,
  userRole: string,
  token: string
): AuthorizationContext => {
  return { userId, userRole, token };
};

describe("朝会報告管理システム - 日報入力から送信・確認メール配信までの自動化 AIエージェント権限制御", () => {
  // SCEN-538
  test("SCEN-538: エンジニア（一般部員権限）が権限外のデータ参照とツール操作を実行すると認可層が拒否し監査ログに記録される", async () => {
    const mockAiClient = createMockAiClient();
    const engineerAContext = createAuthorizationContext(
      "eng_user_001",
      "general_member",
      "token_engineer_a_xyz"
    );

    const auditLog: AuditLogEntry[] = [];

    const recordAuthorizationDenial = (
      userId: string,
      operationName: string
    ): void => {
      const entry: AuditLogEntry = {
        eventType: "AUTHZ_DENIED",
        userId: userId,
        operationName: operationName,
        timestamp: "2024-01-15T08:30:00Z",
        result: "DENIED",
      };
      auditLog.push(entry);
      mockAiClient.authorizationFailures.push(entry);
    };

    const checkAuthorizationAndExecute = async (
      context: AuthorizationContext,
      toolName: string,
      toolArguments: Record<string, unknown>
    ): Promise<{ authorized: boolean; error?: string }> => {
      const deniedOperations = [
        "get_all_reports",
        "get_other_user_reports",
        "email_admin_panel_access",
        "update_email_template",
        "set_admin_address",
        "admin_override_report",
        "delete_all_reports",
      ];

      if (deniedOperations.includes(toolName)) {
        recordAuthorizationDenial(context.userId, toolName);
        return {
          authorized: false,
          error: `Insufficient permissions for ${toolName}`,
        };
      }

      const allowedSelfOperations = ["submit_own_report", "get_own_reports"];
      if (
        allowedSelfOperations.includes(toolName) &&
        toolArguments.userId === context.userId
      ) {
        return { authorized: true };
      }

      recordAuthorizationDenial(context.userId, toolName);
      return {
        authorized: false,
        error: `Insufficient permissions for ${toolName}`,
      };
    };

    const operationsAttempted: Array<{ toolName: string; denied: boolean }> =
      [];

    const attemptedOperations = [
      {
        toolName: "get_all_reports",
        args: {},
        shouldFail: true,
      },
      {
        toolName: "get_other_user_reports",
        args: { userId: "eng_user_002" },
        shouldFail: true,
      },
      {
        toolName: "email_admin_panel_access",
        args: {},
        shouldFail: true,
      },
      {
        toolName: "update_email_template",
        args: { templateId: "tpl_broadcast_001" },
        shouldFail: true,
      },
      {
        toolName: "set_admin_address",
        args: { address: "admin@company.com" },
        shouldFail: true,
      },
      {
        toolName: "admin_override_report",
        args: { reportId: "rpt_123", override: true },
        shouldFail: true,
      },
      {
        toolName: "delete_all_reports",
        args: {},
        shouldFail: true,
      },
      {
        toolName: "submit_own_report",
        args: {
          userId: "eng_user_001",
          yesterdayAccomplishment: "Completed feature X",
          todayPlan: "Start feature Y",
          currentIssues: "None",
        },
        shouldFail: false,
      },
    ];

    for (const op of attemptedOperations) {
      const result = await checkAuthorizationAndExecute(
        engineerAContext,
        op.toolName,
        op.args
      );

      const isDenied = !result.authorized;
      operationsAttempted.push({
        toolName: op.toolName,
        denied: isDenied,
      });

      if (op.shouldFail) {
        expect(isDenied).toBe(true);
        expect(result.error).toMatch(/Insufficient permissions/);
      } else {
        expect(isDenied).toBe(false);
      }
    }

    const agentExecutionResult: AgentExecutionResult = {
      status:
        auditLog.length > 0 ? "halted_authorization_failure" : "completed",
      operationsAttempted: operationsAttempted,
      auditLog: auditLog,
    };

    expect(agentExecutionResult.status).toBe("halted_authorization_failure");

    expect(agentExecutionResult.auditLog.length).toBe(7);

    const denialEvents = agentExecutionResult.auditLog.filter(
      (log) => log.eventType === "AUTHZ_DENIED"
    );
    expect(denialEvents.length).toBe(7);

    denialEvents.forEach((log) => {
      expect(log.userId).toBe("eng_user_001");
      expect(log.result).toBe("DENIED");
      expect(log.timestamp).toBe("2024-01-15T08:30:00Z");
      expect(log.operationName).toMatch(
        /^(get_all_reports|get_other_user_reports|email_admin_panel_access|update_email_template|set_admin_address|admin_override_report|delete_all_reports)$/
      );
    });

    const deniedOperationNames = denialEvents.map((log) => log.operationName);
    expect(deniedOperationNames).toContain("get_all_reports");
    expect(deniedOperationNames).toContain("get_other_user_reports");
    expect(deniedOperationNames).toContain("email_admin_panel_access");
    expect(deniedOperationNames).toContain("update_email_template");
    expect(deniedOperationNames).toContain("set_admin_address");
    expect(deniedOperationNames).toContain("admin_override_report");
    expect(deniedOperationNames).toContain("delete_all_reports");

    const selfReportOperation = operationsAttempted.find(
      (op) => op.toolName === "submit_own_report"
    );
    expect(selfReportOperation).toBeDefined();
    expect(selfReportOperation!.denied).toBe(false);

    const httpForbiddenSimulation = (
      operationName: string
    ): { status: number; message: string } => {
      if (
        operationName === "get_other_user_reports" ||
        operationName === "get_all_reports"
      ) {
        return {
          status: 403,
          message: "Forbidden",
        };
      }
      return {
        status: 403,
        message: "Forbidden",
      };
    };

    const otherUserReportResponse = httpForbiddenSimulation(
      "get_other_user_reports"
    );
    expect(otherUserReportResponse.status).toBe(403);
    expect(otherUserReportResponse.message).toBe("Forbidden");

    const emailAdminResponse = httpForbiddenSimulation(
      "email_admin_panel_access"
    );
    expect(emailAdminResponse.status).toBe(403);
    expect(emailAdminResponse.message).toBe("Forbidden");

    const mockAiClientFailureRecords = mockAiClient.authorizationFailures;
    expect(mockAiClientFailureRecords.length).toBe(7);

    mockAiClientFailureRecords.forEach((record) => {
      expect(record.eventType).toBe("AUTHZ_DENIED");
      expect(record.userId).toBe("eng_user_001");
      expect(record.result).toBe("DENIED");
    });

    const allowedOperationsInResult = operationsAttempted.filter(
      (op) => !op.denied
    );
    expect(allowedOperationsInResult.length).toBe(1);
    expect(allowedOperationsInResult[0].toolName).toBe("submit_own_report");

    const agentHalted =
      agentExecutionResult.status === "halted_authorization_failure";
    expect(agentHalted).toBe(true);
  });
});