import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { judgeReportSubmissionStatus } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-210
  test('朝会開始予定時刻の直前に1名でも未送信者がいる場合、未送信者ありと判定される', () => {
    const meeting_start_time = new Date('2024-01-15T09:00:00Z');
    const current_time = new Date('2024-01-15T08:59:59Z');
    
    const submission_records = [
      { user_id: 1, submitted_at: new Date('2024-01-15T08:30:00Z') },
      { user_id: 2, submitted_at: new Date('2024-01-15T08:35:00Z') },
      { user_id: 3, submitted_at: new Date('2024-01-15T08:40:00Z') },
      { user_id: 4, submitted_at: new Date('2024-01-15T08:45:00Z') },
      { user_id: 5, submitted_at: new Date('2024-01-15T08:50:00Z') },
      { user_id: 6, submitted_at: new Date('2024-01-15T08:52:00Z') },
      { user_id: 7, submitted_at: new Date('2024-01-15T08:54:00Z') },
      { user_id: 8, submitted_at: new Date('2024-01-15T08:56:00Z') },
      { user_id: 9, submitted_at: new Date('2024-01-15T08:58:00Z') }
    ];
    
    const all_members = [
      { user_id: 1 },
      { user_id: 2 },
      { user_id: 3 },
      { user_id: 4 },
      { user_id: 5 },
      { user_id: 6 },
      { user_id: 7 },
      { user_id: 8 },
      { user_id: 9 },
      { user_id: 10 }
    ];
    
    const result = judgeReportSubmissionStatus({
      meeting_start_time,
      current_time,
      submission_records,
      all_members
    });
    
    expect(result.has_unsubmitted_members).toBe(true);
    expect(result.unsubmitted_count).toBe(1);
    expect(result.submitted_count).toBe(9);
  });
});