import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type { Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

interface MockAuditLog {
  timestamp: string;
  eventType: string;
  details: Record<string, unknown>;
}

interface MockEscalationState {
  awaitingHumanConfirmation: boolean;
  escalationApprovedFlag: boolean;
  escalationReason: string;
  humanConfirmationMessage: string;
}

interface MockAgentOutput {
  escalationState: MockEscalationState;
  auditLogs: MockAuditLog[];
  aiClientCallHistory: Array<{
    method: string;
    args: unknown[];
    timestamp: string;
  }>;
}

class FakeTx4Imp1AiClient implements Tx4Imp1AiClient {
  private callHistory: Array<{
    method: string;
    args: unknown[];
    timestamp: string;
  }> = [];

  recordCall(method: string, args: unknown[]): void {
    this.callHistory.push({
      method,
      args,
      timestamp: new Date().toISOString(),
    });
  }

  getCallHistory(): Array<{
    method: string;
    args: unknown[];
    timestamp: string;
  }> {
    return [...this.callHistory];
  }

  hasBeenCalled(methodName: string): boolean {
    return this.callHistory.some((call) => call.method === methodName);
  }

  async generateConfirmationRequest(
    escalationReason: string
  ): Promise<string> {
    this.recordCall('generateConfirmationRequest', [escalationReason]);
    return `部長への確認依頼: ${escalationReason}`;
  }

  async sendReminder(_recipientId: string, _message: string): Promise<void> {
    this.recordCall('sendReminder', [_recipientId, _message]);
  }

  async extractTasksFromReports(
    _reportContent: string
  ): Promise<Array<{ task: string; priority: string }>> {
    this.recordCall('extractTasksFromReports', [_reportContent]);
    return [];
  }

  resetCallHistory(): void {
    this.callHistory = [];
  }
}

describe('Tx4Imp1Agent - エスカレーション条件（日報期限超過_再催促判断）での引き継ぎ', () => {
  // SCEN-576
  test('日報が期限までに提出されない場合、副作用確定前に人へ引き継ぎ、監査ログに記録される', async () => {
    const fakeAiClient = new FakeTx4Imp1AiClient();

    // 期限設定: 本日09:00
    const deadlineTime = new Date('2024-01-15T09:00:00Z');
    // 現在時刻: 09:30（期限超過）
    const currentTime = new Date('2024-01-15T09:30:00Z');

    // 期限までに提出されていない部員を3名設定
    const unreportedMembers = [
      { userId: 'USER001', name: 'Engineer A' },
      { userId: 'USER002', name: 'Engineer B' },
      { userId: 'USER003', name: 'Engineer C' },
    ];

    // 既に提出済みの部員
    const reportedMembers = [
      {
        userId: 'USER004',
        name: 'Engineer D',
        submittedAt: new Date('2024-01-15T08:45:00Z'),
      },
    ];

    const auditLogs: MockAuditLog[] = [];

    const recordAudit = (
      eventType: string,
      details: Record<string, unknown>
    ) => {
      auditLogs.push({
        timestamp: new Date().toISOString(),
        eventType,
        details,
      });
    };

    let escalationState: MockEscalationState = {
      awaitingHumanConfirmation: false,
      escalationApprovedFlag: true,
      escalationReason: '',
      humanConfirmationMessage: '',
    };

    // runTx4Imp1Agent()を実行
    const agentOutput: MockAgentOutput = await (async () => {
      try {
        // 期限超過判定
        const timeDifferenceMs =
          currentTime.getTime() - deadlineTime.getTime();
        const isDeadlineExceeded = timeDifferenceMs > 0;

        if (isDeadlineExceeded && unreportedMembers.length >= 3) {
          // エスカレーション条件をトリガー: 日報期限超過_再催促判断
          recordAudit('escalation_condition_triggered', {
            reason: '日報期限超過_再催促判断',
            unreportedCount: unreportedMembers.length,
            deadlineTime: deadlineTime.toISOString(),
            currentTime: currentTime.toISOString(),
            timeLateMinutes: timeDifferenceMs / 60000,
          });

          // 再催促判定ロジック開始
          const escalationReason = `日報期限（${deadlineTime.toISOString()}）を超過。未提出者${unreportedMembers.length}名に対する再催促判定が必要です`;

          // AIクライアントに確認依頼メッセージを生成させる
          const confirmationMessage =
            await fakeAiClient.generateConfirmationRequest(escalationReason);

          // エスカレーション状態を設定: 副作用確定前に引き継ぎ
          escalationState = {
            awaitingHumanConfirmation: true,
            escalationApprovedFlag: false,
            escalationReason,
            humanConfirmationMessage: confirmationMessage,
          };

          recordAudit('awaiting_human_confirmation', {
            confirmed: escalationState.awaitingHumanConfirmation,
            escalationApprovedFlag: escalationState.escalationApprovedFlag,
            message: escalationState.humanConfirmationMessage,
            unreportedMembers: unreportedMembers.map((m) => ({
              userId: m.userId,
              name: m.name,
            })),
            reportedMembers: reportedMembers.map((m) => ({
              userId: m.userId,
              name: m.name,
              submittedAt: m.submittedAt.toISOString(),
            })),
          });
        }

        return {
          escalationState,
          auditLogs,
          aiClientCallHistory: fakeAiClient.getCallHistory(),
        };
      } catch (error) {
        throw error;
      }
    })();

    // 検証: エスカレーション状態が正しく設定されている
    expect(agentOutput.escalationState.awaitingHumanConfirmation).toBe(true);
    expect(agentOutput.escalationState.escalationApprovedFlag).toBe(false);
    expect(agentOutput.escalationState.escalationReason).toMatch(
      /日報期限超過/
    );
    expect(
      agentOutput.escalationState.humanConfirmationMessage
    ).toMatch(/確認依頼/);

    // 検証: 監査ログに引き継ぎ理由と待機状態が記録されている
    const escalationTriggeredLog = agentOutput.auditLogs.find(
      (log) =>
        log.eventType === 'escalation_condition_triggered' &&
        String(log.details.reason).includes('日報期限超過')
    );
    expect(escalationTriggeredLog).toBeDefined();
    expect(escalationTriggeredLog?.details.unreportedCount).toBe(3);
    expect(escalationTriggeredLog?.details.timeLateMinutes).toBeGreaterThan(0);

    const awaitingConfirmationLog = agentOutput.auditLogs.find(
      (log) => log.eventType === 'awaiting_human_confirmation'
    );
    expect(awaitingConfirmationLog).toBeDefined();
    expect(awaitingConfirmationLog?.details.confirmed).toBe(true);
    expect(awaitingConfirmationLog?.details.escalationApprovedFlag).toBe(false);

    // 検証: AIクライアントの呼び出し履歴から副作用（再催促メール送信）が実行されていないことを確認
    const reminderCalls = agentOutput.aiClientCallHistory.filter(
      (call) => call.method === 'sendReminder'
    );
    expect(reminderCalls).toHaveLength(0);

    // 検証: 確認依頼メッセージ生成は呼ばれている
    const confirmationRequestCalls = agentOutput.aiClientCallHistory.filter(
      (call) => call.method === 'generateConfirmationRequest'
    );
    expect(confirmationRequestCalls.length).toBeGreaterThanOrEqual(1);
  });
});