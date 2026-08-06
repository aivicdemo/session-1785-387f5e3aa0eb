import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import {
  sendConfirmationEmailOnReportSubmit,
} from "../../src/logic/it-2";

fetchMock.enableMocks();

describe("送信時の自動確認メール通知", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-069
  test("送信者メールアドレスが未定義のときエラーをスローする", () => {
    const report_data = {
      user_id: "ENG-001",
      department_id: "DEV-001",
      yesterday_achievement: "前日は既存機能の改善に取り組みました",
      today_plan: "本日は新機能の実装を進めます",
      current_issue: "データベース接続の遅延が課題です",
      submitted_at: new Date("2024-01-15T08:30:00Z").toISOString(),
    };

    const config = {
      sender_email: undefined,
      admin_email: "admin@company.com",
      smtp_host: "smtp.company.com",
    };

    expect(() =>
      sendConfirmationEmailOnReportSubmit(report_data, config)
    ).toThrow(/送信者メール/);
  });
});