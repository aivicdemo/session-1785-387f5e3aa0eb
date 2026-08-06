import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import type { ReportSubmissionEvent, ReportArrivalStatus } from "../../src/logic/it-1-br-1-1-1";
import { recordReportArrival, getArrivalStatusSummary } from "../../src/logic/it-1-br-1-1-1";

const fetchMock = require("jest-fetch-mock");

describe("報告送信時の確認メール自動配信と到着状況把握", () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-473: 報告到着状況把握機能 - 報告の送信順序が逆順（新しい報告が先）で入力された場合、到着状況の判定が正確に行われる
  test("should determine report arrival status correctly regardless of submission order", async () => {
    // Setup: スタブメールサービスをモック
    fetchMock.mockResponseOnce(
      JSON.stringify({ success: true, mailId: "mail_recipient_1" }),
      { status: 200 }
    );
    fetchMock.mockResponseOnce(
      JSON.stringify({ success: true, mailId: "mail_manager_1" }),
      { status: 200 }
    );
    fetchMock.mockResponseOnce(
      JSON.stringify({ success: true, mailId: "mail_recipient_2" }),
      { status: 200 }
    );
    fetchMock.mockResponseOnce(
      JSON.stringify({ success: true, mailId: "mail_manager_2" }),
      { status: 200 }
    );
    fetchMock.mockResponseOnce(
      JSON.stringify({ success: true, mailId: "mail_recipient_3" }),
      { status: 200 }
    );
    fetchMock.mockResponseOnce(
      JSON.stringify({ success: true, mailId: "mail_manager_3" }),
      { status: 200 }
    );

    // Initialize arrival tracking
    const arrivalRecords: ReportSubmissionEvent[] = [];

    // Step 1: 部員Aから報告を送信（送信時刻=09:30）
    const reportA: ReportSubmissionEvent = {
      reportId: "A1",
      employeeId: "EMP_A",
      submissionTimestamp: new Date("2024-01-15T09:30:00Z"),
      yesterdayAccomplishment: "タスクX完了",
      todayPlan: "タスクX検証",
      currentChallenges: "なし",
      departmentId: "DEPT_DEV",
      managerId: "MGR_001",
    };
    arrivalRecords.push(reportA);

    // Verify confirmation emails sent for employee A and manager
    await recordReportArrival(reportA);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const callA1 = fetchMock.mock.calls[0][0];
    expect(callA1).toContain("/mail/send");

    // Step 2: 部員Bから報告を送信（送信時刻=09:15）
    const reportB: ReportSubmissionEvent = {
      reportId: "B1",
      employeeId: "EMP_B",
      submissionTimestamp: new Date("2024-01-15T09:15:00Z"),
      yesterdayAccomplishment: "タスクY完了",
      todayPlan: "タスクY検証",
      currentChallenges: "なし",
      departmentId: "DEPT_DEV",
      managerId: "MGR_001",
    };
    arrivalRecords.push(reportB);
    await recordReportArrival(reportB);
    expect(fetchMock).toHaveBeenCalledTimes(4);

    // Step 3: 部員Cから報告を送信（送信時刻=09:00）
    const reportC: ReportSubmissionEvent = {
      reportId: "C1",
      employeeId: "EMP_C",
      submissionTimestamp: new Date("2024-01-15T09:00:00Z"),
      yesterdayAccomplishment: "タスクZ完了",
      todayPlan: "タスクZ検証",
      currentChallenges: "なし",
      departmentId: "DEPT_DEV",
      managerId: "MGR_001",
    };
    arrivalRecords.push(reportC);
    await recordReportArrival(reportC);
    expect(fetchMock).toHaveBeenCalledTimes(6);

    // Step 4: 到着状況把握機能から記録された報告データを取得
    const arrivalStatus: ReportArrivalStatus = getArrivalStatusSummary(
      arrivalRecords
    );

    // Step 5: 到着順序が時系列で正確に判定されているか検証
    // Expected order by submission timestamp: C1[09:00] → B1[09:15] → A1[09:30]
    expect(arrivalStatus.sortedReports).toHaveLength(3);
    expect(arrivalStatus.sortedReports[0].reportId).toBe("C1");
    expect(arrivalStatus.sortedReports[0].submissionTimestamp).toEqual(
      new Date("2024-01-15T09:00:00Z")
    );
    expect(arrivalStatus.sortedReports[0].employeeId).toBe("EMP_C");

    expect(arrivalStatus.sortedReports[1].reportId).toBe("B1");
    expect(arrivalStatus.sortedReports[1].submissionTimestamp).toEqual(
      new Date("2024-01-15T09:15:00Z")
    );
    expect(arrivalStatus.sortedReports[1].employeeId).toBe("EMP_B");

    expect(arrivalStatus.sortedReports[2].reportId).toBe("A1");
    expect(arrivalStatus.sortedReports[2].submissionTimestamp).toEqual(
      new Date("2024-01-15T09:30:00Z")
    );
    expect(arrivalStatus.sortedReports[2].employeeId).toBe("EMP_A");

    // Verify that arrival status is determined by submission timestamp, not input order
    expect(arrivalStatus.isChronologicallyOrdered).toBe(true);
    expect(arrivalStatus.totalReportsReceived).toBe(3);
  });
});