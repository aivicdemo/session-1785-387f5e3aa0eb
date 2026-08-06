import { validateAndAggregateReport } from '../../src/logic/it-1-br-1-1-1';

describe('朝会報告内容検証・集約機能 - 同じ報告内容で2回実行しても同じ検証結果が返される', () => {
  // SCEN-479
  test('同一の報告内容を2回実行した場合、検証ステータス・エラーメッセージ・集約判定が完全に一致すること', () => {
    // 入力: 部員Aの報告内容
    const reportInput = {
      userId: 'user_A',
      yesterdayAccomplishment: 'ドキュメント作成',
      todayPlan: 'テスト実施',
      currentIssue: '環境構築の遅延',
      submittedAt: new Date('2024-01-15T09:00:00Z'),
    };

    // 1回目の検証・集約処理を実行
    const result1 = validateAndAggregateReport(reportInput);

    // 2回目の検証・集約処理を実行（同じ報告内容）
    const result2 = validateAndAggregateReport(reportInput);

    // 検証ステータスが一致すること
    expect(result1.validationStatus).toBe(result2.validationStatus);
    expect(result1.validationStatus).toBe('normal');

    // エラーメッセージが一致すること
    expect(result1.errorMessage).toBe(result2.errorMessage);
    expect(result1.errorMessage).toBe(null);

    // 集約判定フラグが一致すること
    expect(result1.aggregationDecision).toBe(result2.aggregationDecision);
    expect(result1.aggregationDecision).toBe('acceptable');

    // タイムスタンプ以外の全フィールドが一致すること
    expect({
      userId: result1.userId,
      validationStatus: result1.validationStatus,
      errorMessage: result1.errorMessage,
      aggregationDecision: result1.aggregationDecision,
      yesterdayAccomplishment: result1.yesterdayAccomplishment,
      todayPlan: result1.todayPlan,
      currentIssue: result1.currentIssue,
    }).toEqual({
      userId: result2.userId,
      validationStatus: result2.validationStatus,
      errorMessage: result2.errorMessage,
      aggregationDecision: result2.aggregationDecision,
      yesterdayAccomplishment: result2.yesterdayAccomplishment,
      todayPlan: result2.todayPlan,
      currentIssue: result2.currentIssue,
    });
  });
});