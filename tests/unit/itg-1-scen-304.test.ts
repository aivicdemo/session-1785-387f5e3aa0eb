import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';

// Mock implementations
class FakeAiClient implements Tx2Imp1AiClient {
  async analyzeReportStatus(params: any): Promise<any> {
    return {
      unreportedUsers: [],
      delayedUsers: [],
      completedUsers: []
    };
  }

  async generateNotificationContent(params: any): Promise<any> {
    return {
      subject: 'Daily Report Status Notification',
      body: 'Report status summary'
    };
  }
}

class FakeEmailService {
  private sentRequests: Array<{ to: string; subject: string; body: string }> = [];

  async send(to: string, subject: string, body: string): Promise<void> {
    this.sentRequests.push({ to, subject, body });
  }

  getSentRequests(): Array<{ to: string; subject: string; body: string }> {
    return this.sentRequests;
  }

  reset(): void {
    this.sentRequests = [];
  }
}

class FakeLogger {
  private logs: Array<{ level: string; message: string; timestamp: string }> = [];

  log(level: string, message: string): void {
    this.logs.push({
      level,
      message,
      timestamp: new Date().toISOString()
    });
  }

  getLogs(): Array<{ level: string; message: string; timestamp: string }> {
    return this.logs;
  }

  reset(): void {
    this.logs = [];
  }

  hasErrorLog(keyword: string): boolean {
    return this.logs.some(
      log => log.level === 'error' && log.message.includes(keyword)
    );
  }
}

describe('tx2-imp-1-orchestrator: Mail distribution for null report ID', () => {
  let fakeAiClient: FakeAiClient;
  let fakeEmailService: FakeEmailService;
  let fakeLogger: FakeLogger;

  beforeEach(() => {
    fakeAiClient = new FakeAiClient();
    fakeEmailService = new FakeEmailService();
    fakeLogger = new FakeLogger();
  });

  afterEach(() => {
    fakeEmailService.reset();
    fakeLogger.reset();
  });

  // SCEN-304
  test('should abort mail distribution when report ID is null', async () => {
    // Setup: Initialize with null report ID
    const inputParams = {
      reportId: null as any,
      reporterUserId: 'USR-001',
      departmentId: 'DEPT-001',
      reportContent: {
        yesterdayAccomplishment: 'Task A completed',
        todayPlan: 'Task B planned',
        issueChallenges: 'Issue 1 identified'
      },
      submittedAt: new Date('2024-01-15T08:30:00Z'),
      meetingStartTime: new Date('2024-01-15T09:00:00Z'),
      departmentManagerEmail: 'manager@example.com',
      reporterEmail: 'reporter@example.com'
    };

    // Execute: Call orchestrator function with null report ID
    const result = await runTx2Imp1Agent(
      inputParams,
      fakeAiClient,
      fakeEmailService,
      fakeLogger
    );

    // Verify: Orchestrator performs validity check on report ID
    expect(result).toBeDefined();
    expect(result.status).toBe('error');

    // Verify: Report ID null is detected and mail distribution is aborted
    expect(result.errorCode).toBe('INVALID_REPORT_ID');

    // Verify: Email service receives zero send requests
    const sentRequests = fakeEmailService.getSentRequests();
    expect(sentRequests).toHaveLength(0);

    // Verify: Error log contains 'null report ID suspension' message
    const errorLogs = fakeLogger.getLogs();
    const hasExpectedError = errorLogs.some(
      log =>
        log.level === 'error' &&
        (log.message.includes('朝会報告ID') ||
          log.message.includes('null') ||
          log.message.includes('処理中断'))
    );
    expect(hasExpectedError).toBe(true);

    // Verify: System state remains undelivered after test
    expect(result.mailDeliveryAttempted).toBe(false);
    expect(result.managerNotificationSent).toBe(false);
  });
});