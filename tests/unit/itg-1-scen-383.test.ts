import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-383
  test('報告送信日時が null のとき、期限判定関数はエラーをスローする', async () => {
    const { isOverdue } = await import('../../src/logic/it-1-br-1-1-1');

    const reportWithNullSubmitDateTime = {
      reportId: 'rpt-001',
      userId: 'usr-001',
      departmentId: 'dept-001',
      submittedAt: null,
      yesterdayResult: '昨日の実績',
      todayPlan: '本日の予定',
      issues: '抱えている課題',
    };

    expect(() => {
      isOverdue(reportWithNullSubmitDateTime);
    }).toThrow(/送信日時/);
  });
});