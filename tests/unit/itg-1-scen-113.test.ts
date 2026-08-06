import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendConfirmationEmailWithYesterdayReport } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-113: [normal] 確認メール自動配信機能 - 配信メールに昨日の実績が記載される
  test('should include yesterday report in confirmation email body', async () => {
    const yesterdayDate = new Date('2024-01-14');
    const reporterId = 'tanaka-taro-001';
    const reporterName = '田中太郎';
    const yesterdayAccomplishment = '顧客Aの要件ヒアリング完了';
    const todayPlan = '設計書作成';
    const currentIssue = 'データベース性能調査';
    const reporterEmail = 'tanaka.taro@example.com';
    const managerEmail = 'manager@example.com';

    const capturedEmails: Array<{ to: string; subject: string; body: string }> = [];

    const mockEmailService = {
      send: jest.fn((to: string, subject: string, body: string) => {
        capturedEmails.push({ to, subject, body });
        return Promise.resolve({ messageId: `msg-${Date.now()}` });
      }),
    };

    const reportData = {
      reporterId,
      reporterName,
      reporterEmail,
      managerEmail,
      reportDate: yesterdayDate,
      yesterdayAccomplishment,
      todayPlan,
      currentIssue,
    };

    await sendConfirmationEmailWithYesterdayReport(reportData, mockEmailService);

    expect(mockEmailService.send).toHaveBeenCalledTimes(2);

    const reporterEmailCall = capturedEmails.find((email) => email.to === reporterEmail);
    const managerEmailCall = capturedEmails.find((email) => email.to === managerEmail);

    expect(reporterEmailCall).toBeDefined();
    expect(managerEmailCall).toBeDefined();

    if (reporterEmailCall) {
      expect(reporterEmailCall.body).toContain('昨日やったこと：顧客Aの要件ヒアリング完了');
      expect(reporterEmailCall.body).toContain(reporterName);
    }

    if (managerEmailCall) {
      expect(managerEmailCall.body).toContain('昨日やったこと：顧客Aの要件ヒアリング完了');
      expect(managerEmailCall.body).toContain(reporterName);
    }
  });
});