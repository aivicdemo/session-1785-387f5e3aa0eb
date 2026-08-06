import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-262
  test('[error] 朝会報告送信時刻遅延判定機能 - 部長メールアドレスが空文字列のとき処理が失敗する', async () => {
    const { sendReportWithDelayJudgment } = await import(
      '../../src/logic/it-1-br-1-1-1'
    );

    const reportData = {
      user_id: 'ENG001',
      report_date: '2024-01-15',
      report_time: '08:45:00',
      yesterday_achievement: '前日にデータベース最適化を完了',
      today_plan: '今日はAPIテストを実施予定',
      current_issues: 'パフォーマンス問題が未解決',
      department_id: 'DEV',
      reporter_name: '山田太郎',
      reporter_email: 'yamada.taro@example.com',
    };

    const systemConfig = {
      morning_meeting_time: '09:00:00',
      director_email: '',
      director_name: '佐藤花子',
    };

    const result = () =>
      sendReportWithDelayJudgment(reportData, systemConfig);

    expect(result).toThrow(/INVALID_RECIPIENT_EMAIL/);
  });
});