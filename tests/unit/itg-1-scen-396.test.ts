import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-396: [edge] 報告期限判定機能 - 朝会開始時刻を1秒超過した時点で期限超過と判定される
  test('朝会開始時刻を1秒超過した時点で期限超過と判定される', async () => {
    const mockDateNow = jest.fn();
    const realDateNow = Date.now;
    const realDate = Date;

    try {
      // 朝会開始予定時刻: 09:00:00
      const meeting_start_time_str = '09:00:00';
      const meeting_start_time_ms = new Date('2024-01-15T09:00:00Z').getTime();

      // 現在時刻: 09:00:01（開始時刻から1秒超過）
      const current_time_ms = new Date('2024-01-15T09:00:01Z').getTime();

      mockDateNow.mockReturnValue(current_time_ms);
      (global as any).Date = class extends realDate {
        constructor(...args: any[]) {
          super();
          if (args.length === 0) {
            return new realDate(current_time_ms);
          }
          return new (realDate as any)(...args);
        }
        static now() {
          return current_time_ms;
        }
      };
      Object.assign((global.Date as any), realDate);

      // ビジネスロジック: 報告期限判定関数を呼び出す
      const { checkReportDeadlineExceeded } = await import('../../src/logic/it-1-br-1-1-1');

      const result = checkReportDeadlineExceeded({
        meeting_start_time_ms,
        current_time_ms,
      });

      // 期待結果: 期限超過判定が true を返す
      expect(result.is_deadline_exceeded).toBe(true);
      expect(result.status_message).toMatch(/朝会開始時刻を超過/);
    } finally {
      // モック解除
      Date.now = realDateNow;
      (global as any).Date = realDate;
      jest.restoreAllMocks();
    }
  });
});