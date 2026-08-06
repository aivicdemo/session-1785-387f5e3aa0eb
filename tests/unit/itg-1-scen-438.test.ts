import { checkPromptLoopTermination } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時に送信者本人と部長宛に確認メール自動配信 - 催促ループ終了判定', () => {
  // SCEN-438
  test('再報告待機時間が上限を超えた場合、催促停止判定が true を返し、システムログに記録される', () => {
    const now = new Date('2024-01-15T10:00:00Z');
    const last_prompt_request_time = new Date('2024-01-14T09:00:00Z'); // 25時間前
    const max_wait_time_ms = 24 * 60 * 60 * 1000; // 24時間
    const elapsed_time_ms = now.getTime() - last_prompt_request_time.getTime();

    const result = checkPromptLoopTermination({
      current_time: now,
      last_prompt_request_time: last_prompt_request_time,
      max_wait_time_ms: max_wait_time_ms,
    });

    expect(result.should_terminate).toBe(true);
    expect(result.reason).toMatch(/待機時間超過/);
    expect(result.elapsed_hours).toBe(25);
    expect(result.max_hours).toBe(24);
    expect(result.log_message).toMatch(/催促ループ終了/);
    expect(result.log_message).toMatch(/25h.*24h/);
  });
});