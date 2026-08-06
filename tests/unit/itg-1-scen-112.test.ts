import { sendConfirmationEmailToDepartmentHead } from '../../src/logic/it-1';

describe('日報入力フォームの提出と確認メール自動配信', () => {
  // SCEN-112
  test('開発部長にメールが配信される', async () => {
    const departmentHeadEmail = 'head@company.com';
    const engineerEmail = 'engineer@company.com';
    const yesterdayAccomplishment = 'バグ修正';
    const todayPlan = '機能実装';
    const currentChallenge = 'リソース不足';

    const reportData = {
      engineerEmail,
      yesterdayAccomplishment,
      todayPlan,
      currentChallenge,
    };

    const emailServiceMock = {
      send: jest.fn().mockResolvedValue({ messageId: 'msg-12345' }),
    };

    const result = await sendConfirmationEmailToDepartmentHead(
      reportData,
      departmentHeadEmail,
      emailServiceMock
    );

    expect(emailServiceMock.send).toHaveBeenCalledTimes(1);
    expect(emailServiceMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: departmentHeadEmail,
      })
    );

    const callArgs = emailServiceMock.send.mock.calls[0][0];
    expect(callArgs.body).toContain('昨日やったこと：バグ修正');
    expect(callArgs.body).toContain('今日やること：機能実装');
    expect(callArgs.body).toContain('抱えている課題：リソース不足');

    expect(result).toEqual({
      success: true,
      messageId: 'msg-12345',
    });
  });
});