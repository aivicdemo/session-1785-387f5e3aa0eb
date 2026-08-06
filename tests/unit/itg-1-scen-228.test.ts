import { validateDailyReportFormat } from '../../src/logic/it-1-br-1-1-1';

describe('日報統一フォーマット整形・表示機能', () => {
  // SCEN-228
  test('[error] 日報データの「昨日やったこと」フィールドが欠けている場合、エラーが発生する', () => {
    const reportData = {
      yesterdayAccomplishment: '',
      todayPlan: '顧客A対応',
      currentIssue: '予算承認待ち',
    };

    expect(() => validateDailyReportFormat(reportData)).toThrow(/昨日やったこと/);
  });
});