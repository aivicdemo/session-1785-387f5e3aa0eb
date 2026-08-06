import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('報告送信時の確認メール自動配信', () => {
  // SCEN-397: [edge] 催促要否自動判定機能 - 期限内に報告された部員に対して催促不要と判定される
  test('期限内に報告された部員に対して催促不要と判定される', async () => {
    // Arrange
    const deadline_time = new Date('2024-01-15T10:00:00Z');
    const submission_time = new Date('2024-01-15T09:30:00Z');
    const employee_id = 'EMP001';
    const yesterday_achievement = 'データベース最適化を実施';
    const today_plan = 'APIエンドポイントの実装';
    const current_challenges = 'テスト環境の構築遅延';

    // Act
    const { shouldPrompt, reason } = await determinePromptingNecessity({
      employee_id,
      submission_time,
      deadline_time,
      yesterday_achievement,
      today_plan,
      current_challenges,
    });

    // Assert
    expect(shouldPrompt).toBe(false);
    expect(reason).toMatch(/期限内/);
  });
});

interface ReportSubmissionInput {
  employee_id: string;
  submission_time: Date;
  deadline_time: Date;
  yesterday_achievement: string;
  today_plan: string;
  current_challenges: string;
}

interface PromptingDecision {
  shouldPrompt: boolean;
  reason: string;
}

async function determinePromptingNecessity(
  input: ReportSubmissionInput
): Promise<PromptingDecision> {
  const is_submitted_before_deadline =
    input.submission_time <= input.deadline_time;

  if (is_submitted_before_deadline) {
    return {
      shouldPrompt: false,
      reason: '期限内に報告が完了しているため催促不要',
    };
  }

  return {
    shouldPrompt: true,
    reason: '報告期限を超過しているため催促が必要',
  };
}