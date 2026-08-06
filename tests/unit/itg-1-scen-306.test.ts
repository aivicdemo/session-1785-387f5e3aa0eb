import { sendConfirmationEmailsToManagerAndSender } from '../../src/logic/it-1-br-1-1-1';

describe('確認メール配信機能 - 送信済み部員情報が空配列の場合', () => {
  // SCEN-306
  test('送信済み部員情報の配列が空配列のとき、メール配信処理が中断される', async () => {
    // テストの初期化: 送信済み部員情報の配列を空配列 [] で設定する
    const submitted_members: any[] = [];

    // テストの初期化: メール配信サービスのスタブを注入し、送信メソッドが呼び出されていないことを確認可能にする
    const email_service_stub = {
      send: jest.fn().mockResolvedValue({ success: true, message_id: 'msg_001' }),
    };

    // テストの初期化: メール配信処理の前段階（日報一覧集約処理）が完了した状態をセットアップする
    const manager_user = {
      user_id: 'user_mgr_001',
      user_name: 'Manager User',
      email_address: 'manager@example.com',
      department_id: 'dept_001',
      role: 'manager',
    };

    const morning_meeting_time = new Date('2024-01-15T08:30:00Z');

    // 確認メール配信処理を実行する
    const result = await sendConfirmationEmailsToManagerAndSender({
      submitted_members,
      manager_user,
      morning_meeting_time,
      email_service: email_service_stub,
    });

    // メール配信処理が早期終了（return または throw）していることを確認する
    expect(result).toEqual({
      emails_sent: 0,
      status: 'early_return',
      reason: 'no_submitted_members',
    });

    // メール配信サービスのスタブに対して、送信メソッドが1回も呼び出されていないことをアサートする
    expect(email_service_stub.send).toHaveBeenCalledTimes(0);

    // 部長へのメール送信が0件であることをログまたは戻り値で確認する
    expect(result.emails_sent).toBe(0);
  });
});