import { validateReportContent } from "../../src/logic/it-1-br-1-1-1";

describe("報告送信時の確認メール自動配信機能 - 報告内容フォーマット検証", () => {
  // SCEN-494: [edge] 報告内容フォーマット検証機能 - 3項目すべてが空文字の場合、検証が警告される
  test("3項目すべてが空文字の場合、検証結果が警告状態を返し、エラーメッセージを含む", () => {
    const yesterday_accomplishment = "";
    const today_plan = "";
    const current_issues = "";

    const result = validateReportContent({
      yesterday_accomplishment,
      today_plan,
      current_issues,
    });

    expect(result.status).toBe("warning");
    expect(result.message).toContain(
      "昨日やったこと、今日やること、抱えている課題のいずれか1つ以上の入力が必須です"
    );
  });
});