import { assignPromptionPriority } from '../../src/logic/it-1-br-1-1-1';

describe('催促対象部員優先順位付与機能', () => {
  // SCEN-341
  test('未送信部員が0名で遅延部員のみ複数存在する場合、遅延部員が優先順位順に配列される', () => {
    const scheduledTime = new Date('2024-01-15T08:00:00Z');
    
    const nonSubmittedMembers: Array<{ memberId: string; memberName: string }> = [];
    
    const delayedMembers = [
      {
        memberId: 'member_a',
        memberName: '部員A',
        submittedAt: new Date('2024-01-15T09:00:00Z'),
        scheduledAt: scheduledTime,
      },
      {
        memberId: 'member_b',
        memberName: '部員B',
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        scheduledAt: scheduledTime,
      },
      {
        memberId: 'member_c',
        memberName: '部員C',
        submittedAt: new Date('2024-01-15T09:30:00Z'),
        scheduledAt: scheduledTime,
      },
    ];

    const result = assignPromptionPriority({
      nonSubmittedMembers,
      delayedMembers,
    });

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      memberId: 'member_b',
      memberName: '部員B',
      delayMinutes: 120,
      priority: 1,
      priorityReason: 'delayed',
    });
    expect(result[1]).toEqual({
      memberId: 'member_c',
      memberName: '部員C',
      delayMinutes: 90,
      priority: 2,
      priorityReason: 'delayed',
    });
    expect(result[2]).toEqual({
      memberId: 'member_a',
      memberName: '部員A',
      delayMinutes: 60,
      priority: 3,
      priorityReason: 'delayed',
    });
  });
});