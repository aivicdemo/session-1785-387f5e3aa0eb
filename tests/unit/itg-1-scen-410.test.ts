import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { determinePromptionLoopEnd } from '../../src/logic/it-1-br-1-1-1';

describe('催促ループ終了判定機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-410
  test('催促対象部員IDが空文字列のときバリデーションエラーを発生させる', () => {
    const targetEmployeeId = '';
    const maxRetryCount = 3;
    const currentRetryCount = 1;
    const lastPromptionTimestamp = new Date('2024-01-15T09:00:00Z');

    expect(() =>
      determinePromptionLoopEnd(
        targetEmployeeId,
        maxRetryCount,
        currentRetryCount,
        lastPromptionTimestamp
      )
    ).toThrow(/部員ID/);
  });
});