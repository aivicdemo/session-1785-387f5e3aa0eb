import { validateReportFormat } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-496
  test('複数の部員からの報告に重複データが含まれる場合、各データが独立に検証される', () => {
    const reportA = {
      userId: 'engineer_a',
      yesterday: 'タスクX完了',
      today: 'タスクY実施',
      issue: 'リソース不足',
      submittedAt: new Date('2024-01-15T08:00:00Z'),
    };

    const reportB = {
      userId: 'engineer_b',
      yesterday: 'タスクX完了',
      today: 'タスクZ実施',
      issue: 'リソース不足',
      submittedAt: new Date('2024-01-15T08:05:00Z'),
    };

    const reportC = {
      userId: 'engineer_c',
      yesterday: 'タスクX完了',
      today: 'タスクW実施',
      issue: '進捗遅延',
      submittedAt: new Date('2024-01-15T08:10:00Z'),
    };

    const resultA = validateReportFormat(reportA);
    const resultB = validateReportFormat(reportB);
    const resultC = validateReportFormat(reportC);

    expect(resultA).toEqual({
      isValid: true,
      userId: 'engineer_a',
      hasYesterday: true,
      hasToday: true,
      hasIssue: true,
      errors: [],
    });

    expect(resultB).toEqual({
      isValid: true,
      userId: 'engineer_b',
      hasYesterday: true,
      hasToday: true,
      hasIssue: true,
      errors: [],
    });

    expect(resultC).toEqual({
      isValid: true,
      userId: 'engineer_c',
      hasYesterday: true,
      hasToday: true,
      hasIssue: true,
      errors: [],
    });

    expect(resultA.userId).not.toBe(resultB.userId);
    expect(resultB.userId).not.toBe(resultC.userId);
    expect(resultA.isValid).toBe(true);
    expect(resultB.isValid).toBe(true);
    expect(resultC.isValid).toBe(true);
  });
});