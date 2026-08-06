import { formatAndValidateDailyReport } from '../../src/logic/it-1-br-1-1-1';

describe('日報統一フォーマット整形・表示機能 - 必須項目検証', () => {
  test('SCEN-230: 抱えている課題フィールドが欠けている場合、エラーが発生する', () => {
    const inputReport = {
      userId: 'user_001',
      reportDate: '2024-01-15',
      yesterdayAccomplishment: '既存機能の改修',
      todayPlan: '新機能開発',
      challenges: '',
    };

    expect(() => formatAndValidateDailyReport(inputReport)).toThrow(/抱えている課題/);
  });
});