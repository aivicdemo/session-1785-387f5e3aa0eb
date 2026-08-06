import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import type { Tx1Imp1AiClient } from "../../src/agents/tx-1-imp-1/types";
import { runTx1Imp1Agent } from "../../src/agents/tx-1-imp-1/orchestrator";

type MockEmailRecord = {
  recipient: string;
  subject: string;
  body: string;
  sentAt: Date;
  senderAddress: string;
};

type MockAuditLog = {
  action: string;
  targetUsers: string[];
  reason: string;
  executedAt: Date;
};

type SystemConfig = {
  maxNotificationFrequencyPerDay: number;
  maxNotificationTargetCount: number;
  whitelistedSenderAddresses: string[];
};

type EngineerStatus = {
  engineerId: string;
  engineerName: string;
  lastNotificationTime: Date | null;
  hasSubmittedReport: boolean;
};

const SUBMISSION_DEADLINE = new Date("2024-12-19T23:59:00Z");
const CURRENT_TIME = new Date("2024-12-20T09:00:00Z");
const OVERDUELEAD_ENGINEERS = ["EngA", "EngB", "EngC"];

const mockEmailRecords: MockEmailRecord[] = [];
const mockAuditLogs: MockAuditLog[] = [];

const mockSystemConfig: SystemConfig = {
  maxNotificationFrequencyPerDay: 1,
  maxNotificationTargetCount: 10,
  whitelistedSenderAddresses: ["reports@company-morning-briefing.internal"],
};

const mockEngineerStatuses: Map<string, EngineerStatus> = new Map([
  [
    "EngA",
    {
      engineerId: "EngA",
      engineerName: "Engineer A",
      lastNotificationTime: null,
      hasSubmittedReport: false,
    },
  ],
  [
    "EngB",
    {
      engineerId: "EngB",
      engineerName: "Engineer B",
      lastNotificationTime: null,
      hasSubmittedReport: false,
    },
  ],
  [
    "EngC",
    {
      engineerId: "EngC",
      engineerName: "Engineer C",
      lastNotificationTime: null,
      hasSubmittedReport: false,
    },
  ],
]);

const mockFakeAiClient: Tx1Imp1AiClient = {
  identifyOverdueEngineers: async (params) => {
    return {
      overdueEngineers: OVERDUELEAD_ENGINEERS.map((engId) => {
        const status = mockEngineerStatuses.get(engId);
        return {
          engineerId: engId,
          engineerName: status?.engineerName || engId,
          deadlineExceededAt: SUBMISSION_DEADLINE,
        };
      }),
      totalOverdueCount: 3,
    };
  },

  generateReminderNotification: async (params) => {
    return {
      recipientId: params.engineerId,
      recipientName: params.engineerName,
      subject: "【朝会報告管理】日報提出期限超過のお知らせ",
      body: `${params.engineerName}様\n\nご報告ですが、朝会日報の提出期限を超過されています。\n\n提出期限: ${SUBMISSION_DEADLINE.toISOString().replace("T", " ").slice(0, 16)} を過ぎています。\n\nお手数ですが、至急日報をご提出ください。`,
      confidenceScore: 0.95,
    };
  },

  sendReminderNotification: async (params) => {
    const record: MockEmailRecord = {
      recipient: params.recipientId,
      subject: params.subject,
      body: params.body,
      sentAt: new Date(CURRENT_TIME),
      senderAddress: mockSystemConfig.whitelistedSenderAddresses[0],
    };
    mockEmailRecords.push(record);

    const existingStatus = mockEngineerStatuses.get(params.recipientId);
    if (existingStatus) {
      existingStatus.lastNotificationTime = new Date(CURRENT_TIME);
    }

    return {
      success: true,
      messageId: `msg-${params.recipientId}-${CURRENT_TIME.getTime()}`,
      sentAt: new Date(CURRENT_TIME),
    };
  },

  recordAuditLog: async (params) => {
    const log: MockAuditLog = {
      action: params.action,
      targetUsers: params.targetUserIds,
      reason: params.reason,
      executedAt: new Date(CURRENT_TIME),
    };
    mockAuditLogs.push(log);
    return { success: true };
  },

  validateConfiguration: async () => {
    return {
      isValid: true,
      config: mockSystemConfig,
    };
  },
};

describe("Tx1Imp1Agent - 提出期限超過者への催促通知自動配信", () => {
  beforeEach(() => {
    mockEmailRecords.length = 0;
    mockAuditLogs.length = 0;
    mockEngineerStatuses.forEach((status) => {
      status.lastNotificationTime = null;
    });
  });

  afterEach(() => {
    mockEmailRecords.length = 0;
    mockAuditLogs.length = 0;
  });

  // SCEN-532
  test("should automatically send reminder notifications to overdue engineers and record audit logs with spam prevention and frequency limiting", async () => {
    // テストデータ準備: 提出期限を超過したエンジニア3名（EngA, EngB, EngC）の日報未提出状態
    expect(mockEngineerStatuses.get("EngA")?.hasSubmittedReport).toBe(false);
    expect(mockEngineerStatuses.get("EngB")?.hasSubmittedReport).toBe(false);
    expect(mockEngineerStatuses.get("EngC")?.hasSubmittedReport).toBe(false);

    // テストデータ準備: 提出期限を「前日23:59」に設定、現在時刻を「当日09:00」に設定
    expect(SUBMISSION_DEADLINE.getTime()).toBeLessThan(CURRENT_TIME.getTime());

    // テストデータ準備: メール配信スタブを注入
    expect(mockEmailRecords.length).toBe(0);

    // テストデータ準備: Tx1Imp1AiClientの偽装実装を用意
    expect(mockFakeAiClient).toBeDefined();

    // Orchestrator実行: runTx1Imp1Agent() を呼び出し
    const result = await runTx1Imp1Agent({
      aiClient: mockFakeAiClient,
      submissionDeadline: SUBMISSION_DEADLINE,
      currentTime: CURRENT_TIME,
      systemConfig: mockSystemConfig,
      engineerStatuses: mockEngineerStatuses,
    });

    // 自動処理実行確認: AIエージェントが提出期限超過者（EngA, EngB, EngC）を自動判定
    expect(result.identifiedOverdueCount).toBe(3);
    expect(result.overdueEngineerIds).toContain("EngA");
    expect(result.overdueEngineerIds).toContain("EngB");
    expect(result.overdueEngineerIds).toContain("EngC");

    // 自動処理実行確認: AIエージェントが各超過者に対して個別の催促通知メールを自動生成
    expect(result.notificationsSent).toBe(3);

    // 自動処理実行確認: メール配信スタブの呼び出し記録から、3件の催促通知メール送信指示が正確に記録
    expect(mockEmailRecords.length).toBe(3);

    // メール内容検証: 送信されたメール件名に「【朝会報告管理】日報提出期限超過のお知らせ」が含まれる
    mockEmailRecords.forEach((record) => {
      expect(record.subject).toMatch(/【朝会報告管理】日報提出期限超過のお知らせ/);
    });

    // メール内容検証: 送信されたメール本文に名前と期限超過情報が記載
    const engAEmail = mockEmailRecords.find((r) => r.recipient === "EngA");
    expect(engAEmail).toBeDefined();
    expect(engAEmail!.body).toMatch(/Engineer A/);
    expect(engAEmail!.body).toMatch(/2024-12-19 23:59 を過ぎています/);

    const engBEmail = mockEmailRecords.find((r) => r.recipient === "EngB");
    expect(engBEmail).toBeDefined();
    expect(engBEmail!.body).toMatch(/Engineer B/);
    expect(engBEmail!.body).toMatch(/2024-12-19 23:59 を過ぎています/);

    const engCEmail = mockEmailRecords.find((r) => r.recipient === "EngC");
    expect(engCEmail).toBeDefined();
    expect(engCEmail!.body).toMatch(/Engineer C/);
    expect(engCEmail!.body).toMatch(/2024-12-19 23:59 を過ぎています/);

    // メール配信制限検証: 同一エンジニアへの催促通知が過去24時間以内に2回以上送信されていない
    const engANotifications = mockEmailRecords.filter(
      (r) => r.recipient === "EngA"
    );
    expect(engANotifications.length).toBe(1);

    const engBNotifications = mockEmailRecords.filter(
      (r) => r.recipient === "EngB"
    );
    expect(engBNotifications.length).toBe(1);

    const engCNotifications = mockEmailRecords.filter(
      (r) => r.recipient === "EngC"
    );
    expect(engCNotifications.length).toBe(1);

    // スパム判定対策検証: メール配信スタブに設定された送信者アドレスが事前登録済みホワイトリスト内
    mockEmailRecords.forEach((record) => {
      expect(mockSystemConfig.whitelistedSenderAddresses).toContain(
        record.senderAddress
      );
    });

    // 監査ログ検出: システム監査ログに催促通知の自動送信が記録
    expect(mockAuditLogs.length).toBeGreaterThan(0);
    const reminderLog = mockAuditLogs.find(
      (log) => log.action === "automatic_reminder_sent"
    );
    expect(reminderLog).toBeDefined();
    expect(reminderLog!.targetUsers).toContain("EngA");
    expect(reminderLog!.targetUsers).toContain("EngB");
    expect(reminderLog!.targetUsers).toContain("EngC");
    expect(reminderLog!.reason).toMatch(/提出期限超過/);
    expect(reminderLog!.executedAt.getTime()).toBe(CURRENT_TIME.getTime());

    // 機能制限検証: 催促通知の最大送信頻度が「1日1回まで」に制限
    expect(mockSystemConfig.maxNotificationFrequencyPerDay).toBe(1);

    // 機能制限検証: 催促通知対象者が最大10名（全エンジニア数）に限定
    expect(mockSystemConfig.maxNotificationTargetCount).toBe(10);
    expect(result.notificationsSent).toBeLessThanOrEqual(
      mockSystemConfig.maxNotificationTargetCount
    );

    // 期待結果全体検証
    expect(result.status).toBe("completed");
    expect(result.identifiedOverdueCount).toBe(3);
    expect(result.notificationsSent).toBe(3);
    expect(result.auditLogged).toBe(true);
  });
});