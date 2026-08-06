import { describe, test, expect, beforeEach } from '@jest/globals';
import { countDelayedReports } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-447: [normal] 報告到着状況の把握機能 - 10名中1名から報告が遅延している場合、遅延件数が1件と判定される
  test('should count 1 delayed report when 9 of 10 engineers submitted on time and 1 submitted after deadline', () => {
    // Prepare: Initialize system with 10 engineers
    const deadline = new Date('2024-01-15T09:00:00Z');
    const currentTime = new Date('2024-01-15T09:30:00Z');

    // Engineer 1-9: submitted before deadline
    const onTimeReports = [
      { engineer_id: 'ENG001', user_id: 'USR001', submitted_at: new Date('2024-01-15T08:45:00Z'), department_id: 'DEV' },
      { engineer_id: 'ENG002', user_id: 'USR002', submitted_at: new Date('2024-01-15T08:50:00Z'), department_id: 'DEV' },
      { engineer_id: 'ENG003', user_id: 'USR003', submitted_at: new Date('2024-01-15T08:55:00Z'), department_id: 'DEV' },
      { engineer_id: 'ENG004', user_id: 'USR004', submitted_at: new Date('2024-01-15T08:30:00Z'), department_id: 'DEV' },
      { engineer_id: 'ENG005', user_id: 'USR005', submitted_at: new Date('2024-01-15T08:40:00Z'), department_id: 'DEV' },
      { engineer_id: 'ENG006', user_id: 'USR006', submitted_at: new Date('2024-01-15T08:20:00Z'), department_id: 'DEV' },
      { engineer_id: 'ENG007', user_id: 'USR007', submitted_at: new Date('2024-01-15T08:35:00Z'), department_id: 'DEV' },
      { engineer_id: 'ENG008', user_id: 'USR008', submitted_at: new Date('2024-01-15T08:48:00Z'), department_id: 'DEV' },
      { engineer_id: 'ENG009', user_id: 'USR009', submitted_at: new Date('2024-01-15T08:52:00Z'), department_id: 'DEV' },
    ];

    // Engineer 10: submitted after deadline
    const delayedReport = {
      engineer_id: 'ENG010',
      user_id: 'USR010',
      submitted_at: new Date('2024-01-15T09:15:00Z'),
      department_id: 'DEV',
    };

    const allReports = [...onTimeReports, delayedReport];

    // Execute: Count delayed reports
    const delayedCount = countDelayedReports(allReports, deadline);

    // Assert: Verify delayed count is exactly 1
    expect(delayedCount).toBe(1);
  });
});