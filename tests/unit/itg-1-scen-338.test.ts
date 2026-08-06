import { prioritizeFollowUpTargets } from '../../src/logic/it-1-br-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('催促対象部員の優先順位付け機能 - 催促対象が特定されない状況', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-338
  test('催促対象部員が存在しない場合、メール送信は呼び出されず、戻り値は空配列となる', async () => {
    const report_submission_history: Array<{
      user_id: string;
      department_id: string;
      submission_date: string;
      submission_time: string;
      submission_status: string;
    }> = [];

    const morning_meeting_deadline = new Date('2024-01-15T09:30:00Z');
    const current_time = new Date('2024-01-15T08:00:00Z');

    const all_engineers = [
      { user_id: 'ENG001', department_id: 'DEV', name: 'Engineer A' },
      { user_id: 'ENG002', department_id: 'DEV', name: 'Engineer B' },
      { user_id: 'ENG003', department_id: 'DEV', name: 'Engineer C' },
      { user_id: 'ENG004', department_id: 'DEV', name: 'Engineer D' },
      { user_id: 'ENG005', department_id: 'DEV', name: 'Engineer E' },
      { user_id: 'ENG006', department_id: 'DEV', name: 'Engineer F' },
      { user_id: 'ENG007', department_id: 'DEV', name: 'Engineer G' },
      { user_id: 'ENG008', department_id: 'DEV', name: 'Engineer H' },
      { user_id: 'ENG009', department_id: 'DEV', name: 'Engineer I' },
      { user_id: 'ENG010', department_id: 'DEV', name: 'Engineer J' },
    ];

    const result = await prioritizeFollowUpTargets({
      submission_history: report_submission_history,
      deadline: morning_meeting_deadline,
      current_time: current_time,
      all_users: all_engineers,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
    expect(fetchMock.calls().length).toBe(0);
  });
});