import { sendReportNotificationToManager } from "../../src/logic/it-1-br-1-1-1";

describe("朝会開始前の日報送信状況確認・部長通知機能", () => {
  // SCEN-205
  test("部長のメールアドレスが空文字のとき、部長への通知処理がエラーになる", () => {
    const report_id = "RPT-20240115-001";
    const engineer_name = "田中太郎";
    const yesterday_achievement = "前日のタスクAを完了";
    const today_plan = "本日のタスクBを開始";
    const current_issues = "リスク項目Cが発生";
    const manager_email = "";
    const sent_at = new Date("2024-01-15T08:30:00Z");

    expect(() => {
      sendReportNotificationToManager({
        report_id,
        engineer_name,
        yesterday_achievement,
        today_plan,
        current_issues,
        manager_email,
        sent_at,
      });
    }).toThrow(/メールアドレス/);
  });
});