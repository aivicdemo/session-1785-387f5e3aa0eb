import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { notifyConfirmationEmailOnSubmit } from "../../src/logic/it-2";

describe("確認メール自動配信機能 - 部長のメールアドレスが未定義のときエラーとなる", () => {
  // SCEN-072
  test("部長のメールアドレスが未定義の場合、エラーメッセージを返し、メール送信が実行されない", () => {
    const submission_data = {
      user_id: "ENG001",
      user_name: "田中太郎",
      department_id: "DEV",
      yesterday_accomplishment: "バグ修正3件完了",
      today_plan: "新機能実装開始",
      issues: "データベース接続のタイムアウト問題",
      submitted_at: new Date("2024-01-15T08:30:00Z"),
    };

    const department_master = {
      department_id: "DEV",
      department_name: "開発部",
      manager_user_id: "MGR001",
      manager_name: "山田部長",
      manager_email: null,
    };

    const expect_error = () => {
      notifyConfirmationEmailOnSubmit(submission_data, department_master);
    };

    expect(expect_error).toThrow(/部長のメールアドレス/);
  });
});