import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { stopPromptionLoopWhenMaxAttemptsReached } from '../../src/logic/it-1-br-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('催促ループ終了判定機能', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-435
  test('催促試行回数が規定回数を超えた状態で催促停止判定が実行される', async () => {
    const maxAttempts = 3;
    const currentAttemptCount = 3;
    const userId = 'engineer-001';
    const reportDate = '2024-01-15';

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        message: 'Promotion loop terminated',
        shouldContinuePromption: false,
        attemptCount: currentAttemptCount,
        maxAttempts: maxAttempts,
      }),
      { status: 200 }
    );

    const result = await stopPromptionLoopWhenMaxAttemptsReached({
      userId: userId,
      reportDate: reportDate,
      attemptCount: currentAttemptCount,
      maxAttempts: maxAttempts,
    });

    expect(result.shouldContinuePromption).toBe(false);
    expect(result.loopStatus).toBe('terminated');
    expect(result.attemptCount).toBe(3);
    expect(result.maxAttempts).toBe(3);
  });
});