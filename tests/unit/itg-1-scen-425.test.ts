import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { notifyUnsubmittedMembers } from '../../src/logic/it-1-br-1-1-1';

describe('未提出部員通知機能 - メールアドレスバリデーション', () => {
  // SCEN-425
  test('部長のメールアドレスが null のときエラーをスロー', () => {
    const mockSendEmail = jest.fn();

    const department_head_user_id = 'user-001';
    const department_head_email = null;
    const unsubmitted_members = [
      {
        user_id: 'user-101',
        user_name: 'Engineer A',
        department_id: 'dept-001',
      },
      {
        user_id: 'user-102',
        user_name: 'Engineer B',
        department_id: 'dept-001',
      },
    ];
    const morning_meeting_start_time = new Date('2024-01-15T09:00:00Z');

    expect(() => {
      notifyUnsubmittedMembers(
        {
          department_head_user_id,
          department_head_email,
          morning_meeting_start_time,
        },
        unsubmitted_members,
        mockSendEmail
      );
    }).toThrow(/部長のメールアドレス/);

    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});