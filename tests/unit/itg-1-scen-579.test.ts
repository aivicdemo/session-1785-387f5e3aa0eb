import { runTx4Imp1Agent, Tx4Imp1AiClient } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能 - AIエージェント課題抽出エスカレーション", () => {
  // SCEN-579
  test("重大なリスク課題が検出された場合、副作用実行前に人へ引き継ぐ", async () => {
    const escalationNotificationCapture: {
      escalationData: object | null;
      auditEventCapture: object | null;
    } = {
      escalationData: null,
      auditEventCapture: null,
    };

    const mockAiClient: Tx4Imp1AiClient = {
      analyzeReportSummary: jest.fn().mockResolvedValue({
        summary: "10名全員の日報収集完了。本番環境で重大なデータベース接続エラーが検出。",
        timestamp: new Date("2024-01-15T08:45:00Z"),
      }),

      extractTasksAndRisks: jest.fn().mockResolvedValue({
        tasks: [
          {
            taskId: "task_001",
            description: "本番環境でデータベース接続エラーが発生し、朝会開始時点で復旧見込みなし",
            severity: "critical",
            affectedTeamMembers: ["engineer_001", "engineer_002", "engineer_003"],
            detectionReason:
              "複数部員の日報に本番環境障害の記載あり、復旧見込みなしの共通報告",
          },
        ],
        extractedAt: new Date("2024-01-15T08:50:00Z"),
      }),

      prioritizeIssues: jest
        .fn()
        .mockRejectedValue(
          new Error(
            "CRITICAL_RISK_DETECTED: 本番環境でデータベース接続エラーが発生し、朝会開始時点で復旧見込みなし"
          )
        ),

      sendPriorityReportToManager: jest.fn().mockResolvedValue(null),
    };

    const mockAuditLogger = {
      logEvent: jest
        .fn()
        .mockImplementation((eventData: object) => {
          escalationNotificationCapture.auditEventCapture = eventData;
        }),
    };

    const mockEscalationHandler = {
      createEscalationNotification: jest
        .fn()
        .mockImplementation((issueData: object) => {
          escalationNotificationCapture.escalationData = issueData;
          return {
            notificationId: "notif_001",
            targetRole: "manager",
            severity: "critical",
            ...issueData,
          };
        }),
    };

    const reportCollectionData = {
      reportCount: 10,
      collectedReports: [
        {
          userId: "engineer_001",
          yesterday: "本番環境でデータベース接続エラーが発生",
          today: "復旧作業に従事",
          issues: "本番環境接続エラー - 復旧見込みなし",
          submittedAt: new Date("2024-01-15T08:00:00Z"),
        },
        {
          userId: "engineer_002",
          yesterday: "本番環境サポート",
          today: "復旧作業継続",
          issues: "本番環境接続エラー - 復旧見込みなし",
          submittedAt: new Date("2024-01-15T08:05:00Z"),
        },
        {
          userId: "engineer_003",
          yesterday: "本番環境モニタリング",
          today: "復旧監視",
          issues: "本番環境接続エラー - 復旧見込みなし",
          submittedAt: new Date("2024-01-15T08:10:00Z"),
        },
        {
          userId: "engineer_004",
          yesterday: "通常業務",
          today: "通常業務",
          issues: "なし",
          submittedAt: new Date("2024-01-15T07:55:00Z"),
        },
        {
          userId: "engineer_005",
          yesterday: "通常業務",
          today: "通常業務",
          issues: "なし",
          submittedAt: new Date("2024-01-15T07:58:00Z"),
        },
        {
          userId: "engineer_006",
          yesterday: "通常業務",
          today: "通常業務",
          issues: "なし",
          submittedAt: new Date("2024-01-15T08:02:00Z"),
        },
        {
          userId: "engineer_007",
          yesterday: "通常業務",
          today: "通常業務",
          issues: "なし",
          submittedAt: new Date("2024-01-15T08:03:00Z"),
        },
        {
          userId: "engineer_008",
          yesterday: "通常業務",
          today: "通常業務",
          issues: "なし",
          submittedAt: new Date("2024-01-15T08:04:00Z"),
        },
        {
          userId: "engineer_009",
          yesterday: "通常業務",
          today: "通常業務",
          issues: "なし",
          submittedAt: new Date("2024-01-15T08:06:00Z"),
        },
        {
          userId: "engineer_010",
          yesterday: "通常業務",
          today: "通常業務",
          issues: "なし",
          submittedAt: new Date("2024-01-15T08:07:00Z"),
        },
      ],
      morningMeetingStartTime: new Date("2024-01-15T09:00:00Z"),
    };

    const agentResult = await runTx4Imp1Agent(
      reportCollectionData,
      mockAiClient,
      mockAuditLogger,
      mockEscalationHandler
    );

    expect(mockAiClient.analyzeReportSummary).toHaveBeenCalledTimes(1);
    expect(mockAiClient.extractTasksAndRisks).toHaveBeenCalledTimes(1);
    expect(mockAiClient.prioritizeIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient.sendPriorityReportToManager).toHaveBeenCalledTimes(0);

    expect(mockEscalationHandler.createEscalationNotification).toHaveBeenCalledTimes(
      1
    );
    const escalationCallArg = mockEscalationHandler.createEscalationNotification.mock
      .calls[0][0] as object;
    expect(escalationCallArg).toHaveProperty("severity", "critical");
    expect(escalationCallArg).toHaveProperty(
      "issueDescription",
      "本番環境でデータベース接続エラーが発生し、朝会開始時点で復旧見込みなし"
    );
    expect(escalationCallArg).toHaveProperty("detectionReason");
    expect(escalationCallArg).toHaveProperty("affectedTeamMembers");

    expect(mockAuditLogger.logEvent).toHaveBeenCalledTimes(1);
    const auditEvent = mockAuditLogger.logEvent.mock.calls[0][0] as object;
    expect(auditEvent).toHaveProperty("action", "escalate");
    expect(auditEvent).toHaveProperty("reason", "critical_risk_detected");
    expect(auditEvent).toHaveProperty("timestamp");
    expect(auditEvent).toHaveProperty("issueId");
    expect(auditEvent).toHaveProperty("targetRole", "manager");

    expect(escalationNotificationCapture.escalationData).not.toBeNull();
    const escalData = escalationNotificationCapture.escalationData as object;
    expect(escalData).toHaveProperty("severity", "critical");
    expect(escalData).toHaveProperty("issueDescription");
    expect(escalData).toHaveProperty("detectionReason");
    expect(escalData).toHaveProperty("affectedTeamMembers");
    expect(Array.isArray((escalData as any).affectedTeamMembers)).toBe(true);
    expect(((escalData as any).affectedTeamMembers as string[]).length).toBe(3);

    expect(escalationNotificationCapture.auditEventCapture).not.toBeNull();
    const auditLogData = escalationNotificationCapture.auditEventCapture as object;
    expect(auditLogData).toHaveProperty("action", "escalate");
    expect(auditLogData).toHaveProperty("reason", "critical_risk_detected");

    expect(agentResult).toHaveProperty("escalationMode", true);
    expect(agentResult).toHaveProperty("status", "awaiting_human_review");
    expect(agentResult).toHaveProperty("escalatedIssue");
    expect(agentResult.escalatedIssue).toHaveProperty(
      "severity",
      "critical"
    );
    expect(agentResult.escalatedIssue).toHaveProperty(
      "issueDescription",
      "本番環境でデータベース接続エラーが発生し、朝会開始時点で復旧見込みなし"
    );
    expect(agentResult.escalatedIssue).toHaveProperty("detectionReason");
    expect(agentResult.escalatedIssue).toHaveProperty(
      "recommendedAction"
    );
  });
});