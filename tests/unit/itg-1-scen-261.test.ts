import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import { sendReportWithDelayNotification } from "../../src/logic/it-1-br-1-1-1";

describe("朝会報告送信時刻遅延判定機能 - メール送信", () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-261
  test("部長メールアドレスが undefined のとき処理が失敗する", () => {
    const report_payload = {
      user_id: "eng_001",
      yesterday_achievement: "前日のタスクを完了しました",
      today_plan: "本日のタスクに取り組みます",
      current_issue: "対応中の課題があります",
      sent_at: new Date("2024-01-15T08:30:00Z"),
      department_id: "dev_dept",
    };

    const manager_email = undefined;
    const mailing_list_endpoint = "https://api.example.com/mail/send";

    fetchMock.mockResponseOnce(
      JSON.stringify({ success: true, message_id: "msg_001" }),
      { status: 200 }
    );

    expect(() =>
      sendReportWithDelayNotification(
        report_payload,
        manager_email,
        mailing_list_endpoint
      )
    ).toThrow(/部長メールアドレス/);

    expect(fetchMock.mock.calls.length).toBe(0);
  });
});