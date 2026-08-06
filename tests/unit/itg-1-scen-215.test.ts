import { validateAndSubmitReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-215: [edge] 日報送信状況判定機能 - 朝会開始予定時刻が月をまたぐ場合でも正しく判定される
  test("朝会開始予定時刻が月末日で現在日時が月初日の場合、当日送信済みと正しく判定される", () => {
    // Arrange: 朝会開始予定時刻を月末日の23:59に設定
    const morning_assembly_scheduled_time = new Date("2024-02-28T23:59:00Z");
    
    // 現在日時をシステムで月初日の00:01に設定
    const current_time = new Date("2024-03-01T00:01:00Z");
    
    // 部員Aが日報を送信する際の入力データ
    const report_input = {
      user_id: "user_001",
      yesterday_achievement: "前日実装したAPIの単体テストを完了し、バグ2件を修正した",
      today_plan: "本日は認証機能の実装に着手し、ユーザーログイン画面を完成させる予定",
      current_issues: "データベース接続タイムアウトの問題がまだ未解決のため、インフラチームに相談予定",
      submitted_at: current_time,
      scheduled_assembly_time: morning_assembly_scheduled_time,
    };

    // Act: 日報送信状況判定機能を実行
    const result = validateAndSubmitReport(report_input);

    // Assert: 部員Aの日報が『当日送信済み』と判定される
    expect(result).toEqual({
      is_submitted: true,
      submission_status: "submitted_on_time",
      user_id: "user_001",
      submitted_at: current_time,
      is_same_day: true,
    });
  });
});