import { validateAllReportSubmissionComplete } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-365
  test('全員報告完了判定機能 - 報告送信履歴のステータスが不正な値のとき、エラーが発生する', () => {
    const invalid_status_values = [
      'pending',
      'unknown',
      '',
      null,
      123,
      undefined,
    ];

    invalid_status_values.forEach((invalid_status) => {
      const submission_history_with_invalid_status = [
        {
          user_id: 'USR001',
          submission_date: '2024-01-15',
          submission_time: '2024-01-15T08:30:00Z',
          status: invalid_status,
          department_id: 'DEPT001',
        },
        {
          user_id: 'USR002',
          submission_date: '2024-01-15',
          submission_time: '2024-01-15T08:45:00Z',
          status: 'submitted',
          department_id: 'DEPT001',
        },
        {
          user_id: 'USR003',
          submission_date: '2024-01-15',
          submission_time: '2024-01-15T08:50:00Z',
          status: 'submitted',
          department_id: 'DEPT001',
        },
        {
          user_id: 'USR004',
          submission_date: '2024-01-15',
          submission_time: '2024-01-15T09:00:00Z',
          status: 'submitted',
          department_id: 'DEPT001',
        },
        {
          user_id: 'USR005',
          submission_date: '2024-01-15',
          submission_time: '2024-01-15T09:05:00Z',
          status: 'submitted',
          department_id: 'DEPT001',
        },
        {
          user_id: 'USR006',
          submission_date: '2024-01-15',
          submission_time: '2024-01-15T09:10:00Z',
          status: 'submitted',
          department_id: 'DEPT001',
        },
        {
          user_id: 'USR007',
          submission_date: '2024-01-15',
          submission_time: '2024-01-15T09:15:00Z',
          status: 'submitted',
          department_id: 'DEPT001',
        },
        {
          user_id: 'USR008',
          submission_date: '2024-01-15',
          submission_time: '2024-01-15T09:20:00Z',
          status: 'submitted',
          department_id: 'DEPT001',
        },
        {
          user_id: 'USR009',
          submission_date: '2024-01-15',
          submission_time: '2024-01-15T09:25:00Z',
          status: 'submitted',
          department_id: 'DEPT001',
        },
        {
          user_id: 'USR010',
          submission_date: '2024-01-15',
          submission_time: '2024-01-15T09:30:00Z',
          status: 'submitted',
          department_id: 'DEPT001',
        },
      ];

      expect(() =>
        validateAllReportSubmissionComplete(submission_history_with_invalid_status)
      ).toThrow(/ステータス/);
    });
  });
});