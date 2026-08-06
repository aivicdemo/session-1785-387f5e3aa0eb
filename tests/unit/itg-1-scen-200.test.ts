import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendConfirmationEmailsForReportSubmission } from '../../src/logic/it-1-br-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('朝会報告送信時の確認メール自動配信機能', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-200
  test('朝会開始予定時刻が未設定のとき、送信状況確認処理がエラーになる', () => {
    const reportSubmissionData = {
      reporterId: 'ENG-001',
      reporterName: 'Taro Yamada',
      reporterEmail: 'taro.yamada@company.com',
      departmentId: 'DEV-001',
      departmentName: 'Development',
      managerEmail: 'manager@company.com',
      yesterdayAccomplishment: 'Completed API integration tests',
      todayPlan: 'Review pull requests and fix bugs',
      currentIssues: 'Database performance degradation in staging environment',
      submittedAt: new Date('2024-01-15T08:45:00Z'),
    };

    const configurationData = {
      morningMeetingStartTime: null,
      systemInitialized: true,
    };

    expect(() =>
      sendConfirmationEmailsForReportSubmission(reportSubmissionData, configurationData)
    ).toThrow(/朝会開始予定時刻/);
  });
});