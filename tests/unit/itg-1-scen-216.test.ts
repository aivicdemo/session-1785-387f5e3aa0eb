import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { evaluateReportSubmissionStatus } from '../../src/logic/it-1';

describe('日報送信状況判定機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-216: [edge] 日報送信状況判定機能 - 月末日の朝会開始予定時刻直前で日報送信状況が判定される
  test('月末日の朝会開始予定時刻直前で全部員の日報送信状況を正確に判定し、判定タイムスタンプに月末日朝会開始予定時刻の1分前の時刻を記録する', () => {
    const evaluation_timestamp = new Date('2024-02-28T08:59:00Z');
    const morning_meeting_scheduled_time = new Date('2024-02-28T09:00:00Z');

    const staff_members = [
      { user_id: 'ENG001', name: 'Engineer A', submission_timestamp: new Date('2024-02-28T08:30:00Z') },
      { user_id: 'ENG002', name: 'Engineer B', submission_timestamp: new Date('2024-02-28T08:45:00Z') },
      { user_id: 'ENG003', name: 'Engineer C', submission_timestamp: new Date('2024-02-28T08:15:00Z') },
      { user_id: 'ENG004', name: 'Engineer D', submission_timestamp: new Date('2024-02-28T08:50:00Z') },
      { user_id: 'ENG005', name: 'Engineer E', submission_timestamp: new Date('2024-02-28T08:20:00Z') },
      { user_id: 'ENG006', name: 'Engineer F', submission_timestamp: null },
      { user_id: 'ENG007', name: 'Engineer G', submission_timestamp: new Date('2024-02-28T08:55:00Z') },
      { user_id: 'ENG008', name: 'Engineer H', submission_timestamp: null },
      { user_id: 'ENG009', name: 'Engineer I', submission_timestamp: new Date('2024-02-28T08:40:00Z') },
      { user_id: 'ENG010', name: 'Engineer J', submission_timestamp: null },
    ];

    const result = evaluateReportSubmissionStatus({
      evaluation_timestamp,
      morning_meeting_scheduled_time,
      staff_members,
    });

    expect(result.evaluation_timestamp).toEqual(new Date('2024-02-28T08:59:00Z'));
    expect(result.total_staff_count).toBe(10);
    expect(result.submitted_count).toBe(7);
    expect(result.not_submitted_count).toBe(3);
    expect(result.submitted_user_ids).toEqual(['ENG001', 'ENG002', 'ENG003', 'ENG004', 'ENG005', 'ENG007', 'ENG009']);
    expect(result.not_submitted_user_ids).toEqual(['ENG006', 'ENG008', 'ENG010']);
    expect(result.on_time_count).toBe(7);
    expect(result.delayed_count).toBe(0);
    expect(result.delayed_user_ids).toEqual([]);
    expect(result.evaluation_month_date).toBe('2024-02-28');
    expect(result.is_month_end_day).toBe(true);
    expect(result.switchover_to_next_month_occurred).toBe(false);
  });
});