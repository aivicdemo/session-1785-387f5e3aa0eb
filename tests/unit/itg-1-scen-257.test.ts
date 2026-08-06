import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateReportTimestampAndDetermineDelay } from '../../src/logic/it-1-br-1-1-1';

describe('Report Submission Timestamp Delay Determination - Null Timestamp Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-257
  test('should throw error when report submission timestamp is null', () => {
    const reportData = {
      reportId: 'RPT-20240115-001',
      userId: 'USR-00001',
      departmentId: 'DEPT-DEV',
      yesterdayAccomplishments: '完了した業務の説明',
      todayPlans: '本日の予定説明',
      currentChallenges: '抱えている課題説明',
      submissionTimestamp: null,
      meetingStartTime: new Date('2024-01-15T09:00:00Z'),
    };

    expect(() => {
      validateReportTimestampAndDetermineDelay(reportData);
    }).toThrow(/タイムスタンプ|timestamp/i);
  });
});