import { getDelayedReporters } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-448
  test('10名中複数名から報告が遅延している場合、遅延者全員が正しく特定される', () => {
    const now = new Date('2024-01-15T08:50:00Z');
    const morningMeetingScheduledTime = new Date('2024-01-15T09:00:00Z');

    const submitted_users = [
      {
        user_id: 'user001',
        user_name: 'Engineer A',
        department_id: 'dept_dev',
        report_submitted_at: new Date('2024-01-15T08:30:00Z'),
        yesterday_result: 'Completed task X',
        today_plan: 'Start task Y',
        current_challenges: 'None',
      },
      {
        user_id: 'user002',
        user_name: 'Engineer B',
        department_id: 'dept_dev',
        report_submitted_at: new Date('2024-01-15T08:35:00Z'),
        yesterday_result: 'Fixed bug Z',
        today_plan: 'Review code',
        current_challenges: 'Performance issue',
      },
      {
        user_id: 'user003',
        user_name: 'Engineer C',
        department_id: 'dept_dev',
        report_submitted_at: new Date('2024-01-15T08:25:00Z'),
        yesterday_result: 'Deployed to staging',
        today_plan: 'Testing',
        current_challenges: 'Compatibility',
      },
      {
        user_id: 'user004',
        user_name: 'Engineer D',
        department_id: 'dept_dev',
        report_submitted_at: new Date('2024-01-15T08:40:00Z'),
        yesterday_result: 'Refactored module',
        today_plan: 'Write tests',
        current_challenges: 'Test coverage',
      },
      {
        user_id: 'user005',
        user_name: 'Engineer E',
        department_id: 'dept_dev',
        report_submitted_at: new Date('2024-01-15T08:45:00Z'),
        yesterday_result: 'Documentation update',
        today_plan: 'API review',
        current_challenges: 'None',
      },
    ];

    const all_users = [
      ...submitted_users,
      {
        user_id: 'user006',
        user_name: 'Engineer F',
        department_id: 'dept_dev',
        report_submitted_at: null,
      },
      {
        user_id: 'user007',
        user_name: 'Engineer G',
        department_id: 'dept_dev',
        report_submitted_at: null,
      },
      {
        user_id: 'user008',
        user_name: 'Engineer H',
        department_id: 'dept_dev',
        report_submitted_at: null,
      },
      {
        user_id: 'user009',
        user_name: 'Engineer I',
        department_id: 'dept_dev',
        report_submitted_at: null,
      },
      {
        user_id: 'user010',
        user_name: 'Engineer J',
        department_id: 'dept_dev',
        report_submitted_at: null,
      },
    ];

    const result = getDelayedReporters(
      all_users,
      now,
      morningMeetingScheduledTime,
    );

    expect(result).toHaveLength(5);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: 'user006',
          user_name: 'Engineer F',
          status: 'not_submitted',
        }),
        expect.objectContaining({
          user_id: 'user007',
          user_name: 'Engineer G',
          status: 'not_submitted',
        }),
        expect.objectContaining({
          user_id: 'user008',
          user_name: 'Engineer H',
          status: 'not_submitted',
        }),
        expect.objectContaining({
          user_id: 'user009',
          user_name: 'Engineer I',
          status: 'not_submitted',
        }),
        expect.objectContaining({
          user_id: 'user010',
          user_name: 'Engineer J',
          status: 'not_submitted',
        }),
      ]),
    );

    const submitted_user_ids = result.map((r) => r.user_id);
    expect(submitted_user_ids).not.toContain('user001');
    expect(submitted_user_ids).not.toContain('user002');
    expect(submitted_user_ids).not.toContain('user003');
    expect(submitted_user_ids).not.toContain('user004');
    expect(submitted_user_ids).not.toContain('user005');
  });
});