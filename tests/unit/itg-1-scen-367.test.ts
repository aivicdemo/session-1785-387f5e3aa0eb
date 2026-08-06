import { determinePromptionTargets } from '../../src/logic/it-1-br-1-1-1';

describe('全員報告完了判定機能 - 催促対象の明示', () => {
  // SCEN-367
  test('報告者が9名で未報告が1名の場合、催促対象に未報告者が明示される', () => {
    const submitted_users = [
      {
        user_id: 'user_1',
        name: 'Alice',
        yesterday_achievement: 'タスクA完了',
        today_plan: 'タスクB開始',
        current_issue: 'なし'
      },
      {
        user_id: 'user_2',
        name: 'Bob',
        yesterday_achievement: 'タスクC完了',
        today_plan: 'タスクD開始',
        current_issue: 'なし'
      },
      {
        user_id: 'user_3',
        name: 'Charlie',
        yesterday_achievement: 'タスクE完了',
        today_plan: 'タスクF開始',
        current_issue: 'なし'
      },
      {
        user_id: 'user_4',
        name: 'David',
        yesterday_achievement: 'タスクG完了',
        today_plan: 'タスクH開始',
        current_issue: 'なし'
      },
      {
        user_id: 'user_5',
        name: 'Eve',
        yesterday_achievement: 'タスクI完了',
        today_plan: 'タスクJ開始',
        current_issue: 'なし'
      },
      {
        user_id: 'user_6',
        name: 'Frank',
        yesterday_achievement: 'タスクK完了',
        today_plan: 'タスクL開始',
        current_issue: 'なし'
      },
      {
        user_id: 'user_7',
        name: 'Grace',
        yesterday_achievement: 'タスクM完了',
        today_plan: 'タスクN開始',
        current_issue: 'なし'
      },
      {
        user_id: 'user_8',
        name: 'Henry',
        yesterday_achievement: 'タスクO完了',
        today_plan: 'タスクP開始',
        current_issue: 'なし'
      },
      {
        user_id: 'user_9',
        name: 'Iris',
        yesterday_achievement: 'タスクQ完了',
        today_plan: 'タスクR開始',
        current_issue: 'なし'
      }
    ];

    const all_users = [
      { user_id: 'user_1', name: 'Alice' },
      { user_id: 'user_2', name: 'Bob' },
      { user_id: 'user_3', name: 'Charlie' },
      { user_id: 'user_4', name: 'David' },
      { user_id: 'user_5', name: 'Eve' },
      { user_id: 'user_6', name: 'Frank' },
      { user_id: 'user_7', name: 'Grace' },
      { user_id: 'user_8', name: 'Henry' },
      { user_id: 'user_9', name: 'Iris' },
      { user_id: 'user_10', name: 'Jack' }
    ];

    const morning_meeting_start_time = new Date('2024-01-15T09:00:00Z');

    const result = determinePromptionTargets({
      submitted_reports: submitted_users,
      all_department_members: all_users,
      meeting_start_time: morning_meeting_start_time
    });

    expect(result.promotion_targets).toHaveLength(1);
    expect(result.promotion_targets[0].user_id).toBe('user_10');
    expect(result.promotion_targets[0].name).toBe('Jack');
    expect(result.promotion_targets[0].reason).toMatch(/報告がまだ送信されていません/);
    expect(result.submitted_count).toBe(9);
    expect(result.unsubmitted_count).toBe(1);
    expect(result.total_count).toBe(10);
  });
});