import { determineConfirmationEmailRecipients } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-252
  test('確認メール送信先の決定機能 - 送信者本人と部長の2件のメール送信先が正しく決定される', () => {
    const user_id = 'USER_A_001';
    const user_email = 'user.a@company.example.com';
    const department_manager_id = 'MANAGER_B_001';
    const manager_email = 'manager.b@company.example.com';

    const input = {
      submitter_user_id: user_id,
      submitter_email: user_email,
      manager_user_id: department_manager_id,
      manager_email: manager_email,
    };

    const result = determineConfirmationEmailRecipients(input);

    expect(result).toEqual({
      recipient_count: 2,
      recipients: [
        {
          recipient_email: user_email,
          recipient_role: 'submitter',
        },
        {
          recipient_email: manager_email,
          recipient_role: 'manager',
        },
      ],
    });
  });
});