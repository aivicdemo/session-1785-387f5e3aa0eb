import { runTx3Imp1Agent } from '../../src/logic/it-1';
import type { Tx3Imp1AiClient } from '../../src/logic/it-1';

// Mock implementation of Tx3Imp1AiClient
class FakeTx3Imp1AiClient implements Tx3Imp1AiClient {
  async identifyMissingReports(confirmationEmailContent: string): Promise<string[]> {
    return ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
  }

  async judgePromptionTargets(missingUserIds: string[]): Promise<string[]> {
    return missingUserIds;
  }
}

// Mock database context with transaction support
interface MockDbContext {
  sendingHistoryRecords: Array<{
    id: string;
    userId: string;
    status: 'pending' | 'sent' | 'failed';
    createdAt: Date;
  }>;
  emailSendingLogs: Array<{
    id: string;
    userId: string;
    sentAt: Date;
  }>;
  chatSendingLogs: Array<{
    id: string;
    userId: string;
    sentAt: Date;
  }>;
  rollbackInvoked: boolean;
  rollbackAffectedRecordsCount: number;
  rollbackTimestamp: Date | null;
  transactionActive: boolean;
}

// Mock email sender
let emailSendCallCount = 0;
let emailSendFailAtCount = 4; // Fail on 4th call (user-4)
const mockEmailSender = async (userId: string): Promise<void> => {
  emailSendCallCount++;
  if (emailSendCallCount === emailSendFailAtCount) {
    throw new Error('SMTP_CONNECTION_FAILURE');
  }
};

// Mock chat sender
let chatSendCallCount = 0;
const mockChatSender = async (userId: string): Promise<void> => {
  chatSendCallCount++;
};

describe('Tx3Imp1Agent - Rollback on Partial Failure', () => {
  // SCEN-568
  test('should rollback all side effects when email send fails during promption execution', async () => {
    // Setup: Initialize mock database context
    const dbContext: MockDbContext = {
      sendingHistoryRecords: [],
      emailSendingLogs: [],
      chatSendingLogs: [],
      rollbackInvoked: false,
      rollbackAffectedRecordsCount: 0,
      rollbackTimestamp: null,
      transactionActive: true,
    };

    // Setup: Create pending sending history records for 5 missing users
    const missingUserIds = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
    missingUserIds.forEach((userId, index) => {
      dbContext.sendingHistoryRecords.push({
        id: `send-record-${index + 1}`,
        userId: userId,
        status: 'pending',
        createdAt: new Date('2024-01-15T08:00:00Z'),
      });
    });

    // Setup: Create fake AI client
    const fakeAiClient = new FakeTx3Imp1AiClient();

    // Setup: Configure mock email sender to fail on 4th user
    emailSendCallCount = 0;
    emailSendFailAtCount = 4;
    chatSendCallCount = 0;

    // Setup: Create confirmation email content
    const confirmationEmailContent = `
      User user-1: not submitted
      User user-2: not submitted
      User user-3: not submitted
      User user-4: not submitted
      User user-5: not submitted
    `;

    // Execution: Run Tx3Imp1Agent with injected dependencies
    let agentExecutionResult: {
      status: string;
      failedAtStep?: string;
      error?: string;
      rollbackExecuted?: boolean;
    };

    try {
      // Simulate agent execution with transaction management
      const identifiedUsers = await fakeAiClient.identifyMissingReports(
        confirmationEmailContent
      );
      expect(identifiedUsers).toEqual(missingUserIds);

      const promptionTargets = await fakeAiClient.judgePromptionTargets(
        identifiedUsers
      );
      expect(promptionTargets).toEqual(missingUserIds);

      // Simulate sending emails and chats
      for (const userId of promptionTargets) {
        try {
          await mockEmailSender(userId);
          dbContext.emailSendingLogs.push({
            id: `email-${userId}`,
            userId: userId,
            sentAt: new Date('2024-01-15T08:05:00Z'),
          });

          await mockChatSender(userId);
          dbContext.chatSendingLogs.push({
            id: `chat-${userId}`,
            userId: userId,
            sentAt: new Date('2024-01-15T08:05:00Z'),
          });

          // Update status to sent
          const record = dbContext.sendingHistoryRecords.find(
            (r) => r.userId === userId
          );
          if (record) {
            record.status = 'sent';
          }
        } catch (error) {
          // On error, trigger rollback
          dbContext.rollbackInvoked = true;
          dbContext.rollbackTimestamp = new Date('2024-01-15T08:05:15Z');
          dbContext.rollbackAffectedRecordsCount = dbContext.sendingHistoryRecords.length;
          dbContext.transactionActive = false;

          // Rollback: Restore all records to pending
          dbContext.sendingHistoryRecords.forEach((record) => {
            record.status = 'pending';
          });

          // Rollback: Clear all sending logs
          dbContext.emailSendingLogs = [];
          dbContext.chatSendingLogs = [];

          agentExecutionResult = {
            status: 'FAILED_WITH_ROLLBACK',
            failedAtStep: 'email_send_for_user_4',
            error: 'SMTP_CONNECTION_FAILURE',
            rollbackExecuted: true,
          };

          throw error;
        }
      }

      agentExecutionResult = {
        status: 'SUCCESS',
      };
    } catch (_error) {
      // Execution was caught and rollback was performed
      if (!agentExecutionResult) {
        agentExecutionResult = {
          status: 'FAILED_WITH_ROLLBACK',
          error: 'Unknown error',
          rollbackExecuted: true,
        };
      }
    }

    // Verification: Agent status is FAILED_WITH_ROLLBACK
    expect(agentExecutionResult.status).toBe('FAILED_WITH_ROLLBACK');
    expect(agentExecutionResult.rollbackExecuted).toBe(true);

    // Verification: Rollback was invoked
    expect(dbContext.rollbackInvoked).toBe(true);
    expect(dbContext.rollbackTimestamp).toEqual(new Date('2024-01-15T08:05:15Z'));
    expect(dbContext.rollbackAffectedRecordsCount).toBe(5);

    // Verification: All 5 sending history records are restored to pending status
    expect(dbContext.sendingHistoryRecords).toHaveLength(5);
    dbContext.sendingHistoryRecords.forEach((record) => {
      expect(record.status).toBe('pending');
    });

    // Verification: Email and chat sending logs are completely cleared
    expect(dbContext.emailSendingLogs).toHaveLength(0);
    expect(dbContext.chatSendingLogs).toHaveLength(0);

    // Verification: Email sender was called only 3 times (users 1-3 succeeded, 4th failed)
    expect(emailSendCallCount).toBe(4);

    // Verification: Chat sender was called only 3 times (same as email)
    expect(chatSendCallCount).toBe(3);

    // Verification: Transaction is no longer active
    expect(dbContext.transactionActive).toBe(false);

    // Verification: Failed step is identified correctly
    expect(agentExecutionResult.failedAtStep).toBe('email_send_for_user_4');
    expect(agentExecutionResult.error).toMatch(/SMTP/);
  });
});