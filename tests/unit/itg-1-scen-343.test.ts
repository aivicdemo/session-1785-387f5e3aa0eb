import { assignPrioritiesToReminders } from '../../src/logic/it-1-br-1-1-1';

describe('催促対象部員優先順位付与機能', () => {
  // SCEN-343
  test('遅延時間が同じ複数部員が存在する場合、相互の順序が一定に保持される', () => {
    const delayedMemberA = {
      userId: 'user_A',
      name: 'Member A',
      delayedMinutes: 40,
    };

    const delayedMemberB = {
      userId: 'user_B',
      name: 'Member B',
      delayedMinutes: 40,
    };

    const delayedMemberC = {
      userId: 'user_C',
      name: 'Member C',
      delayedMinutes: 60,
    };

    const inputMembers = [delayedMemberA, delayedMemberB, delayedMemberC];

    const executionResults: Array<{ priorityA: number; priorityB: number; priorityC: number }> = [];

    for (let i = 0; i < 5; i++) {
      const result = assignPrioritiesToReminders(inputMembers);

      const priorityA = result.find((r) => r.userId === 'user_A')?.priority ?? -1;
      const priorityB = result.find((r) => r.userId === 'user_B')?.priority ?? -1;
      const priorityC = result.find((r) => r.userId === 'user_C')?.priority ?? -1;

      executionResults.push({
        priorityA,
        priorityB,
        priorityC,
      });
    }

    expect(executionResults.length).toBe(5);

    const firstResult = executionResults[0];
    expect(firstResult.priorityC).toBeLessThan(firstResult.priorityA);
    expect(firstResult.priorityC).toBeLessThan(firstResult.priorityB);

    for (let i = 1; i < 5; i++) {
      const currentResult = executionResults[i];
      expect(currentResult.priorityA).toBe(firstResult.priorityA);
      expect(currentResult.priorityB).toBe(firstResult.priorityB);
      expect(currentResult.priorityC).toBe(firstResult.priorityC);
    }

    const relativeOrderAB_First = firstResult.priorityA < firstResult.priorityB;
    for (let i = 1; i < 5; i++) {
      const currentResult = executionResults[i];
      const relativeOrderAB_Current = currentResult.priorityA < currentResult.priorityB;
      expect(relativeOrderAB_Current).toBe(relativeOrderAB_First);
    }
  });
});