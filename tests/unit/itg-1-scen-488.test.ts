import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { validateAndAggregateReport } from '../../src/logic/it-2';

describe('送信時の自動確認メール通知', () => {
  // SCEN-488
  it('確認メール受信記録が欠落している場合にエラーになる', () => {
    const reportId = 'RPT-2024-001';
    const userId = 'USR-ENG-001';
    const departmentId = 'DEPT-DEV-001';
    const sentTimestamp = new Date('2024-01-15T08:30:00Z');
    const confirmationMailId = 'MAIL-CONF-001';

    const reportData = {
      reportId: reportId,
      userId: userId,
      departmentId: departmentId,
      yesterday: 'データベース最適化を完了',
      today: 'APIレスポンス改善着手',
      challenges: 'ネットワーク遅延の調査',
      sentTimestamp: sentTimestamp,
      confirmationMailId: confirmationMailId,
      confirmationMailReceivedAt: null,
    };

    const result = validateAndAggregateReport(reportData);

    expect(result).toEqual({
      success: false,
      errorCode: 'CONFIRMATION_MAIL_RECORD_NOT_FOUND',
      errorMessage: '確認メール受信記録が存在しません',
      reportId: reportId,
      userId: userId,
      sentTimestamp: sentTimestamp,
      missingConfirmationMailId: confirmationMailId,
      auditLog: {
        timestamp: expect.any(Date),
        reportId: reportId,
        userId: userId,
        sentTimestamp: sentTimestamp,
        missingConfirmationMailId: confirmationMailId,
        errorCode: 'CONFIRMATION_MAIL_RECORD_NOT_FOUND',
      },
    });

    expect(result.errorCode).toBe('CONFIRMATION_MAIL_RECORD_NOT_FOUND');
    expect(result.success).toBe(false);
  });
});