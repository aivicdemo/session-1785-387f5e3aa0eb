import { describe, test, expect, beforeEach } from '@jest/globals';
import { judgeReportDeadline } from '../../src/logic/it-1-br-1-1-1';

describe('Report Deadline Judgment - Undefined Submission DateTime', () => {
  // SCEN-384
  test('should not execute deadline judgment when report submission datetime is undefined', () => {
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const submissionDateTime = undefined;
    const departmentId = 'dept-001';
    const userId = 'user-001';

    const result = judgeReportDeadline({
      submissionDateTime,
      morningMeetingStartTime,
      departmentId,
      userId,
    });

    expect(result).toBeNull();
  });
});