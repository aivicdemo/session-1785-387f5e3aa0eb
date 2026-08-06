import { describe, test, expect, beforeEach } from "@jest/globals";
import { sendConfirmationEmailWithValidation } from "../../src/logic/it-1-br-1-1-1";

describe("日報統一フォーマット整形・表示機能 - 確認メール自動配信", () => {
  // SCEN-237
  test("抱えている課題が空文字列の場合、バリデーションエラーを返す", () => {
    const input_yesterday_result = "タスクA完了";
    const input_today_plan = "タスクB実施";
    const input_issues = "";
    const sender_user_id = "eng_001";
    const department_head_user_id = "head_001";
    const submission_datetime = new Date("2024-01-15T09:00:00Z");

    expect(() => {
      sendConfirmationEmailWithValidation({
        yesterday_result: input_yesterday_result,
        today_plan: input_today_plan,
        issues: input_issues,
        sender_user_id: sender_user_id,
        department_head_user_id: department_head_user_id,
        submission_datetime: submission_datetime,
      });
    }).toThrow(/抱えている課題/);
  });
});