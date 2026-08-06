import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx3Imp1Agent } from '../../src/logic/it-1';

const fetchMock = require('jest-fetch-mock');

describe('報告漏れ特定から催促送信までの自動実行 AIエージェント - 権限外アクセス拒否', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-565
  test('権限外のメール送信・チャット送信・履歴参照が拒否され、エージェント実行が中断される', async () => {
    const executionUserId = 'USER_AGENT_LIMITED';
    const confirmationMailContent = {
      timestamp: new Date('2024-01-15T08:45:00Z').toISOString(),
      departmentId: 'DEV_DEPT_001',
      totalMembers: 10,
      submittedMembers: 7,
      missingReports: [
        {
          userId: 'U001',
          employeeName: '山田太郎',
          status: 'NOT_SUBMITTED',
          submittedAt: null,
          isOverdue: true,
        },
        {
          userId: 'U002',
          employeeName: '佐藤花子',
          status: 'NOT_SUBMITTED',
          submittedAt: null,
          isOverdue: true,
        },
        {
          userId: 'U003',
          employeeName: '鈴木次郎',
          status: 'LATE_SUBMISSION',
          submittedAt: new Date('2024-01-15T08:35:00Z').toISOString(),
          isOverdue: true,
        },
      ],
      meetingStartTime: new Date('2024-01-15T09:00:00Z').toISOString(),
    };

    const userAuthorizationStub = {
      userId: executionUserId,
      grantedPermissions: ['report.identify_missing'],
      deniedPermissions: ['mail.send', 'chat.send', 'send_history.write', 'send_history.read'],
    };

    const authCheckEndpoint = 'https://api.example.com/auth/check-authorization';
    const mailSendEndpoint = 'https://api.example.com/mail/send';
    const chatSendEndpoint = 'https://api.example.com/chat/send';
    const sendHistoryEndpoint = 'https://api.example.com/send-history/write';

    fetchMock.mockResponseOnce(
      JSON.stringify({
        authorized: true,
        userId: userAuthorizationStub.userId,
        permissions: userAuthorizationStub.grantedPermissions,
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        missingReports: confirmationMailContent.missingReports,
        identificationTime: new Date('2024-01-15T08:46:00Z').toISOString(),
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        error: 'PERMISSION_DENIED',
        code: 403,
        message: 'User lacks permission: mail.send',
        userId: executionUserId,
        requiredPermission: 'mail.send',
      }),
      { status: 403 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        error: 'PERMISSION_DENIED',
        code: 403,
        message: 'User lacks permission: send_history.write',
        userId: executionUserId,
        requiredPermission: 'send_history.write',
      }),
      { status: 403 }
    );

    const agentInput = {
      executorUserId: executionUserId,
      confirmationMailContent: confirmationMailContent,
      userAuthorizationContext: userAuthorizationStub,
      departmentId: confirmationMailContent.departmentId,
      meetingStartTime: confirmationMailContent.meetingStartTime,
      dryRun: false,
    };

    const result = await runTx3Imp1Agent(agentInput);

    expect(result).toEqual({
      success: false,
      failureReason: 'AUTHORIZATION_DENIED_AT_EMAIL_SEND',
      attemptedActions: ['identify_missing_reports', 'send_email'],
      completedActions: ['identify_missing_reports'],
      identifiedMissingReports: [
        {
          userId: 'U001',
          employeeName: '山田太郎',
          status: 'NOT_SUBMITTED',
          isOverdue: true,
        },
        {
          userId: 'U002',
          employeeName: '佐藤花子',
          status: 'NOT_SUBMITTED',
          isOverdue: true,
        },
        {
          userId: 'U003',
          employeeName: '鈴木次郎',
          status: 'LATE_SUBMISSION',
          isOverdue: true,
        },
      ],
      errorDetails: {
        statusCode: 403,
        errorCode: 'PERMISSION_DENIED',
        errorMessage: 'User lacks permission: mail.send',
        failedAction: 'send_email',
        failedAtTimestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
      },
      auditLog: expect.arrayContaining([
        expect.objectContaining({
          timestamp: expect.any(String),
          action: 'authorization_check',
          result: 'SUCCESS',
          userId: executionUserId,
        }),
        expect.objectContaining({
          timestamp: expect.any(String),
          action: 'identify_missing_reports',
          result: 'SUCCESS',
          identifiedCount: 3,
        }),
        expect.objectContaining({
          timestamp: expect.any(String),
          action: 'send_email',
          result: 'PERMISSION_DENIED',
          userId: executionUserId,
          requiredPermission: 'mail.send',
        }),
      ]),
      sideEffectsOccurred: false,
      mailSendAttempted: true,
      mailSendSucceeded: false,
      chatSendAttempted: false,
      sendHistoryWriteAttempted: false,
    });

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('AUTHORIZATION_DENIED_AT_EMAIL_SEND');
    expect(result.completedActions).toEqual(['identify_missing_reports']);
    expect(result.attemptedActions).toEqual(['identify_missing_reports', 'send_email']);
    expect(result.errorDetails.statusCode).toBe(403);
    expect(result.errorDetails.errorCode).toBe('PERMISSION_DENIED');
    expect(result.errorDetails.failedAction).toBe('send_email');
    expect(result.identifiedMissingReports.length).toBe(3);
    expect(result.identifiedMissingReports[0].userId).toBe('U001');
    expect(result.identifiedMissingReports[1].userId).toBe('U002');
    expect(result.identifiedMissingReports[2].userId).toBe('U003');
    expect(result.sideEffectsOccurred).toBe(false);
    expect(result.mailSendAttempted).toBe(true);
    expect(result.mailSendSucceeded).toBe(false);
    expect(result.chatSendAttempted).toBe(false);
    expect(result.sendHistoryWriteAttempted).toBe(false);
  });
});