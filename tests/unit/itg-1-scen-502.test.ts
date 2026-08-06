import { sendPromptEmailForUnreportedMembers } from '../../src/logic/it-1-br-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('未報告催促メール通知機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  // SCEN-502
  test('[error] 部長ユーザー情報が null で催促メール送信対象が特定されない', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const departmentId = 'dept-001';
    const scheduleTime = new Date('2024-01-15T08:00:00Z');
    const unreportedMemberIds = ['eng-001', 'eng-002'];
    const managerUserInfo = null;

    await sendPromptEmailForUnreportedMembers(
      departmentId,
      scheduleTime,
      unreportedMemberIds,
      managerUserInfo
    );

    expect(fetchMock.mock.calls.length).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/送信対象の部長ユーザー情報がnullです/)
    );

    consoleSpy.mockRestore();
  });
});