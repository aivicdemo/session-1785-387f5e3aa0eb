import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { sendReportWithNotification } from "../../src/logic/it-2";

const mockSendMailToDepartmentHead = jest.fn();

jest.mock("../../src/logic/it-2", () => ({
  sendMailToDepartmentHead: mockSendMailToDepartmentHead,
}));

describe("送信時の自動確認メール通知", () => {
  beforeEach(() => {
    mockSendMailToDepartmentHead.mockClear();
  });

  // SCEN-091
  test("朝会報告送信処理実行時に、送信者の部長宛のメール送信関数が呼び出され、引数に部長のメールアドレスが含まれる", () => {
    const departmentHeadUser = {
      user_id: "user_001",
      user_name: "山田太郎",
      email: "yamada.taro@company.com",
      department_id: "dept_001",
      role: "manager",
    };

    const reportingEngineer = {
      user_id: "user_002",
      user_name: "佐藤花子",
      email: "sato.hanako@company.com",
      department_id: "dept_001",
      role: "engineer",
      department_head_user: departmentHeadUser,
    };

    const morningReportData = {
      reporter_user_id: reportingEngineer.user_id,
      yesterday_accomplishment: "前日は顧客システムのバグ修正を完了しました",
      today_plan: "本日はテスト環境での動作確認を実施する予定です",
      issues_held: "データベース接続のタイムアウト問題が未解決です",
      sent_at: new Date("2024-01-15T09:00:00Z"),
      department_head_email: departmentHeadUser.email,
    };

    sendReportWithNotification(reportingEngineer, morningReportData);

    expect(mockSendMailToDepartmentHead).toHaveBeenCalledTimes(1);
    expect(mockSendMailToDepartmentHead).toHaveBeenCalledWith(
      expect.objectContaining({
        to_email: "yamada.taro@company.com",
        reporter_name: "佐藤花子",
        yesterday_accomplishment: "前日は顧客システムのバグ修正を完了しました",
        today_plan: "本日はテスト環境での動作確認を実施する予定です",
        issues_held: "データベース接続のタイムアウト問題が未解決です",
      })
    );
  });
});