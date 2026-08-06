import { describePriorityMissingReports } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能 - 催促対象部員の優先順位付け', () => {
  test('SCEN-322: 未送信部員が複数存在する場合、全員が未送信グループとして同一優先度で抽出される', () => {
    // Arrange
    const meetingStartTime = new Date('2024-01-15T09:00:00Z');
    
    const memberA = {
      userId: 'user_a',
      name: '部員A',
      departmentId: 'dev',
      submissionStatus: 'not_submitted' as const,
      submissionTime: null,
    };
    
    const memberB = {
      userId: 'user_b',
      name: '部員B',
      departmentId: 'dev',
      submissionStatus: 'not_submitted' as const,
      submissionTime: null,
    };
    
    const memberC = {
      userId: 'user_c',
      name: '部員C',
      departmentId: 'dev',
      submissionStatus: 'not_submitted' as const,
      submissionTime: null,
    };
    
    const memberD = {
      userId: 'user_d',
      name: '部員D',
      departmentId: 'dev',
      submissionStatus: 'not_submitted' as const,
      submissionTime: null,
    };
    
    const allMembers = [memberA, memberB, memberC, memberD];
    
    // Act
    const result = describePriorityMissingReports({
      meetingStartTime,
      members: allMembers,
    });
    
    // Assert
    // 期待結果: 未送信部員 4 名すべてが同一グループ（同一優先度）で返される
    expect(result.urgencyGroups).toHaveLength(1);
    
    const notSubmittedGroup = result.urgencyGroups[0];
    expect(notSubmittedGroup.priority).toBe(1);
    expect(notSubmittedGroup.status).toBe('not_submitted');
    expect(notSubmittedGroup.members).toHaveLength(4);
    
    const extractedUserIds = notSubmittedGroup.members.map(m => m.userId).sort();
    const expectedUserIds = ['user_a', 'user_b', 'user_c', 'user_d'].sort();
    expect(extractedUserIds).toEqual(expectedUserIds);
    
    // 各メンバーが同一グループに属していることを確認
    expect(notSubmittedGroup.members).toContainEqual(
      expect.objectContaining({ userId: 'user_a', name: '部員A' })
    );
    expect(notSubmittedGroup.members).toContainEqual(
      expect.objectContaining({ userId: 'user_b', name: '部員B' })
    );
    expect(notSubmittedGroup.members).toContainEqual(
      expect.objectContaining({ userId: 'user_c', name: '部員C' })
    );
    expect(notSubmittedGroup.members).toContainEqual(
      expect.objectContaining({ userId: 'user_d', name: '部員D' })
    );
    
    // 個別の優先順位付け（相対的な順序付け）が行われていないことを確認
    // 全メンバーが同じグループに属しているため、グループ内での順序付けはない
    expect(result.urgencyGroups).not.toContainEqual(
      expect.objectContaining({
        priority: expect.any(Number),
        members: expect.arrayContaining([
          expect.objectContaining({ userId: 'user_a' }),
        ]),
      })
    );
  });
});