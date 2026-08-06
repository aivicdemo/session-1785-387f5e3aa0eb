import { describe, it, expect, beforeEach } from '@jest/globals';
import { validatePromptStopFlag } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時の自動催促停止判定機能', () => {
  // SCEN-429
  it('催促停止フラグが null のときに ValidationError をスロー', () => {
    const report_id = 'RPT-001';
    const user_id = 'USR-ENG-001';
    const department_id = 'DEPT-DEV';
    const prompt_stop_flag = null;
    const submission_date = new Date('2024-01-15T09:00:00Z');

    const report_data = {
      report_id,
      user_id,
      department_id,
      prompt_stop_flag,
      submission_date,
    };

    expect(() => validatePromptStopFlag(report_data)).toThrow(
      /催促停止フラグが未設定です/
    );

    try {
      validatePromptStopFlag(report_data);
    } catch (error_obj) {
      if (error_obj instanceof Error) {
        expect(error_obj.message).toMatch(/INVALID_FLAG_VALUE/);
      }
    }
  });
});