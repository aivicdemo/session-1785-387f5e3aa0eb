import { sendConfirmationEmails } from '../../src/logic/it-1-br-1-1-1';

describe('確認メール配信機能 - 報告内容がnullのとき', () => {
  // SCEN-294
  test('reportContent[0]がnullのとき、メール配信処理が中断される', async () => {
    // Setup: メール送信と履歴記録の依存関数をモック
    const mockSendSmtp = jest.fn().mockResolvedValue({ success: true });
    const mockGenerateMailBody = jest.fn().mockReturnValue('Mock mail body');
    const mockRecordMailHistory = jest.fn().mockResolvedValue(undefined);

    // reportContent[0]をnullに設定、reportContent[1]と[2]は正常値
    const report_data = {
      user_id: 'ENG001',
      report_date: '2024-01-15',
      report_content: [
        null, // 昨日やったこと - null
        '本日の予定: タスクA実施',
        '課題: 環境構築の遅延'
      ],
      sender_email: 'engineer@example.com',
      department_head_email: 'manager@example.com'
    };

    // メール配信関数を実行して例外をキャッチ
    await expect(() =>
      sendConfirmationEmails(
        report_data,
        mockSendSmtp,
        mockGenerateMailBody,
        mockRecordMailHistory
      )
    ).rejects.toThrow(/Report content item 0 is required/);

    // メール本文生成が呼ばれていないことを確認（処理が中断された証拠）
    expect(mockGenerateMailBody).not.toHaveBeenCalled();

    // SMTP送信が呼ばれていないことを確認
    expect(mockSendSmtp).not.toHaveBeenCalled();

    // メール送信履歴が記録されていないことを確認
    expect(mockRecordMailHistory).not.toHaveBeenCalled();
  });
});