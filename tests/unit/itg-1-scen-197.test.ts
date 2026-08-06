import { generateManagerNotification } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時の部長通知生成機能', () => {
  // SCEN-197
  test('全員送信完了時に部長への通知内容が正しく生成される', () => {
    const fixed_notification_datetime = new Date('2024-01-15T09:00:00Z');
    const fixed_report_date = '2024-01-15';

    const all_reports_completed = [
      {
        user_id: 'ENG001',
        user_name: 'Engineer A',
        department_id: 'DEV',
        department_name: 'Development',
        yesterday_achievement: 'Completed API integration tests',
        today_plan: 'Review pull requests and merge feature branch',
        current_issues: 'Database connection timeout needs investigation',
        submission_datetime: new Date('2024-01-15T08:30:00Z'),
        submission_status: 'submitted'
      },
      {
        user_id: 'ENG002',
        user_name: 'Engineer B',
        department_id: 'DEV',
        department_name: 'Development',
        yesterday_achievement: 'Fixed UI responsive bug',
        today_plan: 'Implement new authentication module',
        current_issues: 'Third-party library version conflict',
        submission_datetime: new Date('2024-01-15T08:25:00Z'),
        submission_status: 'submitted'
      },
      {
        user_id: 'ENG003',
        user_name: 'Engineer C',
        department_id: 'DEV',
        department_name: 'Development',
        yesterday_achievement: 'Refactored database query optimization',
        today_plan: 'Performance testing and tuning',
        current_issues: 'Memory leak in cache module',
        submission_datetime: new Date('2024-01-15T08:20:00Z'),
        submission_status: 'submitted'
      },
      {
        user_id: 'ENG004',
        user_name: 'Engineer D',
        department_id: 'DEV',
        department_name: 'Development',
        yesterday_achievement: 'Deployed hotfix to production',
        today_plan: 'Monitor system stability and prepare release notes',
        current_issues: 'Server CPU usage spike during peak hours',
        submission_datetime: new Date('2024-01-15T08:15:00Z'),
        submission_status: 'submitted'
      },
      {
        user_id: 'ENG005',
        user_name: 'Engineer E',
        department_id: 'DEV',
        department_name: 'Development',
        yesterday_achievement: 'Created documentation for new API endpoints',
        today_plan: 'Update developer guides and examples',
        current_issues: 'Documentation versioning conflict',
        submission_datetime: new Date('2024-01-15T08:10:00Z'),
        submission_status: 'submitted'
      },
      {
        user_id: 'ENG006',
        user_name: 'Engineer F',
        department_id: 'DEV',
        department_name: 'Development',
        yesterday_achievement: 'Code review for feature X',
        today_plan: 'Implement requested code review feedback',
        current_issues: 'Circular dependency in module import',
        submission_datetime: new Date('2024-01-15T08:05:00Z'),
        submission_status: 'submitted'
      },
      {
        user_id: 'ENG007',
        user_name: 'Engineer G',
        department_id: 'DEV',
        department_name: 'Development',
        yesterday_achievement: 'Set up CI/CD pipeline for feature branch',
        today_plan: 'Configure automated testing triggers',
        current_issues: 'Build timeout in test environment',
        submission_datetime: new Date('2024-01-15T08:00:00Z'),
        submission_status: 'submitted'
      },
      {
        user_id: 'ENG008',
        user_name: 'Engineer H',
        department_id: 'DEV',
        department_name: 'Development',
        yesterday_achievement: 'Investigated performance degradation issue',
        today_plan: 'Implement caching strategy',
        current_issues: 'Needs approval for infrastructure changes',
        submission_datetime: new Date('2024-01-15T07:55:00Z'),
        submission_status: 'submitted'
      },
      {
        user_id: 'ENG009',
        user_name: 'Engineer I',
        department_id: 'DEV',
        department_name: 'Development',
        yesterday_achievement: 'Completed unit tests for authentication module',
        today_plan: 'Integration testing with identity provider',
        current_issues: 'OAuth token refresh timing issue',
        submission_datetime: new Date('2024-01-15T07:50:00Z'),
        submission_status: 'submitted'
      },
      {
        user_id: 'ENG010',
        user_name: 'Engineer J',
        department_id: 'DEV',
        department_name: 'Development',
        yesterday_achievement: 'Updated dependencies and security patches',
        today_plan: 'Verify all tests pass with new dependency versions',
        current_issues: 'Breaking changes in major version upgrade',
        submission_datetime: new Date('2024-01-15T07:45:00Z'),
        submission_status: 'submitted'
      }
    ];

    const generated_notification = generateManagerNotification({
      reports: all_reports_completed,
      report_date: fixed_report_date,
      notification_datetime: fixed_notification_datetime
    });

    expect(generated_notification.notification_datetime).toEqual(
      fixed_notification_datetime
    );

    expect(generated_notification.submission_status).toBe('all_completed');

    expect(generated_notification.report_count).toBe(10);

    expect(generated_notification.reports_list).toHaveLength(10);

    generated_notification.reports_list.forEach((report, index) => {
      expect(report).toHaveProperty('user_id');
      expect(report).toHaveProperty('user_name');
      expect(report).toHaveProperty('department_name');
      expect(report).toHaveProperty('yesterday_achievement');
      expect(report).toHaveProperty('today_plan');
      expect(report).toHaveProperty('current_issues');
      expect(report).toHaveProperty('submission_datetime');

      expect(report.user_id).toBe(all_reports_completed[index].user_id);
      expect(report.user_name).toBe(all_reports_completed[index].user_name);
      expect(report.yesterday_achievement).toBe(
        all_reports_completed[index].yesterday_achievement
      );
      expect(report.today_plan).toBe(all_reports_completed[index].today_plan);
      expect(report.current_issues).toBe(
        all_reports_completed[index].current_issues
      );
    });

    expect(generated_notification.reports_list[0].user_name).toBe(
      'Engineer A'
    );
    expect(generated_notification.reports_list[0].yesterday_achievement).toBe(
      'Completed API integration tests'
    );
    expect(generated_notification.reports_list[0].today_plan).toBe(
      'Review pull requests and merge feature branch'
    );
    expect(generated_notification.reports_list[0].current_issues).toBe(
      'Database connection timeout needs investigation'
    );

    expect(generated_notification.reports_list[9].user_name).toBe(
      'Engineer J'
    );
    expect(generated_notification.reports_list[9].yesterday_achievement).toBe(
      'Updated dependencies and security patches'
    );
    expect(generated_notification.reports_list[9].today_plan).toBe(
      'Verify all tests pass with new dependency versions'
    );
    expect(generated_notification.reports_list[9].current_issues).toBe(
      'Breaking changes in major version upgrade'
    );
  });
});