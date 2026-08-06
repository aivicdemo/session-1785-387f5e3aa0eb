import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { getReportArrivalStatus } from "../../src/logic/it-1-br-1-1-1";

describe("報告到着状況把握 - 年度またぎの報告送信対応", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // SCEN-475
  test("報告到着状況把握機能が年度をまたぐ期間内の報告到着状況を正確に把握する", () => {
    const fiscalYearStart = new Date("2024-04-01T00:00:00Z");
    const fiscalYearEnd = new Date("2025-03-31T23:59:59Z");

    const reportSubmissions = [
      {
        userId: "user_a",
        userName: "部員A",
        submissionDate: new Date("2024-04-01T09:00:00Z"),
        fiscalYear: 2024,
      },
      {
        userId: "user_b",
        userName: "部員B",
        submissionDate: new Date("2024-04-01T09:15:00Z"),
        fiscalYear: 2024,
      },
      {
        userId: "user_c",
        userName: "部員C",
        submissionDate: new Date("2024-04-01T09:30:00Z"),
        fiscalYear: 2024,
      },
      {
        userId: "user_d",
        userName: "部員D",
        submissionDate: new Date("2024-04-01T09:45:00Z"),
        fiscalYear: 2024,
      },
      {
        userId: "user_e",
        userName: "部員E",
        submissionDate: new Date("2024-04-01T10:00:00Z"),
        fiscalYear: 2024,
      },
      {
        userId: "user_f",
        userName: "部員F",
        submissionDate: new Date("2024-04-02T09:00:00Z"),
        fiscalYear: 2024,
      },
      {
        userId: "user_g",
        userName: "部員G",
        submissionDate: new Date("2024-04-02T09:15:00Z"),
        fiscalYear: 2024,
      },
      {
        userId: "user_h",
        userName: "部員H",
        submissionDate: new Date("2024-04-02T09:30:00Z"),
        fiscalYear: 2024,
      },
      {
        userId: "user_i",
        userName: "部員I",
        submissionDate: new Date("2024-04-02T09:45:00Z"),
        fiscalYear: 2024,
      },
      {
        userId: "user_j",
        userName: "部員J",
        submissionDate: new Date("2024-04-02T10:00:00Z"),
        fiscalYear: 2024,
      },
      {
        userId: "user_a",
        userName: "部員A",
        submissionDate: new Date("2025-03-31T17:00:00Z"),
        fiscalYear: 2024,
      },
      {
        userId: "user_b",
        userName: "部員B",
        submissionDate: new Date("2025-03-31T17:15:00Z"),
        fiscalYear: 2024,
      },
      {
        userId: "user_c",
        userName: "部員C",
        submissionDate: new Date("2025-03-31T17:30:00Z"),
        fiscalYear: 2024,
      },
      {
        userId: "user_d",
        userName: "部員D",
        submissionDate: new Date("2025-04-01T09:00:00Z"),
        fiscalYear: 2025,
      },
      {
        userId: "user_e",
        userName: "部員E",
        submissionDate: new Date("2025-04-01T09:15:00Z"),
        fiscalYear: 2025,
      },
    ];

    const result = getReportArrivalStatus({
      periodStart: fiscalYearStart,
      periodEnd: fiscalYearEnd,
      submissions: reportSubmissions,
    });

    expect(result.targetPeriodStart).toEqual(fiscalYearStart);
    expect(result.targetPeriodEnd).toEqual(fiscalYearEnd);
    expect(result.arrivalsByDate).toEqual({
      "2024-04-01": 5,
      "2024-04-02": 5,
      "2025-03-31": 3,
    });
    expect(result.totalArrivalCount).toBe(13);
    expect(result.excludedSubmissionCount).toBe(2);
  });
});