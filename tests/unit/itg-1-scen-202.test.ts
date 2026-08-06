import { sendConfirmationEmails } from "../../src/logic/it-1-br-1-1-1";

describe("朝会報告管理システム - 報告送信時の確認メール自動配信", () => {
  // SCEN-202
  test("部員一覧が未取得のとき、送信状況の確認処理がエラーになる", () => {
    const input_employee_list = null;
    const input_report_data = {
      user_id: "ENG001",
      department_id: "DEV",
      yesterday_result: "昨日の実績テキスト",
      today_plan: "本日の予定テキスト",
      issues: "抱えている課題テキスト",
      sent_at: new Date("2024-01-15T09:00:00Z"),
    };
    const input_manager_id = "MGR001";

    expect(() =>
      sendConfirmationEmails(input_employee_list, input_report_data, input_manager_id)
    ).toThrow(/部員一覧の取得に失敗しました/);
  });
});