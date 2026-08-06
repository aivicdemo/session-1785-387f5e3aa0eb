import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateMorningMeetingStartTime } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // SCEN-361
  test('朝会開始時刻が無効な日時形式のとき、エラーが発生する', () => {
    const invalidTimeFormats = [
      '2024-13-45 25:99:99',
      'invalid-date',
      '',
      '2024/01/15',
      '2024-01-15',
      'not-iso-8601',
      '2024-01-15T25:00:00Z',
      '2024-02-30T10:00:00Z',
      null,
      undefined,
    ];

    invalidTimeFormats.forEach((invalidFormat) => {
      const result = validateMorningMeetingStartTime(invalidFormat as any);

      expect(result).toBeDefined();
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toMatch(/朝会開始時刻|日時形式|ISO 8601/);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});