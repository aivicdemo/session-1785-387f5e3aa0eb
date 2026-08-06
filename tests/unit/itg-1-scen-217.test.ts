import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { judgeReportSubmissionStatus } from "../../src/logic/it-1";

describe("日報送信状況判定機能", () => {
  let originalDateNow: () => number;

  beforeEach(() => {
    originalDateNow = Date.now;
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  // SCEN-217
  test("月初日の朝会開始予定時刻直前で日報送信状況が正確に判定される", () => {
    // Arrange
    const morningMeetingScheduledTime = new Date("2024-04-01T08:59:00Z");
    const currentTimeOneMinuteBefore = new Date("2024-04-01T08:58:00Z");

    Date.now = () => currentTimeOneMinuteBefore.getTime();

    const submittedMemberIds = [
      "user-001",
      "user-002",
      "user-003",
      "user-004",
      "user-005",
    ];
    const unsubmittedMemberIds = [
      "user-006",
      "user-007",
      "user-008",
      "user-009",
      "user-010",
    ];

    const allMemberIds = [...submittedMemberIds, ...unsubmittedMemberIds];
    const submitRecords: Record<string, Date> = {};

    for (const memberId of submittedMemberIds) {
      submitRecords[memberId] = new Date("2024-04-01T08:30:00Z");
    }

    for (const memberId of unsubmittedMemberIds) {
      submitRecords[memberId] = null as any;
    }

    const input = {
      membersCount: 10,
      morningMeetingScheduledTime: morningMeetingScheduledTime,
      reportSubmitTimestamps: submitRecords,
    };

    // Act
    const result = judgeReportSubmissionStatus(input);

    // Assert
    expect(result.judgedAtTimestamp).toEqual(currentTimeOneMinuteBefore);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(5);
    expect(result.unsubmittedCount).toBe(5);
    expect(result.submittedMemberIds).toEqual(submittedMemberIds);
    expect(result.unsubmittedMemberIds).toEqual(unsubmittedMemberIds);
    expect(result.isBeforeMorningMeetingScheduledTime).toBe(true);
  });
});