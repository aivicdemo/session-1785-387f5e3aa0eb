import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateReportFormat } from '../../src/logic/it-1-br-1-1-1';

describe('Report Format Validation - Empty Yesterday Achievement Field', () => {
  let report: {
    yesterdayAchievement: string;
    todayPlan: string;
    currentChallenges: string;
  };

  beforeEach(() => {
    report = {
      yesterdayAchievement: '',
      todayPlan: 'Complete API integration testing',
      currentChallenges: 'Database performance optimization needed',
    };
  });

  // SCEN-492
  test('should return warning when yesterdayAchievement is empty string', () => {
    const result = validateReportFormat(report);

    expect(result.isValid).toBe(false);
    expect(result.severity).toBe('warning');
    expect(result.message).toMatch(/昨日やったこと/);
    expect(result.canSubmit).toBe(false);
  });
});