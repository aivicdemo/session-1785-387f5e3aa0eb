import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import type { ConfirmationEmailRequest, ConfirmationEmailResponse } from "../../src/logic/it-2";
import { sendConfirmationEmail } from "../../src/logic/it-2";

describe("朝会報告の確認メール自動配信機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-076
  test("送信日時が null のときエラーとなる", () => {
    const request: ConfirmationEmailRequest = {
      reportId: "RPT-2024-001",
      userId: "ENG-001",
      userName: "山田太郎",
      departmentId: "DEV",
      departmentName: "開発部",
      yesterdayAccomplishment: "APIの実装を完了",
      todayPlan: "テストコードを作成",
      challengeIssue: "DBの最適化が必要",
      sendDateTime: null,
      managerEmail: "manager@example.com",
      engineerEmail: "engineer@example.com",
    };

    expect(() => sendConfirmationEmail(request)).toThrow(/送信日時/);
  });
});