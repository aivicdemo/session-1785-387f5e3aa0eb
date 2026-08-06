import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';
import { sendConfirmationEmailsToSenderAndManager } from '../../src/logic/it-1-br-1-1-1';

fetchMock.enableMocks();

describe('朝会報告送信時に送信者本人と部長宛に確認メールを自動配信する機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-271
  it('メール送信が外部サービス障害により失敗したとき処理が失敗する', async () => {
    const senderId = 'ENG-001';
    const senderEmail = 'engineer@company.com';
    const senderName = '山田太郎';
    const managerId = 'MGR-001';
    const managerEmail = 'manager@company.com';
    const managerName = '部長次郎';
    const reportId = 'REP-20240115-001';
    const yesterday = '昨日は機能Aの実装を完了した';
    const today = '本日は機能Bのテストを実施する予定';
    const issues = 'データベース接続タイムアウトのリスクあり';
    const sentAt = new Date('2024-01-15T07:30:00Z');

    const emailServiceErrorResponse = { error: 'Service temporarily unavailable', code: 'SERVICE_ERROR' };

    fetchMock.mockResponseOnce(JSON.stringify(emailServiceErrorResponse), {
      status: 503,
    });

    const reportData = {
      reportId,
      senderId,
      senderEmail,
      senderName,
      managerId,
      managerEmail,
      managerName,
      yesterday,
      today,
      issues,
      sentAt,
    };

    const result = await sendConfirmationEmailsToSenderAndManager(reportData);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toMatch(/メール送信/);
    expect(result.status).toBe('送信失敗');
    expect(result.reportId).toBe(reportId);
    expect(result.dbRecordStatus).toBe('送信失敗');
    expect(result.managerNotified).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});