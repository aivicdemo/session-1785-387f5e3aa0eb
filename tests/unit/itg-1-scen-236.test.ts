import { describe, test, expect } from '@jest/globals';
import { formatAndDisplayReport } from '../../src/logic/it-1-br-1-1-1';

describe('日報統一フォーマット整形・表示機能', () => {
  // SCEN-236
  test('日報データの「今日やること」が空文字列の場合、エラーが発生する', () => {
    const report_data = {
      yesterday_achievement: '昨日は機能Aの実装を完了しました',
      today_plan: '',
      current_issues: 'データベース接続タイムアウトの問題が発生中'
    };

    expect(() => formatAndDisplayReport(report_data)).toThrow(/今日やること/);
  });
});