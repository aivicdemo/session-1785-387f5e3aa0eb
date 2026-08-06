import { describe, test, expect, beforeEach } from '@jest/globals';
import { sendReportWithEmailNotification } from '../../src/logic/it-1-br-1-1-1';

describe('朝会報告送信時に送信者本人と部長宛に確認メールを自動配信する機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-265
  test('[error] 朝会報告送信時刻遅延判定機能 - 送信者メールアドレスが空文字列のとき処理が失敗する', () => {
    const sender_email = '';
    const yesterday_accomplishment = '昨日やったこと';
    const today_plan = '今日やること';
    const current_issue = '抱えている課題';

    expect(() =>
      sendReportWithEmailNotification({
        sender_email,
        yesterday_accomplishment,
        today_plan,
        current_issue,
      })
    ).toThrow(/メールアドレス|INVALID_EMAIL/);
  });
});