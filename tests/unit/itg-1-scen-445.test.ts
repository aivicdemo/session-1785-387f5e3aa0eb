import { describe, test, expect, beforeEach } from '@jest/globals';
import { getReportArrivalStatus } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-445
  test('報告到着状況の把握機能 - 10名中1名から報告が未到着の場合、未到着件数が1件と特定される', () => {
    const total_members = 10;
    const submitted_count = 9;
    const not_submitted_count = 1;

    const report_status = [
      { user_id: 'USR001', department_id: 'DEPT001', submitted: true, submitted_at: '2024-01-15T08:00:00Z' },
      { user_id: 'USR002', department_id: 'DEPT001', submitted: true, submitted_at: '2024-01-15T08:05:00Z' },
      { user_id: 'USR003', department_id: 'DEPT001', submitted: true, submitted_at: '2024-01-15T08:10:00Z' },
      { user_id: 'USR004', department_id: 'DEPT001', submitted: true, submitted_at: '2024-01-15T08:15:00Z' },
      { user_id: 'USR005', department_id: 'DEPT001', submitted: true, submitted_at: '2024-01-15T08:20:00Z' },
      { user_id: 'USR006', department_id: 'DEPT001', submitted: true, submitted_at: '2024-01-15T08:25:00Z' },
      { user_id: 'USR007', department_id: 'DEPT001', submitted: true, submitted_at: '2024-01-15T08:30:00Z' },
      { user_id: 'USR008', department_id: 'DEPT001', submitted: true, submitted_at: '2024-01-15T08:35:00Z' },
      { user_id: 'USR009', department_id: 'DEPT001', submitted: true, submitted_at: '2024-01-15T08:40:00Z' },
      { user_id: 'USR010', department_id: 'DEPT001', submitted: false, submitted_at: null }
    ];

    const result = getReportArrivalStatus(report_status);

    expect(result.total_members).toBe(total_members);
    expect(result.submitted_count).toBe(submitted_count);
    expect(result.not_submitted_count).toBe(not_submitted_count);
  });
});