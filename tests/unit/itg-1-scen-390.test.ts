import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateReportingDeadline } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-390
  test('朝会開始時刻が不正な日時形式のとき、期限判定が実行されない', () => {
    const invalidDateFormats = [
      '2024-13-45 25:70:00',
      'invalid-date',
      '',
      'not-a-date',
      '2024/13/45',
      '2024-01-01T25:00:00Z',
      null,
      undefined,
    ];

    invalidDateFormats.forEach((invalidMeetingStartTime) => {
      expect(() => {
        validateReportingDeadline({
          meetingStartTime: invalidMeetingStartTime as any,
          reportSubmittedAt: new Date('2024-01-15T08:30:00Z'),
          userId: 'user-001',
          departmentId: 'dept-001',
        });
      }).toThrow(/朝会開始時刻|日時形式|無効|invalid/i);
    });
  });
});