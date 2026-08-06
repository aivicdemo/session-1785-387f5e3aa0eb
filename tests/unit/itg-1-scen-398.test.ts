import { determinePromptionNeeded } from '../../src/logic/it-1-br-1-1-1';

describe('催促要否自動判定機能', () => {
  // SCEN-398
  test('期限超過した部員に対して催促要と判定される', () => {
    const deadline_iso = '2024-01-15T00:00:00Z';
    const current_time_iso = '2024-01-15T09:00:00Z';
    const submission_status = 'not_submitted';
    const employee_id = 'EMP001';

    const result = determinePromptionNeeded({
      employeeId: employee_id,
      deadline: new Date(deadline_iso),
      currentTime: new Date(current_time_iso),
      submissionStatus: submission_status,
    });

    expect(result.needsPromotion).toBe(true);
    expect(result.reason).toMatch(/報告期限/);
    expect(result.reason).toMatch(/超過/);
    expect(result.reason).toMatch(/未提出/);
  });
});