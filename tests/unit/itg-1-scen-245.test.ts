import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectUnreportedMembers } from '../../src/logic/it-1-br-1-1-1';

describe('報告漏れ部員の視認機能', () => {
  // SCEN-245: [edge] 報告漏れ部員の視認機能 - 朝会当日の月初（1日）で報告対象部員に対して報告漏れが正しく検出される
  test('should correctly identify 2 unreported members on January 1st morning meeting', () => {
    const meeting_date_str = '2024-01-01T09:00:00Z';
    const meeting_date = new Date(meeting_date_str);

    const reported_members = [
      {
        user_id: 'user_001',
        user_name: 'Engineer1',
        submitted_at: '2024-01-01T08:30:00Z',
        yesterday_achievement: 'Completed task A',
        today_plan: 'Start task B',
        issues: 'None',
      },
      {
        user_id: 'user_002',
        user_name: 'Engineer2',
        submitted_at: '2024-01-01T08:45:00Z',
        yesterday_achievement: 'Completed task C',
        today_plan: 'Continue task D',
        issues: 'Blocked by dependency',
      },
      {
        user_id: 'user_003',
        user_name: 'Engineer3',
        submitted_at: '2024-01-01T08:15:00Z',
        yesterday_achievement: 'Completed task E',
        today_plan: 'Start task F',
        issues: 'None',
      },
      {
        user_id: 'user_004',
        user_name: 'Engineer4',
        submitted_at: '2024-01-01T08:50:00Z',
        yesterday_achievement: 'Completed task G',
        today_plan: 'Start task H',
        issues: 'Performance issue',
      },
      {
        user_id: 'user_005',
        user_name: 'Engineer5',
        submitted_at: '2024-01-01T08:20:00Z',
        yesterday_achievement: 'Completed task I',
        today_plan: 'Start task J',
        issues: 'None',
      },
      {
        user_id: 'user_006',
        user_name: 'Engineer6',
        submitted_at: '2024-01-01T08:35:00Z',
        yesterday_achievement: 'Completed task K',
        today_plan: 'Continue task L',
        issues: 'Need review',
      },
      {
        user_id: 'user_007',
        user_name: 'Engineer7',
        submitted_at: '2024-01-01T08:40:00Z',
        yesterday_achievement: 'Completed task M',
        today_plan: 'Start task N',
        issues: 'None',
      },
      {
        user_id: 'user_008',
        user_name: 'Engineer8',
        submitted_at: '2024-01-01T08:25:00Z',
        yesterday_achievement: 'Completed task O',
        today_plan: 'Start task P',
        issues: 'Testing needed',
      },
    ];

    const all_members = [
      { user_id: 'user_001', user_name: 'Engineer1', department_id: 'dev' },
      { user_id: 'user_002', user_name: 'Engineer2', department_id: 'dev' },
      { user_id: 'user_003', user_name: 'Engineer3', department_id: 'dev' },
      { user_id: 'user_004', user_name: 'Engineer4', department_id: 'dev' },
      { user_id: 'user_005', user_name: 'Engineer5', department_id: 'dev' },
      { user_id: 'user_006', user_name: 'Engineer6', department_id: 'dev' },
      { user_id: 'user_007', user_name: 'Engineer7', department_id: 'dev' },
      { user_id: 'user_008', user_name: 'Engineer8', department_id: 'dev' },
      { user_id: 'user_009', user_name: 'EngineerA', department_id: 'dev' },
      { user_id: 'user_010', user_name: 'EngineerB', department_id: 'dev' },
    ];

    const result = detectUnreportedMembers({
      meeting_date: meeting_date,
      reported_member_list: reported_members,
      all_member_list: all_members,
      target_date_str: '2024-01-01',
    });

    expect(result.unreported_member_count).toBe(2);
    expect(result.reported_member_count).toBe(8);
    expect(result.unreported_members).toHaveLength(2);

    const unreported_user_ids = result.unreported_members.map(
      (m: { user_id: string }) => m.user_id,
    );
    expect(unreported_user_ids).toContain('user_009');
    expect(unreported_user_ids).toContain('user_010');

    result.unreported_members.forEach(
      (member: { user_name: string; status_message: string }) => {
        expect(member.status_message).toBe('朝会当日の報告なし');
      },
    );

    const reported_user_ids = result.reported_members.map(
      (m: { user_id: string }) => m.user_id,
    );
    expect(reported_user_ids).not.toContain('user_009');
    expect(reported_user_ids).not.toContain('user_010');
    expect(reported_user_ids).toHaveLength(8);
  });
});