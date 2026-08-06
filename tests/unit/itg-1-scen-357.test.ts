import { validateExpectedReportCount } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-357
  test('全員報告完了判定機能 - 期待報告人数が負の数のときエラーが発生する', () => {
    const negative_expected_count = -5;

    expect(() => validateExpectedReportCount(negative_expected_count)).toThrow(/期待報告人数は0以上の整数である必要があります/);
  });
});