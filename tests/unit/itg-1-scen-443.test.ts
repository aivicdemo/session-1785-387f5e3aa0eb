import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { determinePromptLoopTermination } from '../../src/logic/it-1-br-1-1-1';

describe('催促ループ終了判定機能 - 同一部員の重複催促記録処理', () => {
  // SCEN-443
  test('同一部員に対する重複した催促記録がある場合、最新の催促試行回数でのみ判定される', () => {
    const employee_id = 'EMP-001';
    const prompt_attempt_limit = 3;

    const prompt_records = [
      {
        employee_id: employee_id,
        prompt_datetime: new Date('2024-01-01T09:00:00Z'),
        attempt_number: 1,
      },
      {
        employee_id: employee_id,
        prompt_datetime: new Date('2024-01-02T09:00:00Z'),
        attempt_number: 2,
      },
      {
        employee_id: employee_id,
        prompt_datetime: new Date('2024-01-03T09:00:00Z'),
        attempt_number: 3,
      },
    ];

    const latest_prompt_record = prompt_records[2];

    const result = determinePromptLoopTermination({
      latest_prompt_record: latest_prompt_record,
      prompt_attempt_limit: prompt_attempt_limit,
    });

    expect(result.should_terminate_prompt_loop).toBe(true);
    expect(result.evaluated_attempt_number).toBe(3);
    expect(result.evaluation_datetime).toEqual(new Date('2024-01-03T09:00:00Z'));
  });
});