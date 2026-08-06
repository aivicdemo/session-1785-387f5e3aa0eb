import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendConfirmationEmailsOnReportSubmission } from "../../src/logic/it-1-br-1-1-1";

describe("報告送信時の確認メール自動配信機能", () => {
  let mockMailService: {
    sendEmail: jest.Mock;
  };

  beforeEach(() => {
    mockMailService = {
      sendEmail: jest.fn().mockResolvedValue({ success: true }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-386
  test("送信者情報が null のときは期限判定が実行されず例外がスローされる", async () => {
    const reportSubmissionInput = {
      reportId: "RPT-20240115-001",
      submittedAt: new Date("2024-01-15T08:30:00Z"),
      reportContent: {
        yesterdayAccomplishment: "システムテスト完了",
        todayPlan: "リグレッション実行",
        currentIssue: "DB接続タイムアウト",
      },
      submitterUserId: null,
      departmentId: "DEV-001",
      departmentHeadUserId: "USR-0001",
    };

    const scheduleConfig = {
      morningMeetingStartTime: new Date("2024-01-15T09:00:00Z"),
    };

    expect(() =>
      sendConfirmationEmailsOnReportSubmission(
        reportSubmissionInput,
        scheduleConfig,
        mockMailService
      )
    ).toThrow(/送信者情報/);

    expect(mockMailService.sendEmail).not.toHaveBeenCalled();
  });
});