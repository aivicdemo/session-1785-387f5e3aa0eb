import { describe, test, expect } from '@jest/globals';
import { validateAllReportsSubmitted } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-358
  test('全員報告完了判定機能 - 報告送信履歴データが null のとき、エラーが発生する', () => {
    const null_submission_history = null;

    expect(() =>
      validateAllReportsSubmitted(null_submission_history)
    ).toThrow(/報告送信履歴データ/);
  });
});