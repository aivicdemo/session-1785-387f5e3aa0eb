import { describe, test, expect, beforeEach, jest } from '@jest/globals';

interface ConfirmationMailParams {
  senderUserId: string;
  senderEmail: string;
  senderName: string;
  reportContent: {
    yesterdayAccomplishment: string;
    todayPlan: string;
    currentChallenges: string;
  };
  departmentHeadEmail: string;
  reportSentTimestamp: Date;
}

interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: Error;
}

interface MailService {
  sendMail(to: string, subject: string, body: string): Promise<SendMailResult>;
}

let mockMailService: MailService;
let loggedErrors: Array<{ message: string; timestamp: Date }>;

beforeEach(() => {
  loggedErrors = [];
  mockMailService = {
    sendMail: jest.fn(async (to: string, subject: string, body: string) => {
      return { success: true, messageId: `msg-${Date.now()}` };
    }) as jest.Mock,
  };
});

async function sendConfirmationMails(
  params: ConfirmationMailParams,
  mailService: MailService
): Promise<void> {
  if (!params.senderEmail || params.senderEmail.trim() === '') {
    const errorMessage = '送信者メールアドレスが空文字のため配信処理を中断した';
    loggedErrors.push({
      message: errorMessage,
      timestamp: new Date(),
    });
    throw new Error('Sender email address is empty');
  }

  const reportBody = `
昨日の実績: ${params.reportContent.yesterdayAccomplishment}
本日の予定: ${params.reportContent.todayPlan}
抱えている課題: ${params.reportContent.currentChallenges}
送信日時: ${params.reportSentTimestamp.toISOString()}
  `.trim();

  await mailService.sendMail(
    params.senderEmail,
    '日報送信確認メール',
    reportBody
  );

  await mailService.sendMail(
    params.departmentHeadEmail,
    '日報送信確認メール（部長向け）',
    reportBody
  );
}

describe('確認メール配信機能 - 送信者メールアドレス検証', () => {
  // SCEN-287
  test('送信者のメールアドレスが空文字のとき、メール配信処理が中断される', async () => {
    const params: ConfirmationMailParams = {
      senderUserId: 'user-001',
      senderEmail: '',
      senderName: '山田太郎',
      reportContent: {
        yesterdayAccomplishment: '機能Aの実装完了',
        todayPlan: '機能Bの実装開始',
        currentChallenges: 'DBの最適化が必要',
      },
      departmentHeadEmail: 'head@example.com',
      reportSentTimestamp: new Date('2024-06-15T09:00:00Z'),
    };

    await expect(
      sendConfirmationMails(params, mockMailService)
    ).rejects.toThrow(/Sender email address is empty/);

    expect(mockMailService.sendMail).not.toHaveBeenCalled();

    expect(loggedErrors).toHaveLength(1);
    expect(loggedErrors[0].message).toBe(
      '送信者メールアドレスが空文字のため配信処理を中断した'
    );
  });
});