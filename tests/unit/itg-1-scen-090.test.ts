import { sendMorningReportWithNotification } from '../../src/logic/it-2';

describe('朝会報告送信検証機能 - 送信処理実行時に、送信者本人宛のメール送信関数が呼び出される', () => {
  test('SCEN-090: 朝会報告送信時に送信者本人へのメール送信が実行される', () => {
    // Arrange
    const sendEmailMock = jest.fn().mockResolvedValue({ success: true });
    
    const userId = 'user001';
    const userEmail = 'user001@example.com';
    const yesterdayAccomplishment = 'ユーザー認証機能の実装完了';
    const todayPlan = 'テストコード作成';
    const currentIssue = 'データベース接続エラーの対応';
    
    const reportData = {
      user_id: userId,
      email: userEmail,
      yesterday_accomplishment: yesterdayAccomplishment,
      today_plan: todayPlan,
      current_issue: currentIssue,
      sent_at: new Date('2024-01-15T09:30:00Z').toISOString(),
    };

    // Act
    sendMorningReportWithNotification(reportData, sendEmailMock);

    // Assert
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    
    const callArgs = sendEmailMock.mock.calls[0][0];
    expect(callArgs.to).toBe('user001@example.com');
    expect(callArgs.subject).toMatch(/朝会報告/);
    expect(callArgs.body).toContain(yesterdayAccomplishment);
    expect(callArgs.body).toContain(todayPlan);
    expect(callArgs.body).toContain(currentIssue);
  });
});