import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { detectMissingReportsAcrossYearBoundary } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-247
  it('[edge] 報告漏れ部員の視認機能 - 年度をまたぐ期間（前年度最終日から新年度初日）での報告漏れが正しく検出される', () => {
    // Arrange: テスト用の日時とデータを準備
    const prevYearFinalDay = new Date('2024-03-31T23:59:59Z');
    const newYearFirstDay = new Date('2024-04-01T00:00:00Z');

    // 前年度最終日に報告を送信した部員: B, E, H
    const submittedOnPrevYearFinalDay = [
      {
        employee_id: 'EMP_B',
        employee_name: '部員B',
        submission_date: prevYearFinalDay,
        is_submitted: true,
      },
      {
        employee_id: 'EMP_E',
        employee_name: '部員E',
        submission_date: prevYearFinalDay,
        is_submitted: true,
      },
      {
        employee_id: 'EMP_H',
        employee_name: '部員H',
        submission_date: prevYearFinalDay,
        is_submitted: true,
      },
    ];

    // 前年度最終日に報告を送信しなかった部員: A, C, D, F, G, I, J
    const notSubmittedOnPrevYearFinalDay = [
      {
        employee_id: 'EMP_A',
        employee_name: '部員A',
        submission_date: null,
        is_submitted: false,
      },
      {
        employee_id: 'EMP_C',
        employee_name: '部員C',
        submission_date: null,
        is_submitted: false,
      },
      {
        employee_id: 'EMP_D',
        employee_name: '部員D',
        submission_date: null,
        is_submitted: false,
      },
      {
        employee_id: 'EMP_F',
        employee_name: '部員F',
        submission_date: null,
        is_submitted: false,
      },
      {
        employee_id: 'EMP_G',
        employee_name: '部員G',
        submission_date: null,
        is_submitted: false,
      },
      {
        employee_id: 'EMP_I',
        employee_name: '部員I',
        submission_date: null,
        is_submitted: false,
      },
      {
        employee_id: 'EMP_J',
        employee_name: '部員J',
        submission_date: null,
        is_submitted: false,
      },
    ];

    const all_employees = [
      ...submittedOnPrevYearFinalDay,
      ...notSubmittedOnPrevYearFinalDay,
    ];

    // 年度をまたぐ期間の報告漏れを検出する入力
    const input = {
      reference_date: newYearFirstDay,
      target_date: newYearFirstDay,
      employees: all_employees,
      fiscal_year_boundary: {
        prev_year_final_day: prevYearFinalDay,
        new_year_first_day: newYearFirstDay,
      },
    };

    // Act: 報告漏れ部員を検出
    const result = detectMissingReportsAcrossYearBoundary(input);

    // Assert: 検出結果を検証
    expect(result.target_date).toEqual(newYearFirstDay);
    expect(result.missing_report_count).toBe(7);
    expect(result.missing_report_employees).toHaveLength(7);

    // 検出された報告漏れ部員が正しいか確認
    const missing_employee_ids = result.missing_report_employees.map(
      (emp) => emp.employee_id
    );
    expect(missing_employee_ids).toEqual([
      'EMP_A',
      'EMP_C',
      'EMP_D',
      'EMP_F',
      'EMP_G',
      'EMP_I',
      'EMP_J',
    ]);

    // 検出された部員名が正しいか確認
    const missing_employee_names = result.missing_report_employees.map(
      (emp) => emp.employee_name
    );
    expect(missing_employee_names).toEqual([
      '部員A',
      '部員C',
      '部員D',
      '部員F',
      '部員G',
      '部員I',
      '部員J',
    ]);

    // 管理画面に表示されるメッセージ形式を検証
    const display_message = result.display_message;
    expect(display_message).toMatch(/2024年4月1日/);
    expect(display_message).toMatch(/7名/);
    expect(display_message).toMatch(/報告漏れ部員/);

    // 前年度最終日に報告を送信した部員が検出対象に含まれていないか確認
    const submitted_employee_ids_in_result = result.missing_report_employees.map(
      (emp) => emp.employee_id
    );
    expect(submitted_employee_ids_in_result).not.toContain('EMP_B');
    expect(submitted_employee_ids_in_result).not.toContain('EMP_E');
    expect(submitted_employee_ids_in_result).not.toContain('EMP_H');
  });
});