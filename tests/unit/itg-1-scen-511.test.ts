import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';
import { sendUnreportedReminder } from '../../src/logic/it-1-br-1-1-1';

describe('未報告催促メール通知機能', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-511
  test('未報告者が0名のとき催促メール送信がスキップされる', async () => {
    const morningMeetingDate = '2024-01-15';
    const meetingStartTime = '09:00:00';
    const departmentId = 'dev-001';

    const reportedUserIds = [
      'user-001',
      'user-002',
      'user-003',
      'user-004',
      'user-005',
      'user-006',
      'user-007',
      'user-008',
      'user-009',
      'user-010',
    ];

    const allUserIds = [
      'user-001',
      'user-002',
      'user-003',
      'user-004',
      'user-005',
      'user-006',
      'user-007',
      'user-008',
      'user-009',
      'user-010',
    ];

    const triggerTime = '2024-01-15T09:00:00Z';

    fetchMock.mockResponseOnce(
      JSON.stringify({
        reportedCount: 10,
        unreportedCount: 0,
        unreportedUserIds: [],
      }),
      { status: 200 }
    );

    const result = await sendUnreportedReminder({
      morningMeetingDate,
      meetingStartTime,
      departmentId,
      reportedUserIds,
      allUserIds,
      triggerTime,
    });

    expect(result.skipped).toBe(true);
    expect(result.unreportedCount).toBe(0);
    expect(result.emailsSent).toBe(0);
    expect(result.reason).toMatch(/未報告者.*0/);
  });
});