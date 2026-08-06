import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendConfirmationEmailsToReporterAndManager } from "../../src/logic/it-1-br-1-1-1";

// Mock implementation
const mockLogger = {
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
};

const mockEmailService = {
  send: jest.fn(),
};

jest.mock("../../src/services/logger", () => ({
  getLogger: () => mockLogger,
}));

jest.mock("../../src/services/email", () => ({
  getEmailService: () => mockEmailService,
}));

describe("報告送信時の確認メール自動配信機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.warn.mockClear();
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockEmailService.send.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-500
  test("朝会開始予定時刻が null の場合、未報告催促ロジックが中断され、催促メール送信がスキップされ、警告ログが出力される", async () => {
    const reportData = {
      reporterId: "ENG001",
      reporterEmail: "engineer@example.com",
      reporterName: "田中太郎",
      yesterdayAchievements: "機能Aの実装完了",
      todayPlan: "機能Bの実装開始",
      challenges: "データベース接続の最適化が課題",
      submittedAt: new Date("2024-01-15T08:30:00Z"),
    };

    const departmentHead = {
      userId: "MGMT001",
      email: "manager@example.com",
      name: "山田部長",
    };

    const meetingStartTime = null;

    const result = await sendConfirmationEmailsToReporterAndManager(
      reportData,
      departmentHead,
      meetingStartTime
    );

    expect(result.emailsSent).toBe(0);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("朝会開始予定時刻が未設定のため処理をスキップ");

    expect(mockEmailService.send).not.toHaveBeenCalled();

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringMatching(/朝会開始予定時刻が未設定のため処理をスキップ/)
    );

    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
  });
});