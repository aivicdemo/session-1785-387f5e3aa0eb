import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx4Imp1Agent } from '../../src/logic/it-1';

interface AuditLogEntry {
  eventType: string;
  actionName?: string;
  senderEmail?: string;
  sentAt?: string;
  mailSubject?: string;
  timestamp: string;
}

interface MailSendLog {
  recipient: string;
  subject: string;
  body: string;
  sentAt: string;
}

interface FakeTx4Imp1AiClient {
  extractReportingRequirements(): Promise<{
    deadline: string;
    reportingItems: string[];
  }>;
  composeConfirmationEmail(params: {
    recipientEmail: string;
    deadline: string;
    reportingItems: string[];
  }): Promise<{
    subject: string;
    body: string;
  }>;
  parseAgentState(): Promise<string>;
}

describe('日報入力フォームの提供と送信機能 - tx4_imp_1', () => {
  let fakeAiClient: FakeTx4Imp1AiClient;
  let mailSendLogs: MailSendLog[];
  let auditLogs: AuditLogEntry[];
  let aiClientCallCount: number;
  const managerEmail = 'manager@company.com';
  const managerName = '開発部長';
  const testEmployees = Array.from({ length: 10 }, (_, i) => ({
    id: `EMP${String(i + 1).padStart(3, '0')}`,
    email: `engineer${i + 1}@company.com`,
    name: `エンジニア${i + 1}`,
  }));
  const reportingDeadline = '2024-01-15T08:30:00Z';
  const reportingItems = ['昨日やったこと', '今日やること', '抱えている課題'];

  beforeEach(() => {
    mailSendLogs = [];
    auditLogs = [];
    aiClientCallCount = 0;

    fakeAiClient = {
      extractReportingRequirements: jest.fn(async () => {
        aiClientCallCount++;
        return {
          deadline: reportingDeadline,
          reportingItems: reportingItems,
        };
      }),
      composeConfirmationEmail: jest.fn(async (params) => {
        aiClientCallCount++;
        return {
          subject: `日報提出のお願い - ${new Date(params.deadline).toLocaleDateString('ja-JP')}`,
          body: `平素よりお疲れ様です。\n\n日報提出期限: ${params.deadline}\n\n以下の3項目をご記入ください。\n${params.reportingItems.join('\n')}\n\nよろしくお願いいたします。`,
        };
      }),
      parseAgentState: jest.fn(async () => {
        aiClientCallCount++;
        return 'メール送信完了';
      }),
    };

    global.fetch = jest.fn(async (url: string, options?: RequestInit) => {
      if (typeof url === 'string' && url.includes('/mail/send')) {
        const body = options?.body ? JSON.parse(options.body as string) : {};
        mailSendLogs.push({
          recipient: body.recipient || '',
          subject: body.subject || '',
          body: body.body || '',
          sentAt: new Date().toISOString(),
        });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-570
  test('日報収集から課題抽出・優先度判定までの自動実行 - 確認メール送信', async () => {
    const agentConfig = {
      managerId: 'MANAGER001',
      managerEmail: managerEmail,
      managerName: managerName,
      employeeList: testEmployees,
      reportingDeadline: reportingDeadline,
      reportingItems: reportingItems,
      aiClient: fakeAiClient,
      auditLogger: {
        log: (entry: AuditLogEntry) => {
          auditLogs.push(entry);
        },
      },
      mailSender: {
        send: async (recipient: string, subject: string, body: string) => {
          const sendTime = new Date().toISOString();
          mailSendLogs.push({
            recipient,
            subject,
            body,
            sentAt: sendTime,
          });
          return { success: true, sentAt: sendTime };
        },
      },
    };

    const executionStartTime = new Date('2024-01-15T07:00:00Z');
    const executionEndTime = new Date('2024-01-15T07:05:00Z');

    const result = await runTx4Imp1Agent(agentConfig);

    expect(result).toBeDefined();
    expect(result.status).toBe('メール送信完了');
    expect(result.actionName).toBe('確認メールを送信して日報提出を促す');

    expect(mailSendLogs.length).toBe(1);

    const sentMail = mailSendLogs[0];
    expect(sentMail.recipient).toBe(managerEmail);

    expect(sentMail.subject).toMatch(/日報提出のお願い|日報確認/);

    expect(sentMail.body).toContain(reportingDeadline);

    expect(sentMail.body).toContain('昨日やったこと');
    expect(sentMail.body).toContain('今日やること');
    expect(sentMail.body).toContain('抱えている課題');

    const mailSentDate = new Date(sentMail.sentAt);
    const isWithinTimeRange =
      mailSentDate.getTime() >= executionStartTime.getTime() - 1000 &&
      mailSentDate.getTime() <= executionEndTime.getTime() + 1000;
    expect(isWithinTimeRange).toBe(true);

    expect(aiClientCallCount).toBeGreaterThanOrEqual(1);
    expect(aiClientCallCount).toBeLessThanOrEqual(3);

    const autonomousActionInitiatedLog = auditLogs.find(
      (log) => log.eventType === 'AUTONOMOUS_ACTION_INITIATED'
    );
    expect(autonomousActionInitiatedLog).toBeDefined();
    expect(autonomousActionInitiatedLog?.actionName).toBe('確認メールを送信して日報提出を促す');

    expect(autonomousActionInitiatedLog?.senderEmail).toBe(managerEmail);
    expect(autonomousActionInitiatedLog?.sentAt).toBeDefined();
    expect(autonomousActionInitiatedLog?.mailSubject).toBe(sentMail.subject);

    expect((fakeAiClient.extractReportingRequirements as jest.Mock).mock.calls.length).toBeGreaterThan(
      0
    );
    expect((fakeAiClient.composeConfirmationEmail as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    expect((fakeAiClient.parseAgentState as jest.Mock).mock.calls.length).toBeGreaterThan(0);

    const composeCallParams = (fakeAiClient.composeConfirmationEmail as jest.Mock).mock
      .calls[0][0];
    expect(composeCallParams.recipientEmail).toBe(managerEmail);
    expect(composeCallParams.deadline).toBe(reportingDeadline);
    expect(composeCallParams.reportingItems).toEqual(reportingItems);

    expect(result.completionTime).toBeDefined();
    const completionDate = new Date(result.completionTime);
    expect(completionDate.getTime()).toBeGreaterThan(executionStartTime.getTime());
    expect(completionDate.getTime()).toBeLessThanOrEqual(executionEndTime.getTime() + 5000);
  });
});