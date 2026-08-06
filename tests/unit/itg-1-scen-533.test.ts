import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/ai-client.interface';

const fetchMock = require('jest-fetch-mock');

describe('日報入力から送信・確認メール配信までの自動化 - AIエージェント入力検証エスカレーション', () => {
  let mockAiClient: jest.Mocked<Tx1Imp1AiClient>;
  let escalationLog: Array<{
    engineerId: string;
    requiredFields: string[];
    timestamp: string;
    escalationReason: string;
  }> = [];
  let systemRegistrationLog: Array<{
    engineerId: string;
    timestamp: string;
  }> = [];
  let emailSendLog: Array<{
    recipientType: string;
    timestamp: string;
  }> = [];

  beforeEach(() => {
    fetchMock.resetMocks();
    escalationLog = [];
    systemRegistrationLog = [];
    emailSendLog = [];

    mockAiClient = {
      validateReportContent: jest.fn(),
      generateReportTemplate: jest.fn(),
      extractReportSummary: jest.fn(),
    } as unknown as jest.Mocked<Tx1Imp1AiClient>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-533
  test('should escalate when report input is incomplete before confirming side effects', async () => {
    const engineerId = 'ENG-001';
    const incompleteReportInput = {
      engineerId: engineerId,
      yesterdayWork: '',
      todayPlan: '',
      currentChallenges: 'リリース準備の遅延により、来週の本リリーズに向けたテスト期間が圧縮される可能性がある',
      submittedAt: new Date('2024-01-15T08:30:00Z').toISOString(),
    };

    const validationTimestamp = new Date('2024-01-15T08:31:00Z').toISOString();

    mockAiClient.validateReportContent.mockResolvedValue({
      validationStatus: 'incomplete',
      requiredFields: ['yesterday_work', 'today_plan'],
      missingFieldDescriptions: {
        yesterday_work: '昨日の実績が入力されていません',
        today_plan: '本日の予定が入力されていません',
      },
      isValid: false,
      timestamp: validationTimestamp,
    });

    const mockEscalationNotificationHandler = jest.fn(
      (escalationPayload: {
        engineerId: string;
        requiredFields: string[];
        timestamp: string;
        escalationReason: string;
      }) => {
        escalationLog.push(escalationPayload);
      }
    );

    const mockSystemRegistrationHandler = jest.fn(
      (registrationPayload: {
        engineerId: string;
        timestamp: string;
      }) => {
        systemRegistrationLog.push(registrationPayload);
      }
    );

    const mockEmailSendHandler = jest.fn(
      (emailPayload: {
        recipientType: string;
        timestamp: string;
      }) => {
        emailSendLog.push(emailPayload);
      }
    );

    const orchestratorResult = await runTx1Imp1Agent(
      {
        reportInput: incompleteReportInput,
        aiClient: mockAiClient,
      },
      {
        onEscalation: mockEscalationNotificationHandler,
        onSystemRegistration: mockSystemRegistrationHandler,
        onEmailSend: mockEmailSendHandler,
      }
    );

    expect(mockAiClient.validateReportContent).toHaveBeenCalledWith({
      yesterdayWork: '',
      todayPlan: '',
      currentChallenges: incompleteReportInput.currentChallenges,
    });

    expect(orchestratorResult.status).toBe('escalation_pending');
    expect(orchestratorResult.escalationReason).toBe('input_incomplete');
    expect(orchestratorResult.requiredFieldsForCompletion).toEqual([
      'yesterday_work',
      'today_plan',
    ]);

    expect(mockEscalationNotificationHandler).toHaveBeenCalledTimes(1);
    expect(escalationLog.length).toBe(1);

    const escalationNotification = escalationLog[0];
    expect(escalationNotification.engineerId).toBe(engineerId);
    expect(escalationNotification.requiredFields).toEqual([
      'yesterday_work',
      'today_plan',
    ]);
    expect(escalationNotification.timestamp).toBe(validationTimestamp);
    expect(escalationNotification.escalationReason).toBe('input_incomplete');

    expect(mockSystemRegistrationHandler).not.toHaveBeenCalled();
    expect(systemRegistrationLog.length).toBe(0);

    expect(mockEmailSendHandler).not.toHaveBeenCalled();
    expect(emailSendLog.length).toBe(0);

    expect(orchestratorResult.sideEffectConfirmed).toBe(false);
    expect(orchestratorResult.systemRegistrationId).toBeUndefined();
    expect(orchestratorResult.confirmationEmailSent).toBe(false);
  });
});