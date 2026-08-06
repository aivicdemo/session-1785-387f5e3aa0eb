import { checkAllReportsComplete } from '../../src/logic/it-1';

describe('全員報告完了判定機能', () => {
  test('SCEN-356: 期待報告人数が0以下のとき、エラーが発生する', () => {
    // ケース1: 期待報告人数 = 0
    const result_zero = checkAllReportsComplete({
      expected_count: 0,
      completed_count: 0,
    });

    expect(result_zero).toEqual({
      is_error: true,
      error_code: 'INVALID_EXPECTED_COUNT',
      error_message: '期待報告人数は1以上の正の整数である必要があります',
      is_all_complete: false,
    });

    // ケース2: 期待報告人数 = -1
    const result_negative = checkAllReportsComplete({
      expected_count: -1,
      completed_count: 0,
    });

    expect(result_negative).toEqual({
      is_error: true,
      error_code: 'INVALID_EXPECTED_COUNT',
      error_message: '期待報告人数は1以上の正の整数である必要があります',
      is_all_complete: false,
    });
  });
});