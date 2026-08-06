import { determineLatestReportForAllEmployees } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-371: [edge] 全員報告完了判定機能 - 報告送信時刻が異なる同一部員の複数報告がある場合、最新のみカウントされる
  test('同一部員の複数報告がある場合、最新報告のみがカウント対象となる', () => {
    const employee_id = 'EMP001';
    const report_date = '2024-01-15';

    const reports = [
      {
        employee_id,
        report_date,
        sent_at: new Date('2024-01-15T09:00:00Z'),
        yesterday_achievement: 'タスクA完了',
        today_plan: 'タスクB開始',
        issues: 'なし',
      },
      {
        employee_id,
        report_date,
        sent_at: new Date('2024-01-15T09:15:00Z'),
        yesterday_achievement: 'タスクA完了、会議参加',
        today_plan: 'タスクB継続',
        issues: 'リソース不足',
      },
      {
        employee_id,
        report_date,
        sent_at: new Date('2024-01-15T09:30:00Z'),
        yesterday_achievement: 'タスクA完了、会議参加、レビュー実施',
        today_plan: 'タスクC検討',
        issues: '承認待ち',
      },
    ];

    const result = determineLatestReportForAllEmployees(reports);

    expect(result).toHaveLength(1);
    expect(result[0].employee_id).toBe('EMP001');
    expect(result[0].report_date).toBe('2024-01-15');
    expect(result[0].sent_at).toEqual(new Date('2024-01-15T09:30:00Z'));
    expect(result[0].yesterday_achievement).toBe(
      'タスクA完了、会議参加、レビュー実施'
    );
    expect(result[0].today_plan).toBe('タスクC検討');
    expect(result[0].issues).toBe('承認待ち');
  });
});