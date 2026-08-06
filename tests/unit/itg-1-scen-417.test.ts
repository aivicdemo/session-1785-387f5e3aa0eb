import { describe, test, expect } from '@jest/globals';
import { validatePromptRetryTimeout } from '../../src/logic/it-1-br-1-1-1';

describe('IT-1-BR-1-1-1: 報告送信時の確認メール自動配信 - 催促ループ終了判定', () => {
  // SCEN-417
  test('催促タイムアウト待機時間が負の数のときValidationErrorを発生させる', () => {
    const negativeTimeoutMs = -1;

    expect(() => {
      validatePromptRetryTimeout(negativeTimeoutMs);
    }).toThrow(/催促タイムアウト待機時間/);
  });
});