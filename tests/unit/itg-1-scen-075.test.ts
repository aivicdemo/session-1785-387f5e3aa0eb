import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateAndSendConfirmationEmail } from '../../src/logic/it-2';

// Mock email service
interface MockEmailService {
  send: jest.Mock;
  resetMocks: () => void;
}

const createMockEmailService = (): MockEmailService => {
  return {
    send: jest.fn(),
    resetMocks: function () {
      this.send.mockClear();
    },
  };
};

describe('朝会報告確認メール自動配信機能 - バリデーション', () => {
  let mockEmailService: MockEmailService;

  beforeEach(() => {
    mockEmailService = createMockEmailService();
  });

  afterEach(() => {
    mockEmailService.resetMocks();
  });

  // SCEN-075
  test('昨日やったことが空文字のときエラーメッセージが表示され確認メールが送信されない', () => {
    const reportData = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      yesterdayAccomplishment: '',
      todayPlan: '本日はユーザー認証機能のテストコード作成を進める予定です',
      currentIssues: 'ユーザー認証の実装に時間がかかっており、当初予定より2日程度遅延している',
    };

    expect(() => {
      validateAndSendConfirmationEmail(reportData, mockEmailService as any);
    }).toThrow(/昨日やったこと/);

    expect(mockEmailService.send).not.toHaveBeenCalled();
  });
});