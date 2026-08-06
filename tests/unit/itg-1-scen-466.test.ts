import { describe, test, expect, beforeEach } from "@jest/globals";
import { verifyReportArrivalStatus } from "../../src/logic/it-1-br-1-1-1";

const fetchMock = require("jest-fetch-mock");

describe("報告送信時の確認メール自動配信機能 - 権限検証", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-466
  test("部長権限を持たないユーザーがアクセスした場合、403 Forbiddenを返す", async () => {
    const non_manager_user_id = "eng_user_001";
    const non_manager_role = "engineer";
    const department_id = "dev_dept_001";
    const access_timestamp = "2024-01-15T08:00:00Z";

    fetchMock.mockResponseOnce(
      JSON.stringify({
        error: "Forbidden",
        message: "このページへのアクセス権限がありません",
        status: 403,
      }),
      { status: 403 }
    );

    const result = await verifyReportArrivalStatus({
      user_id: non_manager_user_id,
      user_role: non_manager_role,
      department_id: department_id,
      timestamp: access_timestamp,
    });

    expect(result).toEqual({
      success: false,
      status_code: 403,
      error_message: "このページへのアクセス権限がありません",
    });
  });
});