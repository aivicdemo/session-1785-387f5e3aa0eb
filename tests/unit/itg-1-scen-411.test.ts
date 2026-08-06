import { describe, test, expect } from '@jest/globals';
import { shouldTerminateCampaign } from '../../src/logic/it-1-br-1-1-1';

describe('催促ループ終了判定機能', () => {
  test('SCEN-411: retryCount が null のときエラーになる', () => {
    const maxRetryAttempts = 3;
    const currentTime = new Date('2024-01-15T10:00:00Z');
    const lastCampaignTime = new Date('2024-01-15T09:00:00Z');

    expect(() => {
      shouldTerminateCampaign({
        retryCount: null as any,
        maxRetryAttempts,
        currentTime,
        lastCampaignTime,
      });
    }).toThrow(/催促試行回数/);
  });
});