import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import { sendConfirmationEmailsToReporterAndDirector } from "../../src/logic/it-1-br-1-1-1";

fetchMock.enableMocks();

describe("報告送信時の確認メール自動配信機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-207
  test("メール送信サービスが利用不可のとき、部長への通知がエラーになる", async () => {
    const reporter_user_id = "ENG-001";
    const reporter_email = "engineer@example.com";
    const director_email = "director@example.com";
    const report_date = "2024-01-15";
    const yesterday_achievement = "昨日は機能Aの実装を完了した";
    const today_plan = "本日は機能Bのテストを実施する予定";
    const current_issues = "データベース接続タイムアウトの問題が発生している";

    const email_service_url = "https://email-service.internal/send";

    // メール送信サービスをスタブ設定: SMTP接続失敗エラーを返す
    fetchMock.mockResponseOnce(
      JSON.stringify({
        error: "SMTP connection failed",
        message: "Unable to connect to mail server",
      }),
      { status: 503 }
    );

    const request_payload = {
      reporter_user_id: reporter_user_id,
      reporter_email: reporter_email,
      director_email: director_email,
      report_date: report_date,
      yesterday_achievement: yesterday_achievement,
      today_plan: today_plan,
      current_issues: current_issues,
      email_service_url: email_service_url,
    };

    // メール送信がエラーになることを期待
    await expect(
      sendConfirmationEmailsToReporterAndDirector(request_payload)
    ).rejects.toThrow(/メール送信サービス/);
  });
});