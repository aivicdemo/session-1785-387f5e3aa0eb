import { type Tx1Imp1AiClient } from "../../src/agents/tx-1-imp-1/orchestrator";
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-529
  test('[normal] 日報入力から送信・確認メール配信までの自動化 AIエージェント - 入力内容の妥当性を検証する', async () => {
    // Arrange: 偽のAIクライアントをDIコンテナに登録
    const mockAiClient: Tx1Imp1AiClient = {
      validateReportInput: jest.fn(async (input) => {
        const errors: string[] = [];

        // ①3つのフィールドがすべて空でない
        if (!input.yesterdayAccomplishment || input.yesterdayAccomplishment.trim() === '') {
          errors.push('昨日の実績が空です');
        }
        if (!input.todayPlan || input.todayPlan.trim() === '') {
          errors.push('本日の予定が空です');
        }
        if (!input.currentIssues || input.currentIssues.trim() === '') {
          errors.push('抱えている課題が空です');
        }

        // ②各フィールドが文字数1文字以上100文字以下
        if (input.yesterdayAccomplishment && (input.yesterdayAccomplishment.length < 1 || input.yesterdayAccomplishment.length > 100)) {
          errors.push('昨日の実績は1文字以上100文字以下である必要があります');
        }
        if (input.todayPlan && (input.todayPlan.length < 1 || input.todayPlan.length > 100)) {
          errors.push('本日の予定は1文字以上100文字以下である必要があります');
        }
        if (input.currentIssues && (input.currentIssues.length < 1 || input.currentIssues.length > 100)) {
          errors.push('抱えている課題は1文字以上100文字以下である必要があります');
        }

        // ③特殊文字や不正な形式がない（簡易チェック）
        const invalidCharPattern = /[<>{}[\]"'`;]/;
        if (input.yesterdayAccomplishment && invalidCharPattern.test(input.yesterdayAccomplishment)) {
          errors.push('昨日の実績に不正な文字が含まれています');
        }
        if (input.todayPlan && invalidCharPattern.test(input.todayPlan)) {
          errors.push('本日の予定に不正な文字が含まれています');
        }
        if (input.currentIssues && invalidCharPattern.test(input.currentIssues)) {
          errors.push('抱えている課題に不正な文字が含まれています');
        }

        if (errors.length > 0) {
          return {
            isValid: false,
            status: '妥当性確認: 失敗',
            errors: errors,
          };
        }

        return {
          isValid: true,
          status: '妥当性確認: 完了',
          errors: [],
        };
      }),
    };

    // Act: エンジニアAが日報入力フォームで以下を入力
    const engineerInput = {
      yesterdayAccomplishment: 'バグ修正3件',
      todayPlan: '機能開発',
      currentIssues: 'なし',
    };

    // AIエージェント（runTx1Imp1Agent）が入力内容の妥当性検証アクションを実行
    const validationResult = await runTx1Imp1Agent(mockAiClient, engineerInput);

    // Assert: 検証結果が『妥当性確認: 完了』と判定される
    expect(validationResult.status).toBe('妥当性確認: 完了');
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors).toEqual([]);

    // エージェントが次のアクション（日報をシステムに登録）へ遷移することを確認
    expect(validationResult.canProceedToRegistration).toBe(true);

    // テスト終了時にAIクライアントへの呼び出しログを検証
    expect(mockAiClient.validateReportInput).toHaveBeenCalledTimes(1);
    expect(mockAiClient.validateReportInput).toHaveBeenCalledWith(engineerInput);

    // prompt injection やマルフォームドプロンプトが送信されていないことを確認
    const callArgs = (mockAiClient.validateReportInput as jest.Mock).mock.calls[0][0];
    expect(callArgs.yesterdayAccomplishment).toBe('バグ修正3件');
    expect(callArgs.todayPlan).toBe('機能開発');
    expect(callArgs.currentIssues).toBe('なし');
    expect(typeof callArgs.yesterdayAccomplishment).toBe('string');
    expect(typeof callArgs.todayPlan).toBe('string');
    expect(typeof callArgs.currentIssues).toBe('string');
  });
});