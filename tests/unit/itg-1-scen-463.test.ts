import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { checkReportArrivalStatus } from '../../src/logic/it-1-br-1-1-1';

describe('報告到着状況把握機能 - データ欠落エラー', () => {
  let mockDatabase: any;

  beforeEach(() => {
    mockDatabase = {
      reports: new Map(),
    };
  });

  afterEach(() => {
    mockDatabase = null;
  });

  // SCEN-463
  it('朝会報告の必須項目が欠落しているときはエラーレスポンスを返す', () => {
    const report_id = 'REPORT_20240115_MEMBER_A_001';
    const incomplete_report = {
      report_id: report_id,
      member_id: 'MEMBER_A',
      yesterday_achievement: null,
      today_plan: '本日の予定を記入',
      current_issues: '抱えている課題を記入',
      submitted_at: new Date('2024-01-15T08:30:00Z'),
      submission_status: 'submitted',
    };

    mockDatabase.reports.set(report_id, incomplete_report);

    const input = {
      report_id: report_id,
      database: mockDatabase,
    };

    expect(() => {
      checkReportArrivalStatus(input);
    }).toThrow(/必須項目|REPORT_DATA_INCOMPLETE/);
  });
});