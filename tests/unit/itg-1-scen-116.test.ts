import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import { submitDailyReport } from "../../src/logic/it-1";

fetchMock.enableMocks();

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-116: [normal] 確認メール自動配信機能 - 報告送信履歴に送信レコードが記録される
  test("should record daily report submission history and send confirmation emails", async () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    afterEach(() => {
      fetchMock.resetMocks();
    });

    // テストユーザーID
    const user_id = "ENG-001";
    const send_date_time_1 = new Date("2024-01-15T08:30:00Z");
    const send_date_time_2 = new Date("2024-01-15T08:45:00Z");

    // 1回目の日報データ
    const first_report_data = {
      user_id: user_id,
      yesterday_achievement: "ドキュメント作成",
      today_plan: "テスト実施",
      current_issue: "環境構築の遅延",
      send_timestamp: send_date_time_1.toISOString(),
    };

    // 2回目の日報データ
    const second_report_data = {
      user_id: user_id,
      yesterday_achievement: "テスト実施完了",
      today_plan: "コードレビュー",
      current_issue: "デプロイ環境設定",
      send_timestamp: send_date_time_2.toISOString(),
    };

    // メール送信API（確認メール配信用）のモック設定 - 1回目
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: "success",
        message: "Confirmation email sent",
        email_id: "EMAIL-001",
      }),
      { status: 200 }
    );

    // 送信履歴記録API - 1回目
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: "success",
        submission_history_id: "HIST-001",
        recorded_at: send_date_time_1.toISOString(),
      }),
      { status: 200 }
    );

    // メール送信API（確認メール配信用）のモック設定 - 2回目
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: "success",
        message: "Confirmation email sent",
        email_id: "EMAIL-002",
      }),
      { status: 200 }
    );

    // 送信履歴記録API - 2回目
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: "success",
        submission_history_id: "HIST-002",
        recorded_at: send_date_time_2.toISOString(),
      }),
      { status: 200 }
    );

    // 送信履歴テーブル取得API - 1回目送信後
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: "success",
        submission_histories: [
          {
            submission_history_id: "HIST-001",
            user_id: user_id,
            yesterday_achievement: "ドキュメント作成",
            today_plan: "テスト実施",
            current_issue: "環境構築の遅延",
            sent_at: send_date_time_1.toISOString(),
          },
        ],
        total_count: 1,
      }),
      { status: 200 }
    );

    // 送信履歴テーブル取得API - 2回目送信後
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: "success",
        submission_histories: [
          {
            submission_history_id: "HIST-001",
            user_id: user_id,
            yesterday_achievement: "ドキュメント作成",
            today_plan: "テスト実施",
            current_issue: "環境構築の遅延",
            sent_at: send_date_time_1.toISOString(),
          },
          {
            submission_history_id: "HIST-002",
            user_id: user_id,
            yesterday_achievement: "テスト実施完了",
            today_plan: "コードレビュー",
            current_issue: "デプロイ環境設定",
            sent_at: send_date_time_2.toISOString(),
          },
        ],
        total_count: 2,
      }),
      { status: 200 }
    );

    // 1回目の日報送信
    const first_submission_result = await submitDailyReport(first_report_data);

    // 1回目送信後の検証
    expect(first_submission_result.status).toBe("success");
    expect(first_submission_result.submission_history_id).toBe("HIST-001");
    expect(first_submission_result.confirmation_email_sent).toBe(true);

    // 1回目送信後の送信履歴確認
    const first_history_response = await fetch("/api/submission-histories", {
      method: "GET",
      headers: { "User-ID": user_id },
    });
    const first_history_data = await first_history_response.json();

    expect(first_history_data.status).toBe("success");
    expect(first_history_data.total_count).toBe(1);
    expect(first_history_data.submission_histories).toHaveLength(1);
    expect(first_history_data.submission_histories[0]).toEqual({
      submission_history_id: "HIST-001",
      user_id: user_id,
      yesterday_achievement: "ドキュメント作成",
      today_plan: "テスト実施",
      current_issue: "環境構築の遅延",
      sent_at: send_date_time_1.toISOString(),
    });

    // 2回目の日報送信
    const second_submission_result = await submitDailyReport(
      second_report_data
    );

    // 2回目送信後の検証
    expect(second_submission_result.status).toBe("success");
    expect(second_submission_result.submission_history_id).toBe("HIST-002");
    expect(second_submission_result.confirmation_email_sent).toBe(true);

    // 2回目送信後の送信履歴確認
    const second_history_response = await fetch("/api/submission-histories", {
      method: "GET",
      headers: { "User-ID": user_id },
    });
    const second_history_data = await second_history_response.json();

    expect(second_history_data.status).toBe("success");
    expect(second_history_data.total_count).toBe(2);
    expect(second_history_data.submission_histories).toHaveLength(2);

    // 1件目のレコード確認
    expect(second_history_data.submission_histories[0]).toEqual({
      submission_history_id: "HIST-001",
      user_id: user_id,
      yesterday_achievement: "ドキュメント作成",
      today_plan: "テスト実施",
      current_issue: "環境構築の遅延",
      sent_at: send_date_time_1.toISOString(),
    });

    // 2件目のレコード確認
    expect(second_history_data.submission_histories[1]).toEqual({
      submission_history_id: "HIST-002",
      user_id: user_id,
      yesterday_achievement: "テスト実施完了",
      today_plan: "コードレビュー",
      current_issue: "デプロイ環境設定",
      sent_at: send_date_time_2.toISOString(),
    });

    // fetch呼び出し数の検証
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});