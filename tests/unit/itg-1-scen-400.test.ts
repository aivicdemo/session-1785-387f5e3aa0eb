import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { determineReportDeadlineStatus } from "../../src/logic/it-1-br-1-1-1";

describe("Report Submission Email Auto-Delivery - Deadline Judgment on Month-Start Morning", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-400: [edge] 報告期限判定機能 - 月初日の朝会開始時刻において期限判定が正常に機能する
  test("should determine report deadline status as within-deadline on month-start morning meeting time", () => {
    const currentDateTime = new Date("2024-04-01T09:00:00Z");
    const morningMeetingStartTime = "09:00";
    const reportDeadlineDay = "2024-03-29";

    const result = determineReportDeadlineStatus({
      currentDateTime,
      morningMeetingStartTime,
      reportDeadlineDay,
    });

    expect(result.status).toBe("within-deadline");
    expect(result.isAcceptable).toBe(true);
    expect(typeof result.statusMessage).toBe("string");
    expect(result.statusMessage.length).toBeGreaterThan(0);
  });
});