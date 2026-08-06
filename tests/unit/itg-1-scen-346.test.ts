import { assignPrioritiesToUnreportedMembers } from '../../src/logic/it-1-br-1-1-1';

describe('催促対象部員優先順位付与機能', () => {
  // SCEN-346
  test('未報告状態の部員数百名すべてに重複なく連続した優先順位が付与される', () => {
    const unreported_member_count = 500;
    const unreported_members = Array.from({ length: unreported_member_count }, (_, i) => ({
      user_id: `USER_${String(i + 1).padStart(4, '0')}`,
      submission_date: null,
      priority: null,
    }));

    const result = assignPrioritiesToUnreportedMembers(unreported_members);

    expect(result.length).toBe(unreported_member_count);

    const assigned_priorities = result.map((m) => m.priority);
    const unique_priorities = new Set(assigned_priorities);
    expect(unique_priorities.size).toBe(unreported_member_count);

    const null_count = assigned_priorities.filter((p) => p === null).length;
    expect(null_count).toBe(0);

    const sorted_priorities = [...assigned_priorities].sort((a, b) => a - b);
    for (let i = 0; i < unreported_member_count; i++) {
      expect(sorted_priorities[i]).toBe(i + 1);
    }

    const priority_to_user_id_map = new Map<number, string>();
    for (const member of result) {
      expect(priority_to_user_id_map.has(member.priority as number)).toBe(false);
      priority_to_user_id_map.set(member.priority as number, member.user_id);
    }
    expect(priority_to_user_id_map.size).toBe(unreported_member_count);
  });
});