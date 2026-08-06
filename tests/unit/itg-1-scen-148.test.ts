import { submitDailyReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-148
  test("送信日時が null のとき送信を拒否する", () => {
    const daily_report_data = {
      yesterday_achievement: "昨日の実績を入力しました",
      today_plan: "今日の予定を入力しました",
      current_issues: "抱えている課題を入力しました",
      send_datetime: null,
      user_id: "user_001",
      department_id: "dept_001",
    };

    expect(() => submitDailyReport(daily_report_data)).toThrow(/送信日時/);
  });
});