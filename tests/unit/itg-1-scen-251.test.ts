import { describe, test, expect, beforeEach } from "@jest/globals";
import { generateConfirmationEmailForManager } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-251: [normal] 遅延状況を含むメール内容の生成機能
  test("遅延フラグがtrueの場合、部長への確認メール本文に遅延情報が含まれる", () => {
    const report_id = "report_001";
    const reporter_id = "user_eng_001";
    const reporter_name = "田中太郎";
    const department_id = "dept_dev_001";
    const yesterday_achievement = "APIの認証機能を実装完了";
    const today_plan = "テストコードの作成";
    const current_issue = "DBの接続タイムアウト問題が未解決";
    const submitted_at = new Date("2024-01-15T10:30:00Z");
    const meeting_start_time = new Date("2024-01-15T09:00:00Z");
    const is_delayed = true;

    const email_body = generateConfirmationEmailForManager({
      report_id,
      reporter_id,
      reporter_name,
      department_id,
      yesterday_achievement,
      today_plan,
      current_issue,
      submitted_at,
      meeting_start_time,
      is_delayed,
    });

    expect(email_body).toMatch(/【遅延報告】|遅延状況：あり/);
    expect(email_body).toContain(reporter_name);
    expect(email_body).toContain(yesterday_achievement);
    expect(email_body).toContain(today_plan);
    expect(email_body).toContain(current_issue);
  });
});