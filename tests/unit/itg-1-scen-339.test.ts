import { assignPrioritiesToRemindTargets } from '../../src/logic/it-1-br-1-1-1';

describe('催促対象部員優先順位付与機能', () => {
  // SCEN-339
  test('未送信部員と遅延部員が同数存在する場合、未送信部員がすべて優先される', () => {
    // Arrange
    const unreportedMembers = [
      { userId: 'U001', name: 'Engineer A', status: 'unreported' as const },
      { userId: 'U002', name: 'Engineer B', status: 'unreported' as const },
      { userId: 'U003', name: 'Engineer C', status: 'unreported' as const },
    ];

    const delayedMembers = [
      { userId: 'D001', name: 'Engineer D', status: 'delayed' as const },
      { userId: 'D002', name: 'Engineer E', status: 'delayed' as const },
      { userId: 'D003', name: 'Engineer F', status: 'delayed' as const },
    ];

    const allMembers = [...unreportedMembers, ...delayedMembers];

    // Act
    const result = assignPrioritiesToRemindTargets(allMembers);

    // Assert
    expect(result).toHaveLength(6);
    expect(result[0].userId).toBe('U001');
    expect(result[1].userId).toBe('U002');
    expect(result[2].userId).toBe('U003');
    expect(result[3].userId).toBe('D001');
    expect(result[4].userId).toBe('D002');
    expect(result[5].userId).toBe('D003');
    
    // Verify all unreported members come before all delayed members
    const unreportedIndices = result
      .map((member, index) => (member.status === 'unreported' ? index : -1))
      .filter((index) => index >= 0);
    const delayedIndices = result
      .map((member, index) => (member.status === 'delayed' ? index : -1))
      .filter((index) => index >= 0);
    
    const maxUnreportedIndex = Math.max(...unreportedIndices);
    const minDelayedIndex = Math.min(...delayedIndices);
    
    expect(maxUnreportedIndex).toBeLessThan(minDelayedIndex);
  });
});