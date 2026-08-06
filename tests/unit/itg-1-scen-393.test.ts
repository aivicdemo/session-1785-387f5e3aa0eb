import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendReportAndNotifyDeadlineCheck } from "../../src/logic/it-1-br-1-1-1";

const fetchMock = require("jest-fetch-mock");

describe("報告送信時の期限判定と確認メール配信", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // SCEN-393
  test("送信者が部門マスタに登録されていないとき、期限判定がスキップされ、送信は成功する", async () => {
    const user_id = "USR-001";
    const department_id = null;
    const yesterdays_achievement =
      "前日はデータベース最適化を進めました。インデックス設定を改善し、クエリ速度が30%向上しました。";
    const todays_plan =
      "本日はAPIエンドポイントのテストを実施します。通常ケースと例外ケースの両方をカバーします。";
    const current_issues =
      "データベース接続タイムアウトの問題が時々発生しており、根本原因の調査が必要です。";
    const submitted_at = new Date("2024-01-15T08:30:00Z");
    const morning_meeting_start_time = new Date("2024-01-15T09:00:00Z");

    const log_entries: string[] = [];
    const original_console_log = console.log;
    console.log = (message: string) => {
      log_entries.push(message);
    };

    try {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          success: true,
          report_id: "RPT-20240115-001",
          submitted_at: submitted_at.toISOString(),
          user_id: user_id,
        }),
        { status: 200 }
      );

      fetchMock.mockResponseOnce(
        JSON.stringify({
          email_sent: true,
          recipient_count: 2,
          recipients: [
            { email: "user001@company.com", role: "submitter" },
            { email: "manager001@company.com", role: "department_manager" },
          ],
        }),
        { status: 200 }
      );

      const result = await sendReportAndNotifyDeadlineCheck({
        user_id: user_id,
        department_id: department_id,
        yesterdays_achievement: yesterdays_achievement,
        todays_plan: todays_plan,
        current_issues: current_issues,
        submitted_at: submitted_at,
        morning_meeting_start_time: morning_meeting_start_time,
      });

      expect(result.success).toBe(true);
      expect(result.report_id).toBe("RPT-20240115-001");
      expect(result.deadline_check_executed).toBe(false);
      expect(result.email_notification_sent).toBe(true);
      expect(result.email_recipient_count).toBe(2);

      const skip_message = log_entries.find((msg) =>
        msg.includes("送信者がマスタに登録されていないため期限判定をスキップしました")
      );
      expect(skip_message).toBeDefined();
    } finally {
      console.log = original_console_log;
    }
  });
});