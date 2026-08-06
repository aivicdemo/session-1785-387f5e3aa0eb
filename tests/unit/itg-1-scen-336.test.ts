import { prioritizeFollowUpTargets } from '../../src/logic/it-1-br-1-1-1';

describe('催促対象部員の優先順位付け機能', () => {
  // SCEN-336
  test('未送信部員リストの報告期限日時が不正な日時形式のとき処理がエラーになる', () => {
    const invalid_deadline_format = 'invalid_format_test';
    const non_reporting_members = [
      {
        user_id: 'user_001',
        user_name: 'Employee A',
        department_id: 'dept_001',
        reporting_deadline: invalid_deadline_format,
        is_reported: false,
        report_submission_time: null,
      },
    ];
    const current_time = new Date('2024-01-15T08:30:00Z');
    const morning_meeting_start_time = new Date('2024-01-15T09:00:00Z');

    expect(() => {
      prioritizeFollowUpTargets(
        non_reporting_members,
        current_time,
        morning_meeting_start_time
      );
    }).toThrow(/報告期限日時/);
  });
});