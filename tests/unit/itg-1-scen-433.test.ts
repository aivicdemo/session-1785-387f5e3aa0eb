import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('朝会報告管理システム - 催促ループ終了判定機能', () => {
  test('SCEN-433: 催促試行回数がちょうど規定回数に達した時点で催促を停止する', async () => {
    // Import the logic function
    const { executePromptionLoop } = await import('../../src/logic/it-1-br-1-1-1');

    // Setup: Define maximum promotion attempt count
    const max_prompt_attempts = 3;
    const unreported_user_id = 'user_001';
    const promotion_attempt_results: Array<{
      attempt_number: number;
      email_sent: boolean;
      timestamp: string;
    }> = [];
    let loop_state = 'running';

    // Mock email sending function that records attempts
    const mock_send_promotion_email = async (
      user_id: string,
      attempt_number: number
    ): Promise<{ success: boolean }> => {
      promotion_attempt_results.push({
        attempt_number,
        email_sent: true,
        timestamp: new Date().toISOString(),
      });
      return { success: true };
    };

    // Execute promotion loop with max attempts
    const result = await executePromptionLoop({
      unreported_user_id,
      max_attempts: max_prompt_attempts,
      send_email_fn: mock_send_promotion_email,
    });

    // Verify: Promotion attempt 1
    expect(promotion_attempt_results.length).toBe(1);
    expect(promotion_attempt_results[0].attempt_number).toBe(1);
    expect(promotion_attempt_results[0].email_sent).toBe(true);

    // Execute promotion attempt 2
    const result_attempt_2 = await executePromptionLoop({
      unreported_user_id,
      max_attempts: max_prompt_attempts,
      send_email_fn: mock_send_promotion_email,
      current_attempt: 2,
    });

    // Verify: Promotion attempt 2
    expect(promotion_attempt_results.length).toBe(2);
    expect(promotion_attempt_results[1].attempt_number).toBe(2);
    expect(promotion_attempt_results[1].email_sent).toBe(true);

    // Execute promotion attempt 3
    const result_attempt_3 = await executePromptionLoop({
      unreported_user_id,
      max_attempts: max_prompt_attempts,
      send_email_fn: mock_send_promotion_email,
      current_attempt: 3,
    });

    // Verify: Promotion attempt 3
    expect(promotion_attempt_results.length).toBe(3);
    expect(promotion_attempt_results[2].attempt_number).toBe(3);
    expect(promotion_attempt_results[2].email_sent).toBe(true);

    // Execute loop termination check
    const termination_check_result = await executePromptionLoop({
      unreported_user_id,
      max_attempts: max_prompt_attempts,
      send_email_fn: mock_send_promotion_email,
      current_attempt: 3,
      check_termination: true,
    });

    // Verify: Promotion attempt count reaches max
    expect(termination_check_result.attempt_count).toBe(3);
    expect(termination_check_result.should_terminate).toBe(true);

    // Verify: Loop state transitions to terminated
    expect(termination_check_result.loop_state).toBe('terminated');

    // Verify: Attempt 4 is NOT executed (loop is stopped)
    const result_attempt_4_attempt = await executePromptionLoop({
      unreported_user_id,
      max_attempts: max_prompt_attempts,
      send_email_fn: mock_send_promotion_email,
      current_attempt: 4,
      check_termination: true,
    });

    // Verify: No additional email was sent for attempt 4
    expect(promotion_attempt_results.length).toBe(3);
    expect(result_attempt_4_attempt.loop_state).toBe('terminated');
    expect(result_attempt_4_attempt.attempt_prevented).toBe(true);

    // Final assertion: Loop is completely stopped
    expect(termination_check_result.loop_state).toBe('terminated');
    expect(promotion_attempt_results.filter(r => r.email_sent).length).toBe(
      max_prompt_attempts
    );
  });
});