import { describe, test, expect } from '@jest/globals';
import { validateAndAggregateReport } from '../../src/logic/it-1';

describe('報告内容検証・集約機能', () => {
  // SCEN-486
  test('報告者情報が欠落している場合にエラーになる', () => {
    const reportWithMissingReporterId = {
      reporterId: null,
      reporterName: '山田太郎',
      departmentId: 'dept-001',
      yesterday: '昨日は機能開発を完了しました',
      today: '本日はテストを実施予定です',
      challenges: '統合テストで問題が発生する可能性があります',
      submittedAt: new Date('2024-01-15T08:30:00Z'),
    };

    expect(() => validateAndAggregateReport(reportWithMissingReporterId)).toThrow(/報告者情報/);
  });
});