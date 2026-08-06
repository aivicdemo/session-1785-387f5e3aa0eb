import { prioritizeProcurementTargets } from '../../src/logic/it-1-br-1-1-1';

describe('催促対象部員優先順位付与機能', () => {
  // SCEN-344
  test('入力された催促対象部員リストが逆順である場合、未送信部員が先頭に配置される', () => {
    const delayedMemberA = {
      userId: 'user_001',
      userName: '遅延部員A',
      status: '遅延' as const,
      submittedAt: new Date('2024-01-15T09:30:00Z'),
      deadlineAt: new Date('2024-01-15T09:00:00Z'),
    };

    const delayedMemberB = {
      userId: 'user_002',
      userName: '遅延部員B',
      status: '遅延' as const,
      submittedAt: new Date('2024-01-15T09:45:00Z'),
      deadlineAt: new Date('2024-01-15T09:00:00Z'),
    };

    const unsubmittedMemberC = {
      userId: 'user_003',
      userName: '未送信部員C',
      status: '未送信' as const,
      submittedAt: null,
      deadlineAt: new Date('2024-01-15T09:00:00Z'),
    };

    const unsubmittedMemberD = {
      userId: 'user_004',
      userName: '未送信部員D',
      status: '未送信' as const,
      submittedAt: null,
      deadlineAt: new Date('2024-01-15T09:00:00Z'),
    };

    const reversedList = [
      delayedMemberA,
      delayedMemberB,
      unsubmittedMemberC,
      unsubmittedMemberD,
    ];

    const result = prioritizeProcurementTargets(reversedList);

    expect(result).toHaveLength(4);
    expect(result[0].userId).toBe('user_003');
    expect(result[0].userName).toBe('未送信部員C');
    expect(result[0].status).toBe('未送信');
    expect(result[0].submittedAt).toBeNull();

    expect(result[1].userId).toBe('user_004');
    expect(result[1].userName).toBe('未送信部員D');
    expect(result[1].status).toBe('未送信');
    expect(result[1].submittedAt).toBeNull();

    expect(result[2].userId).toBe('user_001');
    expect(result[2].userName).toBe('遅延部員A');
    expect(result[2].status).toBe('遅延');
    expect(result[2].submittedAt).toEqual(new Date('2024-01-15T09:30:00Z'));

    expect(result[3].userId).toBe('user_002');
    expect(result[3].userName).toBe('遅延部員B');
    expect(result[3].status).toBe('遅延');
    expect(result[3].submittedAt).toEqual(new Date('2024-01-15T09:45:00Z'));
  });
});