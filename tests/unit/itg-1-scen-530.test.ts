import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('AI Agent tx_1_imp_1: 日報入力から送信・確認メール配信までの自動化', () => {
  let reportSystemApiMock: Map<string, any>;
  let emailSystemApiMock: Map<string, any>;
  let fetchMock: any;

  beforeEach(() => {
    reportSystemApiMock = new Map();
    emailSystemApiMock = new Map();
    
    fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-530
  test('should register report to management system and send confirmation email when engineer submits valid daily report', async () => {
    const engineerName = 'エンジニアA';
    const engineerEmail = 'engineer-a@company.com';
    const yesterdayAccomplishment = 'タスクX完了';
    const todayPlan = 'タスクY開始';
    const currentIssue = 'なし';
    const submissionTimestamp = new Date('2024-01-15T09:00:00Z');
    const registeredReportId = 'report-001';
    const adminEmail = 'admin@company.com';

    const engineerInput = {
      engineerName,
      engineerEmail,
      yesterdayAccomplishment,
      todayPlan,
      currentIssue,
    };

    const reportApiResponse = {
      id: registeredReportId,
      engineerName,
      yesterdayAccomplishment,
      todayPlan,
      currentIssue,
      registeredAt: submissionTimestamp.toISOString(),
    };

    const emailApiResponse = {
      messageId: 'msg-001',
      status: 'sent',
      recipient: adminEmail,
    };

    fetchMock.mockResponse((request: Request) => {
      const url = request.url;

      if (url.includes('POST') || request.method === 'POST') {
        if (url.includes('/reports')) {
          return Promise.resolve(
            new Response(JSON.stringify(reportApiResponse), {
              status: 201,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        }
        if (url.includes('/send')) {
          return Promise.resolve(
            new Response(JSON.stringify(emailApiResponse), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        }
      }

      return Promise.resolve(
        new Response(JSON.stringify({ error: 'Not Found' }), {
          status: 404,
        })
      );
    });

    const agentConfig = {
      reportSystemApiBaseUrl: 'https://api.reports.internal/v1',
      emailSystemApiBaseUrl: 'https://api.email.internal/v1',
      adminEmail,
      engineerInput,
    };

    const result = await runTx1Imp1Agent(agentConfig);

    expect(result).toEqual({
      status: 'success',
      reportId: registeredReportId,
      registeredAt: submissionTimestamp.toISOString(),
      emailSent: true,
      emailMessageId: 'msg-001',
      engineerNotified: true,
      adminNotified: true,
    });

    expect(fetchMock.mock.calls.length).toBe(2);

    const reportCall = fetchMock.mock.calls[0];
    expect(reportCall[1].method).toBe('POST');
    expect(reportCall[0]).toContain('/reports');
    const reportBodyStr = reportCall[1].body;
    const reportBody = typeof reportBodyStr === 'string' ? JSON.parse(reportBodyStr) : reportBodyStr;
    expect(reportBody.engineerName).toBe(engineerName);
    expect(reportBody.yesterdayAccomplishment).toBe(yesterdayAccomplishment);
    expect(reportBody.todayPlan).toBe(todayPlan);
    expect(reportBody.currentIssue).toBe(currentIssue);

    const emailCall = fetchMock.mock.calls[1];
    expect(emailCall[1].method).toBe('POST');
    expect(emailCall[0]).toContain('/send');
    const emailBodyStr = emailCall[1].body;
    const emailBody = typeof emailBodyStr === 'string' ? JSON.parse(emailBodyStr) : emailBodyStr;
    expect(emailBody.recipient).toBe(adminEmail);
    expect(emailBody.subject).toContain('日報登録完了');
    expect(emailBody.body).toContain(engineerName);
    expect(emailBody.body).toContain(submissionTimestamp.toISOString().substring(0, 10));
  });
});