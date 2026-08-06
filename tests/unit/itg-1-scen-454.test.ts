import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { validateReportArrivalStatus } from "../../src/logic/it-1-br-1-1-1";

describe("報告到着状況把握機能 - 確認メール受信日時検証", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-454
  test("確認メール受信日時が欠落しているときはエラーをスローする", () => {
    const invalid_report_status_null = {
      user_id: "USR-001",
      user_name: "山田太郎",
      department_id: "DEPT-001",
      department_name: "開発部",
      report_sent_at: new Date("2024-01-15T08:30:00Z"),
      report_sent_status: "sent",
      confirm_mail_received_at: null as unknown as Date,
    };

    expect(() => validateReportArrivalStatus(invalid_report_status_null)).toThrow(
      /確認メール受信日時/
    );
  });

  // SCEN-454
  test("確認メール受信日時が undefined のときはエラーをスローする", () => {
    const invalid_report_status_undefined = {
      user_id: "USR-002",
      user_name: "鈴木花子",
      department_id: "DEPT-001",
      department_name: "開発部",
      report_sent_at: new Date("2024-01-15T08:45:00Z"),
      report_sent_status: "sent",
      confirm_mail_received_at: undefined as unknown as Date,
    };

    expect(() => validateReportArrivalStatus(invalid_report_status_undefined)).toThrow(
      /確認メール受信日時/
    );
  });
});