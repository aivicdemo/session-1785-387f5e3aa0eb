import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendConfirmationEmailWithErrorHandling } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  let mockLogger: { error: jest.Mock; info: jest.Mock };
  let mockEmailService: { sendEmail: jest.Mock };
  let mockDatabase: { saveMorningReport: jest.Mock };

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
    };

    mockEmailService = {
      sendEmail: jest.fn(),
    };

    mockDatabase = {
      saveMorningReport: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-134
  test("should catch SendEmailError and halt confirmation email delivery when email service fails", () => {
    const user_id = "ENG001";
    const report_date = "2024-01-15";
    const yesterday_achievement = "前日は機能A の開発を完了";
    const today_plan = "本日は機能B の実装を開始";
    const current_issue = "機能C の仕様が未確定";
    const manager_email = "manager@company.example.com";
    const reporter_email = "engineer@company.example.com";

    const send_email_error = new Error("SendEmailError: SMTP connection failed");
    send_email_error.name = "SendEmailError";

    mockEmailService.sendEmail.mockImplementation(() => {
      throw send_email_error;
    });

    const report_input = {
      user_id,
      report_date,
      yesterday_achievement,
      today_plan,
      current_issue,
      manager_email,
      reporter_email,
    };

    const emailService = mockEmailService;
    const logger = mockLogger;
    const database = mockDatabase;

    expect(() => {
      sendConfirmationEmailWithErrorHandling(
        report_input,
        emailService,
        logger,
        database
      );
    }).toThrow(/SendEmailError/);

    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);

    expect(mockLogger.error).toHaveBeenCalled();
    const error_log_call = mockLogger.error.mock.calls[0];
    expect(error_log_call[0]).toMatch(/メール送信に失敗しました/);

    expect(mockDatabase.saveMorningReport).not.toHaveBeenCalled();
  });
});