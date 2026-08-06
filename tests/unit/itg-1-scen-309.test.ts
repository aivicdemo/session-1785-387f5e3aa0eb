import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendConfirmationEmailsToDeptHeadAndReporter } from '../../src/logic/it-1-br-1-1-1';

describe('確認メール配信機能 - メール送信サービスタイムアウトエラー', () => {
  let emailServiceMock: {
    send: jest.Mock;
  };
  let errorLogMock: jest.Mock;
  let systemStateMock: {
    status: string;
  };

  beforeEach(() => {
    errorLogMock = jest.fn();
    systemStateMock = { status: 'idle' };
    emailServiceMock = {
      send: jest.fn(),
    };

    // グローバルスコープにモックを登録
    (global as any).emailService = emailServiceMock;
    (global as any).errorLog = errorLogMock;
    (global as any).systemState = systemStateMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-309
  test('メール送信サービスがタイムアウトしたとき、エラーが発生して処理が中断される', async () => {
    // 準備: タイムアウト例外をシミュレート
    const timeoutError = new Error('メール送信タイムアウト');
    emailServiceMock.send.mockRejectedValueOnce(timeoutError);

    // 入力: 確認メール配信対象のデータ
    const reportData = {
      reporterId: 'ENG001',
      reporterName: 'エンジニア太郎',
      reporterEmail: 'taro@example.com',
      deptHeadEmail: 'manager@example.com',
      deptHeadName: '開発部長',
      yesterdayAccomplishment: '機能Aの実装完了',
      todayPlan: '機能Bの実装開始',
      challenges: 'データベース接続の最適化が必要',
      sentAt: new Date('2024-01-15T09:00:00Z'),
    };

    // 実行: 確認メール配信機能を実行
    let caughtError: Error | null = null;
    try {
      await sendConfirmationEmailsToDeptHeadAndReporter(reportData);
    } catch (error) {
      caughtError = error as Error;
    }

    // 検証: エラーが発生したこと
    expect(caughtError).toBeTruthy();
    expect(caughtError?.message).toMatch(/メール送信タイムアウト/);

    // 検証: エラーログに『メール送信タイムアウト』が記録されている
    expect(errorLogMock).toHaveBeenCalledWith(
      expect.stringContaining('メール送信タイムアウト')
    );

    // 検証: メール送信が開始されたこと（タイムアウトで失敗）
    expect(emailServiceMock.send).toHaveBeenCalled();

    // 検証: システムの状態が『メール送信中断』となっている
    expect(systemStateMock.status).toBe('メール送信中断');

    // 検証: 後続処理（日報ステータス更新）が実行されていないこと
    // 実行後の状態確認で、部長へのメールが送信されていないことを確認
    const deptHeadEmailCalls = emailServiceMock.send.mock.calls.filter(
      (call: any) => call[0].to === 'manager@example.com'
    );
    expect(deptHeadEmailCalls.length).toBe(0);
  });
});