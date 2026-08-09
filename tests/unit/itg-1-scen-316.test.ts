import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';

import type { ReportSubmissionHistoryRecord, EmailSendLogRecord } from '../../src/logic/it-1-br-1-1-1';

// Mock database and mail service
jest.mock('../../src/infrastructure/database', () => ({
  queryReportsByTimestamp: jest.fn(),
  insertEmailSendLog: jest.fn(),
  updateReportSubmissionHistory: jest.fn(),
}));

jest.mock('../../src/infrastructure/mail-service', () => ({
  sendEmail: jest.fn(),
}));

// Fake AI Client implementation
class FakeTx2Imp1AiClient implements Tx2Imp1AiClient {
  capturedAggregationPayloads: Array<{
    timestamp: string;
    submittedReportCount: number;
    reports: Array<{ userId: string; submittedAt: string }>;
  }> = [];

  async analyzeReportStatus(params: {
    allReportIds: string[];
    submittedReportIds: string[];
    unsubmittedUserIds: string[];
    currentTimestamp: string;
  }): Promise<{
    unsubmittedCount: number;
    delayedCount: number;
    onTimeCount: number;
  }> {
    return {
      unsubmittedCount: params.unsubmittedUserIds.length,
      delayedCount: 0,
      onTimeCount: params.submittedReportIds.length,
    };
  }

  async generateAggregationEmail(params: {
    reports: Array<{ userId: string; content: string; submittedAt: string }>;
    timestamp: string;
    departmentId: string;
  }): Promise<{
    subject: string;
    body: string;
    payload: {
      timestamp: string;
      submittedReportCount: number;
      reports: Array<{ userId: string; submittedAt: string }>;
    };
  }> {
    const payload = {
      timestamp: params.timestamp,
      submittedReportCount: params.reports.length,
      reports: params.reports.map((r) => ({
        userId: r.userId,
        submittedAt: r.submittedAt,
      })),
    };
    this.capturedAggregationPayloads.push(payload);

    return {
      subject: `朝会報告集約 - ${params.timestamp}`,
      body: `提出済み報告: ${params.reports.length}件`,
      payload,
    };
  }
}

describe('it-1-br-1-1-1: 確認メール配信・日報一覧集約機能 - 月末タイムスタンプ精度検証', () => {
  let fakeAiClient: FakeTx2Imp1AiClient;
  let mockDb: any;
  let mockMailService: any;
  const systemTimestampStr = '2024-01-31T23:59:59.999Z';
  const systemTimestamp = new Date(systemTimestampStr);

  beforeEach(() => {
    fakeAiClient = new FakeTx2Imp1AiClient();
    mockDb = require('../../src/infrastructure/database');
    mockMailService = require('../../src/infrastructure/mail-service');

    // Mock current time
    jest.useFakeTimers();
    jest.setSystemTime(systemTimestamp);

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // SCEN-316
  test('月末23時59分59秒に送信された日報の送信日時がミリ秒精度で記録される', async () => {
    // Prepare test data: single report submitted at end-of-month timestamp
    const reportId = 'report_001';
    const userId = 'engineer_001';
    const departmentId = 'dev_dept_001';
    const managerUserId = 'manager_001';

    const submittedReport: ReportSubmissionHistoryRecord = {
      id: reportId,
      userId,
      departmentId,
      yesterdayAccomplishment: 'Fixed bug #1234',
      todayPlan: 'Code review for PR #5678',
      currentChallenge: 'Performance optimization in progress',
      submittedAt: new Date(systemTimestampStr),
      createdAt: new Date(systemTimestampStr),
      updatedAt: new Date(systemTimestampStr),
    };

    // Mock database query to return the report
    mockDb.queryReportsByTimestamp.mockResolvedValueOnce([
      submittedReport,
    ]);

    // Mock email send log insertion
    const capturedEmailLogs: EmailSendLogRecord[] = [];
    mockMailService.sendEmail.mockImplementation(
      async (emailParams: any) => {
        const logRecord: EmailSendLogRecord = {
          id: `email_log_${Date.now()}`,
          recipientEmail: emailParams.to,
          subject: emailParams.subject,
          body: emailParams.body,
          sentAt: new Date(systemTimestampStr),
          status: 'sent',
          payload: emailParams.payload || {},
          createdAt: new Date(systemTimestampStr),
        };
        capturedEmailLogs.push(logRecord);
        mockDb.insertEmailSendLog.mockResolvedValueOnce(logRecord);
        return logRecord;
      }
    );

    // Execute aggregation and mail dispatch
    const aggregationResult = await runTx2Imp1Agent(
      {
        departmentId,
        allUserIds: [userId, 'engineer_002', 'engineer_003'],
        submittedUserIds: [userId],
        managerUserId,
        aggregationTimestamp: systemTimestampStr,
        morningMeetingScheduledTime: '2024-01-31T09:00:00Z',
      },
      fakeAiClient
    );

    // Assertion 1: Aggregation result contains correct timestamp
    expect(aggregationResult).toBeDefined();
    expect(aggregationResult.aggregatedAt).toBe(systemTimestampStr);

    // Assertion 2: AI Client captured payload contains exact timestamp
    expect(fakeAiClient.capturedAggregationPayloads.length).toBeGreaterThan(0);
    const capturedPayload = fakeAiClient.capturedAggregationPayloads[0];
    expect(capturedPayload.timestamp).toBe('2024-01-31T23:59:59.999Z');

    // Assertion 3: Report in payload has exact submitted timestamp
    expect(capturedPayload.reports).toHaveLength(1);
    expect(capturedPayload.reports[0].submittedAt).toBe('2024-01-31T23:59:59.999Z');
    expect(capturedPayload.submittedReportCount).toBe(1);

    // Assertion 4: Database query was called with correct timestamp
    expect(mockDb.queryReportsByTimestamp).toHaveBeenCalledWith({
      timestamp: systemTimestampStr,
      departmentId,
    });

    // Assertion 5: Email log records preserve millisecond precision
    expect(capturedEmailLogs.length).toBeGreaterThan(0);
    const emailLog = capturedEmailLogs[0];
    expect(emailLog.sentAt.toISOString()).toBe('2024-01-31T23:59:59.999Z');
    expect(emailLog.payload.timestamp).toBe('2024-01-31T23:59:59.999Z');

    // Assertion 6: Manager notification email received correct timestamp
    const managerEmailLog = capturedEmailLogs.find(
      (log) =>
        log.recipientEmail === `manager_${managerUserId}@company.com` ||
        log.recipientEmail?.includes('manager')
    );
    expect(managerEmailLog).toBeDefined();
    if (managerEmailLog) {
      expect(managerEmailLog.payload).toMatchObject({
        timestamp: '2024-01-31T23:59:59.999Z',
        submittedReportCount: 1,
      });
    }

    // Assertion 7: Subject and body do not lose precision through transformation
    expect(aggregationResult.emailsDispatched).toBe(true);
    expect(aggregationResult.dispatchedEmailCount).toBeGreaterThanOrEqual(2); // engineer + manager

    // Assertion 8: Verify no timezone conversion occurred (UTC+0 is preserved)
    const payloadTimestamp = new Date(capturedPayload.timestamp);
    expect(payloadTimestamp.getUTCFullYear()).toBe(2024);
    expect(payloadTimestamp.getUTCMonth()).toBe(0); // January = 0
    expect(payloadTimestamp.getUTCDate()).toBe(31);
    expect(payloadTimestamp.getUTCHours()).toBe(23);
    expect(payloadTimestamp.getUTCMinutes()).toBe(59);
    expect(payloadTimestamp.getUTCSeconds()).toBe(59);
    expect(payloadTimestamp.getUTCMilliseconds()).toBe(999);
  });
});