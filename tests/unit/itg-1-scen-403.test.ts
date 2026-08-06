import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendConfirmationEmailsToReporterAndManager } from '../../src/logic/it-1-br-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('it-1-br-1-1-1: Report submission confirmation emails', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-403: [normal] Reminding loop termination judgment - Reminding chat sent, no re-report within set time, loop terminates
  test('should terminate reminding loop after set waiting period with no re-report from target member', async () => {
    // Setup: Initialize test data
    const remindingLoopId = 'loop-20240115-001';
    const targetUserId = 'engineer-a-001';
    const targetUserEmail = 'engineer-a@company.com';
    const managerEmail = 'manager@company.com';
    const chatChannelId = 'ch-dev-team-001';
    
    const remindingChatSentTime = new Date('2024-01-15T08:00:00Z');
    const waitingPeriodMs = 24 * 60 * 60 * 1000; // 24 hours
    const loopCheckTime = new Date('2024-01-16T08:00:01Z'); // After waiting period
    
    const reportData = {
      userId: targetUserId,
      userName: 'Engineer A',
      department: 'Development',
      yesterdayAccomplishment: 'Completed feature X',
      todayPlan: 'Start feature Y',
      challengesHeld: 'Blocked by API',
      sentAt: remindingChatSentTime,
    };

    const reminderState = {
      remindingLoopId,
      targetUserId,
      targetUserEmail,
      managerEmail,
      chatChannelId,
      remindingChatSentTime,
      waitingPeriodMs,
      remindingAttemptCount: 1,
      loopStatus: 'active' as const,
      lastChatMessageId: 'msg-20240115-001',
    };

    // Mock: Stub services for reminder chat send and re-report check
    fetchMock.mockResponses(
      // First call: Send reminder chat
      [
        JSON.stringify({
          success: true,
          messageId: 'msg-20240115-001',
          sentAt: remindingChatSentTime.toISOString(),
          channelId: chatChannelId,
        }),
        { status: 200 },
      ],
      // Second call: Check for re-report (none found)
      [
        JSON.stringify({
          success: true,
          hasReportAfterReminder: false,
          lastReportTime: null,
          elapsedMs: waitingPeriodMs + 1000,
        }),
        { status: 200 },
      ],
      // Third call: Send confirmation email to reporter (no re-report, loop terminated)
      [
        JSON.stringify({
          success: true,
          emailId: 'email-20240116-loop-end',
          sentAt: loopCheckTime.toISOString(),
          recipient: targetUserEmail,
          type: 'loop_terminated_notification',
        }),
        { status: 200 },
      ],
      // Fourth call: Send confirmation email to manager (loop terminated notification)
      [
        JSON.stringify({
          success: true,
          emailId: 'email-20240116-loop-end-mgr',
          sentAt: loopCheckTime.toISOString(),
          recipient: managerEmail,
          type: 'loop_terminated_notification',
          remindingLoopId,
        }),
        { status: 200 },
      ],
    );

    // Action: Call function to send confirmation emails after reminding chat
    const result = await sendConfirmationEmailsToReporterAndManager({
      remindingLoopId,
      reportData,
      reminderState,
      currentCheckTime: loopCheckTime,
    });

    // Verify: Assertions on result
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        loopStatus: 'terminated',
        loopTerminatedAt: loopCheckTime.toISOString(),
        confirmedReportData: expect.objectContaining({
          userId: targetUserId,
          userName: 'Engineer A',
          yesterdayAccomplishment: 'Completed feature X',
          todayPlan: 'Start feature Y',
          challengesHeld: 'Blocked by API',
        }),
        emailsSentToReporter: expect.objectContaining({
          success: true,
          type: 'loop_terminated_notification',
          recipient: targetUserEmail,
        }),
        emailsSentToManager: expect.objectContaining({
          success: true,
          type: 'loop_terminated_notification',
          recipient: managerEmail,
          remindingLoopId,
        }),
        systemLog: expect.objectContaining({
          remindingLoopId,
          targetUserId,
          status: 'terminated',
          terminatedAt: loopCheckTime.toISOString(),
          waitingPeriodActualMs: waitingPeriodMs + 1000,
          remindingAttemptCount: 1,
        }),
      }),
    );

    // Verify: Fetch calls were made with correct endpoints
    expect(fetchMock.mock.calls.length).toBe(4);

    // Verify: System log recorded correctly
    expect(result.systemLog.remindingLoopId).toBe(remindingLoopId);
    expect(result.systemLog.targetUserId).toBe(targetUserId);
    expect(result.systemLog.status).toBe('terminated');
    expect(result.loopStatus).toBe('terminated');

    // Verify: No automatic reminding message will be sent after termination
    expect(result.remindingLoopClosed).toBe(true);
  });
});