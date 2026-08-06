import { submitDailyReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  test("SCEN-152: 報告送信履歴テーブルのクエリがタイムアウトエラーを返すとき送信を拒否する", async () => {
    const user_id = "user_001";
    const report_date = "2024-01-15";
    const yesterday_accomplishment = "昨日は顧客APIの統合テストを完了しました";
    const today_plan = "本日はレスポンス時間の最適化に取り組みます";
    const current_issues = "データベース接続プールのメモリリーク対策が必要です";

    const mockDuplicateCheckFn = jest.fn().mockRejectedValueOnce(
      new Error("Database query timeout after 30000ms")
    );

    const result = await submitDailyReport(
      {
        user_id,
        report_date,
        yesterday_accomplishment,
        today_plan,
        current_issues,
      },
      mockDuplicateCheckFn
    );

    expect(result.success).toBe(false);
    expect(result.error_message).toMatch(/送信に失敗しました/);
    expect(result.error_message).toMatch(/時間をおいて再度お試しください/);
    expect(result.submitted_at).toBeNull();
    expect(result.retained_input).toEqual({
      yesterday_accomplishment,
      today_plan,
      current_issues,
    });
    expect(mockDuplicateCheckFn).toHaveBeenCalledWith(user_id, report_date);
  });
});