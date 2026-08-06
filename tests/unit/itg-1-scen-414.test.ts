import { describe, test, expect } from '@jest/globals';
import { validateReminderLimit } from '../../src/logic/it-1-br-1-1-1';

describe('催促ループ終了判定機能', () => {
  // SCEN-414
  test('規定催促回数上限が負の数のときエラーになる', () => {
    const invalidReminderLimit = -1;

    expect(() => {
      validateReminderLimit(invalidReminderLimit);
    }).toThrow(/催促回数上限/);
  });
});