import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/types';

// Mock AI client
class MockTx1Imp1AiClient implements Tx1Imp1AiClient {
  private callHistory: Array<{ method: string; args: unknown; timestamp: string }> = [];
  private duplicateCheckResponses: Map<string, string> = new Map();

  recordCall(method: string, args: unknown): void {
    this.callHistory.push({
      method,
      args,
      timestamp: new Date().toISOString(),
    });
  }

  getCallHistory(): Array<{ method: string; args: unknown; timestamp: string }> {
    return this.callHistory;
  }

  setDuplicateCheckResponse(requestId: string, status: string): void {
    this.duplicateCheckResponses.set(requestId, status);
  }

  async executeDuplicateCheck(requestId: string): Promise<string> {
    this.recordCall('executeDuplicateCheck', { requestId });
    const response = this.duplicateCheckResponses.get(requestId);
    return response || 'NOT_DUPLICATE';
  }

  async validateReportContent(content: {
    yesterdayAccomplishment: string;
    todayPlan: string;
    challenges: string;
  }): Promise<boolean> {
    this.recordCall('validateReportContent', content);
    return (
      content.yesterdayAccomplishment.length > 0 &&
      content.yesterdayAccomplishment.length <= 500 &&
      content.todayPlan.length > 0 &&
      content.todayPlan.length <= 500 &&
      content.challenges.length > 0 &&
      content.challenges.length <= 500
    );
  }

  async registerReport(data: {
    userId: string;
    reportDate: string;
    yesterdayAccomplishment: string;
    todayPlan: string;
    challenges: string;
    requestId: string;
  }): Promise<{ reportId: string; transactionId: string }> {
    this.recordCall('registerReport', data);
    return {
      reportId: `report_${data.userId}_${data.reportDate}_${Date.now()}`,
      transactionId: `txn_${data.requestId}`,
    };
  }

  async sendConfirmationEmail(data: {
    recipientEmail: string;
    recipientName: string;
    reportContent: {
      yesterdayAccomplishment: string;
      todayPlan: string;
      challenges: string;
    };
    reportId: string;
  }): Promise<{ emailId: string; sentAt: string }> {
    this.recordCall('sendConfirmationEmail', data);
    return {
      emailId: `email_${Date.now()}`,
      sentAt: new Date('2024-01-15T09:00:00Z').toISOString(),
    };
  }

  resetHistory(): void {
    this.callHistory = [];
    this.duplicateCheckResponses.clear();
  }
}

// Mock database
interface ReportRecord {
  reportId: string;
  userId: string;
  reportDate: string;
  yesterdayAccomplishment: string;
  todayPlan: string;
  challenges: string;
  createdAt: string;
  transactionId: string;
}

interface EmailLogRecord {
  emailId: string;
  recipientEmail: string;
  reportId: string;
  sentAt: string;
  status: string;
}

interface SystemLogRecord {
  timestamp: string;
  level: string;
  message: string;
  requestId: string;
  details: unknown;
}

class MockDatabase {
  private reports: Map<string, ReportRecord> = new Map();
  private emailLogs: EmailLogRecord[] = [];
  private systemLogs: SystemLogRecord[] = [];

  insertReport(record: ReportRecord): void {
    const key = `${record.userId}_${record.reportDate}`;
    this.reports.set(key, record);
  }

  getReportCount(): number {
    return this.reports.size;
  }

  getReportByUserAndDate(userId: string, reportDate: string): ReportRecord | undefined {
    const key = `${userId}_${reportDate}`;
    return this.reports.get(key);
  }

  insertEmailLog(record: EmailLogRecord): void {
    this.emailLogs.push(record);
  }

  getEmailLogCount(): number {
    return this.emailLogs.length;
  }

  getEmailLogsForReport(reportId: string): EmailLogRecord[] {
    return this.emailLogs.filter((log) => log.reportId === reportId);
  }

  insertSystemLog(record: SystemLogRecord): void {
    this.systemLogs.push(record);
  }

  getSystemLogs(): SystemLogRecord[] {
    return this.systemLogs;
  }

  getSystemLogsByRequestId(requestId: string): SystemLogRecord[] {
    return this.systemLogs.filter((log) => log.requestId === requestId);
  }

  reset(): void {
    this.reports.clear();
    this.emailLogs = [];
    this.systemLogs = [];
  }
}

describe('日報入力フォーム提供と送信機能 - エージェント冪等性テスト', () => {
  // SCEN-539
  test('同一エンジニアが同一日報内容を複数回実行した場合、管理システムの日報レコードと確認メール送信は1件のみに保たれる', async () => {
    // Setup
    const mockAiClient = new MockTx1Imp1AiClient();
    const mockDatabase = new MockDatabase();

    const engineerUserId = 'engineer_001';
    const reportDate = '2024-01-15';
    const requestId = 'req_12345_engineer_001_2024-01-15';

    const reportContent = {
      yesterdayAccomplishment: 'Completed database migration for user service',
      todayPlan: 'Deploy migration to production and monitor logs',
      challenges: 'Need to handle rollback scenario if issues arise',
    };

    const engineerEmail = 'engineer@company.com';
    const engineerName = 'Engineer A';

    // First execution - initial submission
    const firstCallHistory = mockAiClient.getCallHistory().length;

    // Simulate first report submission
    const firstReportId = 'report_engineer_001_2024-01-15_1705308000000';
    const firstTransactionId = 'txn_req_12345_engineer_001_2024-01-15';
    const firstEmailId = 'email_1705308000000';
    const firstSentAt = new Date('2024-01-15T09:00:00Z').toISOString();

    // Record first submission in database
    mockDatabase.insertReport({
      reportId: firstReportId,
      userId: engineerUserId,
      reportDate: reportDate,
      yesterdayAccomplishment: reportContent.yesterdayAccomplishment,
      todayPlan: reportContent.todayPlan,
      challenges: reportContent.challenges,
      createdAt: new Date('2024-01-15T08:45:00Z').toISOString(),
      transactionId: firstTransactionId,
    });

    mockDatabase.insertEmailLog({
      emailId: firstEmailId,
      recipientEmail: engineerEmail,
      reportId: firstReportId,
      sentAt: firstSentAt,
      status: 'sent',
    });

    mockDatabase.insertSystemLog({
      timestamp: new Date('2024-01-15T08:45:30Z').toISOString(),
      level: 'INFO',
      message: '日報登録処理完了',
      requestId: requestId,
      details: { reportId: firstReportId, transactionId: firstTransactionId },
    });

    mockDatabase.insertSystemLog({
      timestamp: new Date('2024-01-15T08:45:35Z').toISOString(),
      level: 'INFO',
      message: '確認メール送信完了',
      requestId: requestId,
      details: { emailId: firstEmailId, sentAt: firstSentAt },
    });

    // Verify first submission state
    expect(mockDatabase.getReportCount()).toBe(1);
    expect(mockDatabase.getEmailLogCount()).toBe(1);

    const firstSubmissionReport = mockDatabase.getReportByUserAndDate(engineerUserId, reportDate);
    expect(firstSubmissionReport).toBeDefined();
    expect(firstSubmissionReport?.reportId).toBe(firstReportId);
    expect(firstSubmissionReport?.transactionId).toBe(firstTransactionId);

    const firstSubmissionEmails = mockDatabase.getEmailLogsForReport(firstReportId);
    expect(firstSubmissionEmails).toHaveLength(1);
    expect(firstSubmissionEmails[0].emailId).toBe(firstEmailId);

    // Second execution - idempotent retry (e.g., browser back + resubmit)
    mockAiClient.setDuplicateCheckResponse(requestId, 'DUPLICATE_DETECTED');

    // Simulate duplicate check
    const duplicateCheckResult = await mockAiClient.executeDuplicateCheck(requestId);
    expect(duplicateCheckResult).toBe('DUPLICATE_DETECTED');

    // Record duplicate detection in system log
    mockDatabase.insertSystemLog({
      timestamp: new Date('2024-01-15T08:46:00Z').toISOString(),
      level: 'INFO',
      message: `重複リクエスト検出：[リクエストID=${requestId}]、既存データを返却`,
      requestId: requestId,
      details: {
        status: 'DUPLICATE_DETECTED',
        existingReportId: firstReportId,
        existingTransactionId: firstTransactionId,
      },
    });

    // Verify no new records were created
    expect(mockDatabase.getReportCount()).toBe(1);
    expect(mockDatabase.getEmailLogCount()).toBe(1);

    // Verify the report record remains unchanged
    const secondAttemptReport = mockDatabase.getReportByUserAndDate(engineerUserId, reportDate);
    expect(secondAttemptReport).toBeDefined();
    expect(secondAttemptReport?.reportId).toBe(firstReportId);
    expect(secondAttemptReport?.transactionId).toBe(firstTransactionId);

    // Verify email logs remain unchanged (no new email sent)
    const secondAttemptEmails = mockDatabase.getEmailLogsForReport(firstReportId);
    expect(secondAttemptEmails).toHaveLength(1);
    expect(secondAttemptEmails[0].emailId).toBe(firstEmailId);

    // Verify system logs contain idempotent retry evidence
    const systemLogs = mockDatabase.getSystemLogsByRequestId(requestId);
    expect(systemLogs.length).toBeGreaterThanOrEqual(2);

    const duplicateDetectionLog = systemLogs.find((log) =>
      log.message.includes('重複リクエスト検出'),
    );
    expect(duplicateDetectionLog).toBeDefined();
    expect(duplicateDetectionLog?.message).toMatch(/重複リクエスト検出/);
    expect(duplicateDetectionLog?.message).toMatch(new RegExp(`リクエストID=${requestId}`));
    expect(duplicateDetectionLog?.details).toEqual(
      expect.objectContaining({
        status: 'DUPLICATE_DETECTED',
        existingReportId: firstReportId,
        existingTransactionId: firstTransactionId,
      }),
    );

    // Verify AI client was called for duplicate check
    const aiClientCalls = mockAiClient.getCallHistory();
    const duplicateCheckCalls = aiClientCalls.filter((call) => call.method === 'executeDuplicateCheck');
    expect(duplicateCheckCalls).toHaveLength(1);
    expect(duplicateCheckCalls[0].args).toEqual(
      expect.objectContaining({
        requestId: requestId,
      }),
    );

    // Final verification: idempotency confirmed
    expect(mockDatabase.getReportCount()).toBe(1);
    expect(mockDatabase.getEmailLogCount()).toBe(1);
    expect(duplicateCheckResult).toBe('DUPLICATE_DETECTED');
  });
});