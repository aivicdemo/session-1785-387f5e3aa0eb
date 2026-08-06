import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";
import type { Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/ai-client";
import type {
  User,
  Department,
  DailyReport,
  ReportSubmissionHistory,
  AuditLog,
} from "../../src/types";

describe("tx-2-imp-1: 日報収集から報告漏れ特定までの自動判定と通知", () => {
  let mockDb: {
    users: User[];
    departments: Department[];
    dailyReports: DailyReport[];
    submissionHistories: ReportSubmissionHistory[];
    auditLogs: AuditLog[];
  };

  let mockAiClient: Tx2Imp1AiClient;
  let mockEmailService: {
    sendEmail: jest.Mock;
  };

  beforeEach(() => {
    // テスト用データベース初期化
    mockDb = {
      users: [],
      departments: [],
      dailyReports: [],
      submissionHistories: [],
      auditLogs: [],
    };

    // 部門マスタ作成：開発部
    const developmentDept: Department = {
      id: "dept_001",
      name: "開発部",
      parentDepartmentId: null,
      status: "active",
      createdAt: new Date("2024-01-15T00:00:00Z"),
      updatedAt: new Date("2024-01-15T00:00:00Z"),
    };
    mockDb.departments.push(developmentDept);

    // ユーザーマスタ作成：部長1名
    const manager: User = {
      id: "user_manager_001",
      name: "部長太郎",
      email: "manager@company.com",
      departmentId: "dept_001",
      role: "manager",
      status: "active",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };
    mockDb.users.push(manager);

    // ユーザーマスタ作成：部員10名
    for (let i = 1; i <= 10; i++) {
      const user: User = {
        id: `user${String(i).padStart(3, "0")}`,
        name: `エンジニア${i}`,
        email: `engineer${i}@company.com`,
        departmentId: "dept_001",
        role: "engineer",
        status: "active",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };
      mockDb.users.push(user);
    }

    // 部員8名が日報送信済み状態をセットアップ
    for (let i = 1; i <= 8; i++) {
      const userId = `user${String(i).padStart(3, "0")}`;
      const reportDate = new Date("2024-01-15T00:00:00Z");

      const report: DailyReport = {
        id: `report_${userId}_20240115`,
        userId,
        reportDate,
        yesterday: `昨日実施した作業${i}`,
        today: `本日予定している作業${i}`,
        issues: `現在抱えている課題${i}`,
        status: "submitted",
        createdAt: new Date("2024-01-15T08:30:00Z"),
        updatedAt: new Date("2024-01-15T08:30:00Z"),
      };
      mockDb.dailyReports.push(report);

      const submission: ReportSubmissionHistory = {
        id: `submission_${userId}_20240115`,
        userId,
        reportId: report.id,
        submittedAt: new Date("2024-01-15T08:30:00Z"),
        submitterUserId: userId,
        status: "completed",
        createdAt: new Date("2024-01-15T08:30:00Z"),
      };
      mockDb.submissionHistories.push(submission);
    }

    // 部員2名（user003, user007）を未提出状態のままにする
    // （日報レコードを作成しない）

    // スタブAIクライアントのセットアップ
    mockAiClient = {
      analyzeSubmissionStatus: jest.fn().mockResolvedValue({
        missingSubmitters: [
          {
            userId: "user003",
            userName: "エンジニア3",
            email: "engineer3@company.com",
            reason: "期限内に送信されていない",
          },
          {
            userId: "user007",
            userName: "エンジニア7",
            email: "engineer7@company.com",
            reason: "期限内に送信されていない",
          },
        ],
        delayedSubmitters: [],
        totalExpected: 10,
        submittedCount: 8,
      }),
    };

    // スタブメールサービスのセットアップ
    mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue({
        messageId: "msg_001",
        sentAt: new Date("2024-01-15T09:00:00Z"),
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-553
  test("AIエージェント実行全体を通じて監査記録に開始・各処理ステップ・引継ぎ・完了イベントが時系列順に記録される", async () => {
    // 当日午前9時を超過した想定時刻でexecutorを実行
    const executionTime = new Date("2024-01-15T09:05:00Z");

    // agent orchestratorを実行
    const result = await runTx2Imp1Agent(
      {
        agentId: "agent_tx2_imp1_001",
        executionTime,
        departmentId: "dept_001",
        managerUserId: "user_manager_001",
        deadlineHour: 9,
        currentDate: new Date("2024-01-15T00:00:00Z"),
      },
      {
        aiClient: mockAiClient,
        emailService: mockEmailService,
        database: mockDb,
      }
    );

    // 監査ログから『開始』イベントを確認
    const startAuditLog = mockDb.auditLogs.find(
      (log) => log.eventType === "started"
    );
    expect(startAuditLog).toBeDefined();
    expect(startAuditLog?.agentId).toBe("agent_tx2_imp1_001");
    expect(startAuditLog?.timestamp).toEqual(new Date("2024-01-15T09:05:00Z"));
    expect(startAuditLog?.details).toMatchObject({
      action: "Agent execution started",
    });

    // 『全員の日報受信状況確認』ステップが『進行中』として記録
    const checkStatusAuditLog = mockDb.auditLogs.find(
      (log) =>
        log.eventType === "step_in_progress" &&
        log.stepName === "check_submission_status"
    );
    expect(checkStatusAuditLog).toBeDefined();
    expect(checkStatusAuditLog?.timestamp.getTime()).toBeGreaterThanOrEqual(
      startAuditLog!.timestamp.getTime()
    );

    // 『未提出者と遅延者の自動判定』ステップが『進行中』として記録
    const analyzeAuditLog = mockDb.auditLogs.find(
      (log) =>
        log.eventType === "step_in_progress" &&
        log.stepName === "analyze_missing_reports"
    );
    expect(analyzeAuditLog).toBeDefined();
    expect(analyzeAuditLog?.timestamp.getTime()).toBeGreaterThanOrEqual(
      checkStatusAuditLog!.timestamp.getTime()
    );

    // 『報告漏れ・遅延部員一覧作成』ステップが『進行中』として記録
    const generateListAuditLog = mockDb.auditLogs.find(
      (log) =>
        log.eventType === "step_in_progress" &&
        log.stepName === "generate_missing_report_list"
    );
    expect(generateListAuditLog).toBeDefined();
    expect(generateListAuditLog?.timestamp.getTime()).toBeGreaterThanOrEqual(
      analyzeAuditLog!.timestamp.getTime()
    );

    // 『部長への通知メール送信』ステップが『進行中』として記録
    const sendEmailAuditLog = mockDb.auditLogs.find(
      (log) =>
        log.eventType === "step_in_progress" &&
        log.stepName === "send_manager_notification"
    );
    expect(sendEmailAuditLog).toBeDefined();
    expect(sendEmailAuditLog?.timestamp.getTime()).toBeGreaterThanOrEqual(
      generateListAuditLog!.timestamp.getTime()
    );

    // 『引継ぎ』イベント（部長による最終確認待機状態）が記録
    const handoverAuditLog = mockDb.auditLogs.find(
      (log) => log.eventType === "handed_over"
    );
    expect(handoverAuditLog).toBeDefined();
    expect(handoverAuditLog?.details).toMatchObject({
      reason: "Awaiting manager final confirmation",
    });
    expect(handoverAuditLog?.timestamp.getTime()).toBeGreaterThanOrEqual(
      sendEmailAuditLog!.timestamp.getTime()
    );

    // 『完了』イベントが記録
    const completedAuditLog = mockDb.auditLogs.find(
      (log) => log.eventType === "completed"
    );
    expect(completedAuditLog).toBeDefined();
    expect(completedAuditLog?.timestamp.getTime()).toBeGreaterThanOrEqual(
      handoverAuditLog!.timestamp.getTime()
    );

    // 時系列順序の検証：開始 → 各処理 → 引継ぎ → 完了
    const eventTimeline = [
      startAuditLog,
      checkStatusAuditLog,
      analyzeAuditLog,
      generateListAuditLog,
      sendEmailAuditLog,
      handoverAuditLog,
      completedAuditLog,
    ].filter((log): log is AuditLog => log !== undefined);

    for (let i = 1; i < eventTimeline.length; i++) {
      expect(eventTimeline[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        eventTimeline[i - 1].timestamp.getTime()
      );
    }

    // 未提出部員2名（user003, user007）が正確に特定されたことを検証
    expect(result.missingSubmitters).toHaveLength(2);
    expect(result.missingSubmitters.map((s) => s.userId)).toEqual([
      "user003",
      "user007",
    ]);

    // 生成された報告漏れ一覧に未提出者2名が含まれることを検証
    const missingReportList = mockDb.auditLogs.find(
      (log) => log.stepName === "generate_missing_report_list"
    );
    expect(missingReportList?.details).toMatchObject({
      missingCount: 2,
      missingUserIds: ["user003", "user007"],
    });

    // 部長へのメール送信がスタブサービスで実行されたことを検証
    expect(mockEmailService.sendEmail).toHaveBeenCalled();
    const emailCallArg = mockEmailService.sendEmail.mock.calls[0][0];
    expect(emailCallArg.to).toBe("manager@company.com");

    // メール本文に『日報未提出者: user003, user007』が記載されていることを確認
    expect(emailCallArg.body).toContain("日報未提出者");
    expect(emailCallArg.body).toContain("user003");
    expect(emailCallArg.body).toContain("user007");

    // 監査記録の各エントリにタイムスタンプ、処理ステップ名、実行ユーザー（AIエージェント識別子）が記載
    mockDb.auditLogs.forEach((log) => {
      expect(log.timestamp).toBeDefined();
      expect(log.timestamp).toBeInstanceOf(Date);
      if (log.stepName) {
        expect(log.stepName).toBeTruthy();
      }
      expect(log.agentId).toBe("agent_tx2_imp1_001");
    });

    // 実行結果の正確性を検証
    expect(result.status).toBe("handed_over");
    expect(result.totalExpected).toBe(10);
    expect(result.submittedCount).toBe(8);
    expect(result.delayedSubmitters).toHaveLength(0);
  });
});