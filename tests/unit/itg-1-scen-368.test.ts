import { describe, test, expect, beforeEach } from '@jest/globals';
import { determineAllReportsComplete } from '../../src/logic/it-1-br-1-1-1';

describe('全員報告完了判定機能', () => {
  // SCEN-368
  test('報告者が11名（10名を超える）の場合、全員報告完了と判定される', () => {
    const reporters = Array.from({ length: 11 }, (_, index) => ({
      userId: `user_${index + 1}`,
      userName: `reporter_${index + 1}`,
      departmentId: 'dev_dept',
      yesterdayAccomplishment: `昨日の実績${index + 1}`,
      todayPlan: `本日の予定${index + 1}`,
      currentChallenge: `抱えている課題${index + 1}`,
      submittedAt: new Date('2024-01-15T08:30:00Z'),
      submissionStatus: 'submitted' as const,
    }));

    const result = determineAllReportsComplete(reporters);

    expect(result).toEqual({
      isAllComplete: true,
      totalReporters: 11,
      completedCount: 11,
      incompleteReporters: [],
    });
  });
});