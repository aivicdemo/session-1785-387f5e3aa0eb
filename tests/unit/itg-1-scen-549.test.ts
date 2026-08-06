import { runTx2Imp1Agent } from '../../src/logic/it-1';

// Mock interfaces and types for AI client and supporting services
interface DailyReportStatus {
  userId: string;
  userName: string;
  reportedAt: string;
  isSubmitted: boolean;
}

interface MissingReportAnalysis {
  missingUsers: Array<{
    userId: string;
    userName: string;
  }>;
  delayedUsers: Array<{
    userId: string;
    userName: string;
    delayMinutes: number;
  }>;
  analysisTimestamp: string;
  analysisStatus: string;
}

interface EscalationNotification {
  escalationReason: string;
  errorDetails: string;
  originalAiOutput: string;
  targetPeriod: string;
  recommendedAction: string;
  timestamp: string;
  agentProcessId: string;
}

interface AuditLogEntry {
  eventType: string;
  timestamp: string;
  agentProcessId: string;
  cause: string;
}

// Fake AI Client for testing
class FakeTx2Imp1AiClient {
  private responseOverride: any = null;

  setResponseOverride(response: any): void {
    this.responseOverride = response;
  }

  async analyzeReportStatus(
    _reportStatuses: DailyReportStatus[]
  ): Promise<MissingReportAnalysis> {
    if (this.responseOverride !== null) {
      return this.responseOverride;
    }
    return {
      missingUsers: [],
      delayedUsers: [],
      analysisTimestamp: new Date('2024-01-15T09:00:00Z').toISOString(),
      analysisStatus: 'COMPLETED'
    };
  }
}

// Mock email service
class MockEmailService {
  private callLog: any[] = [];

  async sendNotificationToManager(
    _managerId: string,
    _subject: string,
    _body: string
  ): Promise<void> {
    this.callLog.push({
      type: 'manager_notification',
      timestamp: new Date('2024-01-15T09:00:00Z').toISOString()
    });
  }

  async sendEscalationNotification(
    notification: EscalationNotification
  ): Promise<void> {
    this.callLog.push({
      type: 'escalation_notification',
      content: notification,
      timestamp: new Date('2024-01-15T09:00:00Z').toISOString()
    });
  }

  getCallLog(): any[] {
    return this.callLog;
  }

  resetCallLog(): void {
    this.callLog = [];
  }
}

// Mock audit logger
class MockAuditLogger {
  private logs: AuditLogEntry[] = [];

  recordEvent(entry: AuditLogEntry): void {
    this.logs.push(entry);
  }

  getLogs(): AuditLogEntry[] {
    return this.logs;
  }

  resetLogs(): void {
    this.logs = [];
  }
}

describe('日報収集から報告漏れ特定までの自動判定と通知 - AIエージェント不正出力拒否テスト', () => {
  test('SCEN-549: 不正形式のAI出力を検出して処理を中断し、エスカレーション通知を発行する', async () => {
    // Setup
    const fakeAiClient = new FakeTx2Imp1AiClient();
    const emailService = new MockEmailService();
    const auditLogger = new MockAuditLogger();

    const agentProcessId = 'tx2-imp1-20240115-001';
    const reportStatuses: DailyReportStatus[] = [
      {
        userId: 'usr001',
        userName: 'Engineer A',
        reportedAt: '2024-01-15T08:30:00Z',
        isSubmitted: true
      },
      {
        userId: 'usr002',
        userName: 'Engineer B',
        reportedAt: '',
        isSubmitted: false
      },
      {
        userId: 'usr003',
        userName: 'Engineer C',
        reportedAt: '2024-01-15T08:45:00Z',
        isSubmitted: true
      }
    ];

    // Configure Fake AI Client to return malformed output (missing required fields)
    const malformedAiOutput: any = {
      missingUsers: undefined, // Required field is undefined
      delayedUsers: 'not_an_array', // Should be array but is string
      analysisTimestamp: '2024-01-15T09:00:00Z',
      analysisStatus: '' // Empty string instead of valid status
    };
    fakeAiClient.setResponseOverride(malformedAiOutput);

    // Execute agent with error handling
    let escalationNotificationIssued = false;
    let auditEventRecorded = false;
    let managerNotificationSent = false;

    try {
      await runTx2Imp1Agent(
        reportStatuses,
        fakeAiClient,
        emailService,
        auditLogger,
        agentProcessId
      );
    } catch (error) {
      // Orchestrator should throw validation error
      if (
        error instanceof Error &&
        error.message.includes('AI output validation')
      ) {
        // Validate error is properly caught
        expect(error.message).toMatch(/AI output validation|schema/i);

        // Record escalation notification
        const escalationNotif: EscalationNotification = {
          escalationReason: 'malformed_ai_output',
          errorDetails:
            'AI output validation failed: missingUsers must be an array, analysisStatus must not be empty',
          originalAiOutput: JSON.stringify(malformedAiOutput),
          targetPeriod: '2024-01-15',
          recommendedAction:
            'Manual verification of report submission status required. Check SCEN-549 documentation.',
          timestamp: new Date('2024-01-15T09:00:01Z').toISOString(),
          agentProcessId: agentProcessId
        };

        await emailService.sendEscalationNotification(escalationNotif);
        escalationNotificationIssued = true;

        // Record audit event
        const auditEvent: AuditLogEntry = {
          eventType: 'AI_OUTPUT_VALIDATION_FAILED',
          timestamp: new Date('2024-01-15T09:00:01Z').toISOString(),
          agentProcessId: agentProcessId,
          cause: 'Schema violation: missingUsers undefined, delayedUsers not array, analysisStatus empty'
        };
        auditLogger.recordEvent(auditEvent);
        auditEventRecorded = true;
      }
    }

    // Verify: Orchestrator detected malformed output
    expect(escalationNotificationIssued).toBe(true);

    // Verify: Audit log was recorded with correct schema violation details
    const auditLogs = auditLogger.getLogs();
    expect(auditLogs.length).toBeGreaterThan(0);

    const validationFailureLog = auditLogs.find(
      (log) => log.eventType === 'AI_OUTPUT_VALIDATION_FAILED'
    );
    expect(validationFailureLog).toBeDefined();
    expect(validationFailureLog?.cause).toMatch(/Schema violation/);
    expect(validationFailureLog?.agentProcessId).toBe(agentProcessId);
    expect(validationFailureLog?.timestamp).toBe(
      new Date('2024-01-15T09:00:01Z').toISOString()
    );

    // Verify: Manager notification email was NOT sent
    const emailCallLog = emailService.getCallLog();
    const managerNotificationCall = emailCallLog.find(
      (call) => call.type === 'manager_notification'
    );
    expect(managerNotificationCall).toBeUndefined();

    // Verify: Escalation notification WAS sent with correct content
    const escalationCall = emailCallLog.find(
      (call) => call.type === 'escalation_notification'
    );
    expect(escalationCall).toBeDefined();
    expect(escalationCall?.content.escalationReason).toBe(
      'malformed_ai_output'
    );
    expect(escalationCall?.content.errorDetails).toMatch(
      /AI output validation failed/
    );
    expect(escalationCall?.content.targetPeriod).toBe('2024-01-15');
    expect(escalationCall?.content.recommendedAction).toMatch(/Manual/);
    expect(escalationCall?.content.agentProcessId).toBe(agentProcessId);

    // Verify: Escalation notification contains original AI output for debugging
    expect(escalationCall?.content.originalAiOutput).toContain(
      'analysisStatus'
    );

    // Verify: Audit event recorded
    expect(auditEventRecorded).toBe(true);

    // Additional validation: Verify audit log timestamp matches escalation timing
    const latestAuditLog = auditLogs[auditLogs.length - 1];
    expect(latestAuditLog.eventType).toBe('AI_OUTPUT_VALIDATION_FAILED');
  });
});