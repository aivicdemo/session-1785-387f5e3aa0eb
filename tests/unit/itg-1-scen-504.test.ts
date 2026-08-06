import { sendReminderEmailToUnreportedMembers } from '../../src/logic/it-1-br-1-1-1';

describe('未報告催促メール通知機能', () => {
  // SCEN-504
  test('部長のメールアドレスが空文字列の場合、例外をスロー', () => {
    const manager_email = '';
    const unreported_members = [
      {
        user_id: 'ENG001',
        user_name: 'Taro Yamada',
        department_id: 'DEV001',
      },
    ];
    const meeting_start_time = new Date('2024-01-15T09:00:00Z');

    expect(() =>
      sendReminderEmailToUnreportedMembers(
        manager_email,
        unreported_members,
        meeting_start_time,
      ),
    ).toThrow(/メールアドレス/);
  });
});