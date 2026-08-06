import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';
import { sendConfirmationEmailsToSubmitterAndManager } from '../../src/logic/it-1-br-1-1-1';

fetchMock.enableMocks();

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-404: [normal] 未提出部員通知機能 - 催促ループ終了時に、報告未提出部員が0件の場合、通知は実施されない
  test('催促ループが終了し報告未提出部員が0件の場合、催促通知メールは送信されない', async () => {
    const submitterId = 'USR-001';
    const submitterEmail = 'engineer@example.com';
    const managerId = 'USR-M01';
    const managerEmail = 'manager@example.com';
    const reportContent = {
      yesterdayAccomplishment: '前日はAPI仕様書の作成を完了',
      todayPlan: '本日はDB設計に着手',
      currentChallenges: '統合テストの遅延リスク'
    };
    const submittedAt = new Date('2024-01-15T08:30:00Z');

    // 全部員が既に報告提出済みの状態を表現
    // (未提出部員が0件 = 催促ループは終了している)
    const unsubmittedEmployeeCount = 0;

    // メール送信処理の外部サービスをモック
    // 確認メール送信は正常に完了するが、催促通知は呼ばれない
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        emailsSent: 2,
        recipients: [submitterEmail, managerEmail],
        sentAt: submittedAt.toISOString()
      }),
      { status: 200 }
    );

    const result = await sendConfirmationEmailsToSubmitterAndManager({
      submitterId,
      submitterEmail,
      managerId,
      managerEmail,
      reportContent,
      submittedAt,
      unsubmittedEmployeeCount
    });

    // 確認メールが正常に送信された
    expect(result.success).toBe(true);
    expect(result.emailsSent).toBe(2);
    expect(result.recipients).toEqual([submitterEmail, managerEmail]);

    // メール送信APIが呼ばれたことを確認
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // 呼び出された API のエンドポイントを確認
    const callArg = fetchMock.mock.calls[0];
    expect(callArg[0]).toContain('/api/emails/send');

    // 催促通知フラグが含まれていないか、falseであることを確認
    const requestBody = JSON.parse(callArg[1]?.body as string);
    expect(requestBody.sendReminderNotification).toBe(false);

    // 催促対象部員が含まれていないことを確認
    expect(requestBody.remindedEmployees).toEqual([]);

    // unsubmittedEmployeeCount が 0 であることが処理フローの条件
    expect(unsubmittedEmployeeCount).toBe(0);
  });
});