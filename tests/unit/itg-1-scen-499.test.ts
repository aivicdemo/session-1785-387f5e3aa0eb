import { generateUnreportedPromptNotification } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-499
  test('未報告催促通知機能 - 同じ入力条件で2回実行した場合、毎回同じ未報告者リストと催促メッセージが生成される', () => {
    const execution_date = new Date('2024-01-15T09:00:00Z');
    const admin_email = 'admin@example.com';
    const unreported_members = [
      { member_id: 'MEM001', member_name: 'Alice' },
      { member_id: 'MEM002', member_name: 'Bob' },
      { member_id: 'MEM003', member_name: 'Charlie' },
      { member_id: 'MEM004', member_name: 'David' },
      { member_id: 'MEM005', member_name: 'Eve' },
      { member_id: 'MEM006', member_name: 'Frank' },
      { member_id: 'MEM007', member_name: 'Grace' },
      { member_id: 'MEM008', member_name: 'Henry' },
      { member_id: 'MEM009', member_name: 'Iris' },
      { member_id: 'MEM010', member_name: 'Jack' },
    ];

    const first_execution = generateUnreportedPromptNotification({
      execution_date,
      admin_email,
      unreported_members,
    });

    const first_unreported_list = first_execution.unreported_members_list;
    const first_prompt_message = first_execution.prompt_message;

    const second_execution = generateUnreportedPromptNotification({
      execution_date,
      admin_email,
      unreported_members,
    });

    const second_unreported_list = second_execution.unreported_members_list;
    const second_prompt_message = second_execution.prompt_message;

    expect(first_unreported_list).toEqual(second_unreported_list);
    expect(first_unreported_list).toHaveLength(10);
    expect(first_unreported_list.map(m => m.member_name)).toEqual([
      'Alice',
      'Bob',
      'Charlie',
      'David',
      'Eve',
      'Frank',
      'Grace',
      'Henry',
      'Iris',
      'Jack',
    ]);

    expect(first_prompt_message).toEqual(second_prompt_message);
    expect(first_prompt_message).toMatch(/本日09:00現在、以下の部員から朝会報告が未提出です。/);
  });
});