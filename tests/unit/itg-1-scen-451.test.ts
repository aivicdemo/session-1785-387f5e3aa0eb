import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { fetchReportArrivalStatus } from "../../src/logic/it-1-br-1-1-1";

const fetchMock = require("jest-fetch-mock");

describe("報告到着状況把握機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-451
  it("部門IDが欠落しているとき、400エラーが返却される", async () => {
    const search_condition_without_department_id = {
      user_id: "USR001",
      search_date: "2024-01-15",
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        error_code: "INVALID_REQUEST",
        error_message: "部門IDは必須項目です",
      }),
      { status: 400 }
    );

    const response = await fetch(
      "http://localhost:3000/api/report/arrival-status",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(search_condition_without_department_id),
      }
    );

    expect(response.status).toBe(400);

    const response_body = await response.json();
    expect(response_body.error_message).toMatch(/部門ID/);
  });
});