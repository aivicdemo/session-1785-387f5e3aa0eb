import { runTx3Imp1Agent } from '../../src/logic/tx-3-imp-1';

// Mock types for AI client and database transaction
interface MockAiClientResponse {
  isSpecialCase: boolean;
  requiresHumanReview: boolean;
  reason: string;
}

interface MockDbTransaction {
  isOpen: boolean;
  isAborted: boolean;
  records: Array<{
    id: string;
    type: string;
    data: unknown;
  }>;
}

interface ConfirmationEmailContent {
  employeeA: {
    name: string;
    status: 'unreported';
  };
  employeeB: {
    name: string;
    status: 'delayed';
  };
}

interface FollowUpNotification {
  issuedToManager: boolean;
  escalationFlag: boolean;
  requiresHumanConfirmation: boolean;
  reason: string;
}

interface OrchestrationState {
  transaction: MockDbTransaction;
  escalationOccurred: boolean;
  followUpNotification: FollowUpNotification | null;
  promotionMailSent: boolean;
  promotionChatSent: boolean;
}

// Fake AI client for testing
class FakeAiClientForSpecialCase {
  async evaluateFollowUpTarget(
    unreportedEmployees: Array<{ name: string }>,
    delayedEmployees: Array<{ name: string }>
  ): Promise<MockAiClientResponse> {
    // Simulate detection of special case that doesn't match promotion rules
    return {
      isSpecialCase: true,
      requiresHumanReview: true,
      reason: 'special_case_not_matching_rules'
    };
  }
}

// Mock database transaction
function createMockDbTransaction(): MockDbTransaction {
  return {
    isOpen: true,
    isAborted: false,
    records: []
  };
}

describe('日報入力フォームの提供と送信機能 - Tx3Imp1Agent エスカレーション処理', () => {
  test('SCEN-562: 催促ルールに該当しない特殊ケース時に副作用確定前に人へ引き継ぐ', async () => {
    // Setup: Initialize fake AI client and mock database transaction
    const fakeAiClient = new FakeAiClientForSpecialCase();
    const mockDbTransaction = createMockDbTransaction();

    // Setup: Prepare confirmation email content with unreported employee A and delayed employee B
    const confirmationEmailContent: ConfirmationEmailContent = {
      employeeA: {
        name: 'Engineer A',
        status: 'unreported'
      },
      employeeB: {
        name: 'Engineer B',
        status: 'delayed'
      }
    };

    // Setup: Verify transaction is open before execution
    expect(mockDbTransaction.isOpen).toBe(true);
    expect(mockDbTransaction.isAborted).toBe(false);

    // Setup: Verify no promotion logs exist before execution
    const promotionLogsBeforeExecution = mockDbTransaction.records.filter(
      (rec) => rec.type === 'promotion_mail_log' || rec.type === 'promotion_chat_log'
    );
    expect(promotionLogsBeforeExecution.length).toBe(0);

    // Execution: Call runTx3Imp1Agent with confirmation email content
    const result = await runTx3Imp1Agent(
      {
        unreportedEmployees: [
          { name: confirmationEmailContent.employeeA.name }
        ],
        delayedEmployees: [
          { name: confirmationEmailContent.employeeB.name }
        ],
        aiClient: fakeAiClient as any,
        dbTransaction: mockDbTransaction as any,
        managerNotificationHandler: (notification: FollowUpNotification) => {
          // Capture manager notification for verification
          return notification;
        }
      },
      {}
    );

    // Verification: After escalation, transaction should be aborted
    expect(mockDbTransaction.isAborted).toBe(true);

    // Verification: Escalation flag should be set in result
    expect(result.escalationOccurred).toBe(true);

    // Verification: Escalation reason should indicate special case
    expect(result.escalationReason).toMatch(/special_case|特殊ケース/);

    // Verification: No promotion mail/chat should have been sent (side effects prevented)
    const promotionLogsAfterEscalation = mockDbTransaction.records.filter(
      (rec) => rec.type === 'promotion_mail_log' || rec.type === 'promotion_chat_log'
    );
    expect(promotionLogsAfterEscalation.length).toBe(0);

    // Verification: Follow-up notification should be generated for manager
    expect(result.followUpNotification).toBeDefined();
    expect(result.followUpNotification.issuedToManager).toBe(true);
    expect(result.followUpNotification.escalationFlag).toBe(true);
    expect(result.followUpNotification.requiresHumanConfirmation).toBe(true);

    // Verification: Escalation reason should be recorded as special case
    expect(result.followUpNotification.reason).toBe(
      'special_case_not_matching_rules'
    );

    // Verification: DB should only contain follow-up decision record, no partial promotion records
    const followUpDecisionRecords = mockDbTransaction.records.filter(
      (rec) => rec.type === 'follow_up_decision'
    );
    expect(followUpDecisionRecords.length).toBe(1);
    expect(followUpDecisionRecords[0].data).toEqual({
      status: 'requires_human_confirmation',
      reason: 'special_case_not_matching_rules',
      unreportedEmployeeCount: 1,
      delayedEmployeeCount: 1
    });

    // Verification: Manager notification record should exist
    const notificationRecords = mockDbTransaction.records.filter(
      (rec) => rec.type === 'manager_escalation_notification'
    );
    expect(notificationRecords.length).toBe(1);
    expect(notificationRecords[0].data).toEqual({
      escalationTriggeredAt: expect.any(String),
      requiresManagerReview: true,
      unreportedEmployees: [confirmationEmailContent.employeeA.name],
      delayedEmployees: [confirmationEmailContent.employeeB.name],
      reason: 'special_case_not_matching_rules'
    });
  });
});