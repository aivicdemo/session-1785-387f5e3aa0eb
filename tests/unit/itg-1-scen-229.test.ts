import { formatAndDisplayUnifiedReport } from '../../src/logic/it-1-br-1-1-1';

describe('日報統一フォーマット整形・表示機能 - 必須フィールド検証', () => {
  // SCEN-229
  test('日報データの「今日やること」フィールドが欠けている場合、ValidationError が発生する', () => {
    const malformed_report_data = {
      yesterday_accomplishments: '顧客対応',
      today_plan: '',
      current_challenges: 'システム障害対応',
    };

    expect(() => {
      formatAndDisplayUnifiedReport(malformed_report_data);
    }).toThrow(/今日やること/);

    expect(() => {
      formatAndDisplayUnifiedReport(malformed_report_data);
    }).toThrow(/必須項目|欠けています/);
  });
});