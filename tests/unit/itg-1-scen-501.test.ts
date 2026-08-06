import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { sendConfirmationEmailsToReporterAndDirector } from "../../src/logic/it-1-br-1-1-1";

// Mock for email sending
const mockMailService = {
  send: jest.fn(),
};

jest.mock("../../src/services/mail", () => ({
  mailService: mockMailService,
}));

describe("未報告催促メール通知機能", () => {
  beforeEach(() => {
    mockMailService.send.mockClear();
  });

  // SCEN-501
  test("朝会開始予定時刻が空文字列の場合、催促メール送信判定処理がスキップされメール送信が呼び出されない", () => {
    const reportSubmissionData = {
      reporter_user_id: "user_123",
      report_content_yesterday: "昨日の成果",
      report_content_today: "本日の予定",
      report_content_issues: "課題",
      submitted_at: new Date("2024-01-15T08:30:00Z"),
      department_id: "dev_001",
    };

    const directorData = {
      user_id: "director_001",
      email: "director@example.com",
      user_name: "部長太郎",
    };

    const reporterData = {
      user_id: "user_123",
      email: "engineer@example.com",
      user_name: "エンジニア花子",
    };

    const morningMeetingScheduledTime = "";

    sendConfirmationEmailsToReporterAndDirector(
      reportSubmissionData,
      reporterData,
      directorData,
      morningMeetingScheduledTime
    );

    expect(mockMailService.send).toHaveBeenCalledTimes(0);
  });
});