import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { getReportArrivalStatus } from "../../src/logic/it-1-br-1-1-1";

describe("Report Arrival Status - Month Boundary Edge Case", () => {
  let originalDateNow: () => number;

  beforeEach(() => {
    originalDateNow = Date.now;
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  // SCEN-474
  test("should correctly identify report arrivals across month boundary (2024-01-31 23:59:59 to 2024-02-01 00:00:00)", () => {
    const morningMeetingDate = "2024-01-31";
    const meetingStartTime = new Date("2024-01-31T09:00:00Z");

    // Month-end time: 2024-01-31 23:59:59 UTC
    const monthEndTimestamp = new Date("2024-01-31T23:59:59Z").getTime();
    Date.now = jest.fn(() => monthEndTimestamp);

    const reportAtMonthEnd = {
      reportId: "rpt_001",
      userId: "user_001",
      departmentId: "dept_dev",
      submittedAt: new Date("2024-01-31T23:59:59Z"),
      yesterday: "Completed feature A",
      today: "Review feature B",
      challenges: "Performance issue on module X",
    };

    const arrivalStatusAtMonthEnd = getReportArrivalStatus(
      [reportAtMonthEnd],
      meetingStartTime,
      morningMeetingDate
    );

    expect(arrivalStatusAtMonthEnd.morningMeetingDate).toBe("2024-01-31");
    expect(arrivalStatusAtMonthEnd.totalArrived).toBe(1);
    expect(arrivalStatusAtMonthEnd.reportArrivals).toHaveLength(1);
    expect(arrivalStatusAtMonthEnd.reportArrivals[0].status).toBe("on_time");

    // Month-start time: 2024-02-01 00:00:00 UTC
    const monthStartTimestamp = new Date("2024-02-01T00:00:00Z").getTime();
    Date.now = jest.fn(() => monthStartTimestamp);

    const reportAtMonthStart = {
      reportId: "rpt_002",
      userId: "user_002",
      departmentId: "dept_dev",
      submittedAt: new Date("2024-02-01T00:00:00Z"),
      yesterday: "Completed feature B",
      today: "Deploy to staging",
      challenges: "Network latency",
    };

    // Both reports should be aggregated under the same morning meeting date
    const allReports = [reportAtMonthEnd, reportAtMonthStart];
    const arrivalStatusAtMonthStart = getReportArrivalStatus(
      allReports,
      meetingStartTime,
      morningMeetingDate
    );

    expect(arrivalStatusAtMonthStart.morningMeetingDate).toBe("2024-01-31");
    expect(arrivalStatusAtMonthStart.totalArrived).toBe(2);
    expect(arrivalStatusAtMonthStart.reportArrivals).toHaveLength(2);

    const arrival1 = arrivalStatusAtMonthStart.reportArrivals.find(
      (r) => r.reportId === "rpt_001"
    );
    const arrival2 = arrivalStatusAtMonthStart.reportArrivals.find(
      (r) => r.reportId === "rpt_002"
    );

    expect(arrival1).toBeDefined();
    expect(arrival1?.status).toBe("on_time");
    expect(arrival1?.submittedAt).toEqual(new Date("2024-01-31T23:59:59Z"));

    expect(arrival2).toBeDefined();
    expect(arrival2?.status).toBe("on_time");
    expect(arrival2?.submittedAt).toEqual(new Date("2024-02-01T00:00:00Z"));

    // Verify unified display format under single morning meeting date
    expect(arrivalStatusAtMonthStart.displayLabel).toBe(
      `${morningMeetingDate}朝会分：到着${arrivalStatusAtMonthStart.totalArrived}件`
    );
  });
});