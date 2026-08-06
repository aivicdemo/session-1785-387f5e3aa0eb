import { describe, it, expect, beforeEach } from '@jest/globals';
import { verifyReportArrivalStatus } from '../../src/logic/it-1-br-1-1-1';

describe('報告到着状況把握機能', () => {
  // SCEN-460
  it('期待報告人数が欠落しているとき、エラーになる', () => {
    const result_null = verifyReportArrivalStatus({
      expectedCount: null as any,
      arrivedCount: 5,
      delayedCount: 1,
    });
    expect(result_null.error).toBe(true);
    expect(result_null.errorCode).toBe('MISSING_EXPECTED_COUNT');
    expect(result_null.errorMessage).toBe('期待報告人数が指定されていません');

    const result_undefined = verifyReportArrivalStatus({
      expectedCount: undefined as any,
      arrivedCount: 5,
      delayedCount: 1,
    });
    expect(result_undefined.error).toBe(true);
    expect(result_undefined.errorCode).toBe('MISSING_EXPECTED_COUNT');
    expect(result_undefined.errorMessage).toBe('期待報告人数が指定されていません');
  });
});