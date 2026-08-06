import { sendDailyReportConfirmationEmails } from '../../src/logic/it-1-br-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('朝会報告送信時に送信者本人と部長宛に確認メールを自動配信', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-264
  test('送信者メールアドレスが undefined のときバリデーションエラーが発生してメール送信が実行されない', () => {
    const senderEmail = undefined;
    const managerEmail = 'manager@example.com';
    const reportData = {
      yesterdayAccomplishment: '昨日はタスクAを完了した',
      todayPlan: '本日はタスクBを開始する',
      currentIssue: '抱えている課題はなし',
    };

    expect(() => {
      sendDailyReportConfirmationEmails({
        senderEmail,
        managerEmail,
        reportData,
      });
    }).toThrow(/送信者メールアドレス/);

    expect(fetchMock.mock.calls.length).toBe(0);
  });
});