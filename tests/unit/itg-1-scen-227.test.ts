import { formatAndDisplayReport } from "../../src/logic/it-1-br-1-1-1";

describe("日報統一フォーマット整形・表示機能", () => {
  // SCEN-227
  test("送信者情報が欠けている場合、エラーが発生する", () => {
    const incompleteReportData = {
      yesterday_achievement: "昨日は機能Aの実装を完了しました",
      today_plan: "本日は機能Bのテストを実施します",
      current_issues: "リソース不足による進捗遅延",
      sender_user_id: undefined,
      sender_user_name: undefined,
      sender_department: undefined,
    };

    expect(() => formatAndDisplayReport(incompleteReportData)).toThrow(
      /送信者情報/
    );
  });
});