import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx4Imp1Agent } from '../../src/logic/it-1';

interface ExtractedIssue {
  issueId: string;
  title: string;
  description: string;
  detectedFromEmployee: string;
  sourceField: 'yesterday' | 'today' | 'challenges';
}

interface Tx4Imp1AiClient {
  prompt(input: string): Promise<string>;
}

interface DailyReport {
  employeeId: string;
  employeeName: string;
  yesterday: string;
  today: string;
  challenges: string;
  submittedAt: string;
}

interface Tx4Imp1AgentInput {
  reports: DailyReport[];
  meetingStartTime: string;
  aiClient: Tx4Imp1AiClient;
}

interface Tx4Imp1AgentOutput {
  extractedIssues: ExtractedIssue[];
  orchestratorLog: string[];
}

describe('IT-1: 日報収集から課題抽出・優先度判定までの自動実行 AIエージェント - 課題・ボトルネック自動抽出', () => {
  // SCEN-573
  test('runTx4Imp1Agent関数が10名の日報から3件以上10件以下の課題を抽出し、各課題が必須フィールドを保持する', async () => {
    const orchestratorLogBuffer: string[] = [];

    const mockDailyReports: DailyReport[] = [
      {
        employeeId: 'EMP001',
        employeeName: 'Alice',
        yesterday: 'APIサーバーの性能改善実装を完了',
        today: 'ユーザー認証機能の統合テスト実施',
        challenges: 'DBコネクションプールが頻繁にタイムアウトする',
        submittedAt: '2024-01-15T07:30:00Z',
      },
      {
        employeeId: 'EMP002',
        employeeName: 'Bob',
        yesterday: 'フロントエンドコンポーネントのリファクタリング',
        today: 'E2Eテスト環境構築',
        challenges: 'CIパイプラインのビルド時間が20分を超えている',
        submittedAt: '2024-01-15T07:25:00Z',
      },
      {
        employeeId: 'EMP003',
        employeeName: 'Charlie',
        yesterday: 'ドキュメント更新',
        today: 'API仕様書の作成',
        challenges: 'チーム間の認識ズレにより仕様が定まらない',
        submittedAt: '2024-01-15T07:40:00Z',
      },
      {
        employeeId: 'EMP004',
        employeeName: 'Diana',
        yesterday: 'セキュリティ脆弱性スキャン実施',
        today: '検出された脆弱性の修正',
        challenges: 'レガシーコードの修正が困難',
        submittedAt: '2024-01-15T07:35:00Z',
      },
      {
        employeeId: 'EMP005',
        employeeName: 'Eve',
        yesterday: 'データベーススキーマの最適化',
        today: 'インデックス追加と検証',
        challenges: 'クエリパフォーマンスが期待値に達していない',
        submittedAt: '2024-01-15T07:28:00Z',
      },
      {
        employeeId: 'EMP006',
        employeeName: 'Frank',
        yesterday: 'ストレージレイアウトの改修完了',
        today: '本番環境への展開準備',
        challenges: '本番環境のリソース制約により展開時期が不確定',
        submittedAt: '2024-01-15T07:32:00Z',
      },
      {
        employeeId: 'EMP007',
        employeeName: 'Grace',
        yesterday: 'モニタリングダッシュボード構築',
        today: 'アラート設定の最適化',
        challenges: 'ログ集約システムの遅延が顕著',
        submittedAt: '2024-01-15T07:29:00Z',
      },
      {
        employeeId: 'EMP008',
        employeeName: 'Henry',
        yesterday: 'キャッシュレイヤーの実装',
        today: 'キャッシュの一貫性検証',
        challenges: '分散キャッシュの同期タイミングが複雑',
        submittedAt: '2024-01-15T07:31:00Z',
      },
      {
        employeeId: 'EMP009',
        employeeName: 'Ivy',
        yesterday: '負荷テスト環境のセットアップ',
        today: '10万同時接続の負荷試験実施',
        challenges: 'テスト環境のリソース不足でスケーラビリティ検証が不完全',
        submittedAt: '2024-01-15T07:33:00Z',
      },
      {
        employeeId: 'EMP010',
        employeeName: 'Jack',
        yesterday: 'デプロイメントパイプラインの改善',
        today: 'ローリング更新の動作検証',
        challenges: '既存インスタンスとの互換性を維持しながらの更新が困難',
        submittedAt: '2024-01-15T07:34:00Z',
      },
    ];

    const mockAiClientOutput = JSON.stringify({
      issues: [
        {
          issueId: 'ISSUE-001',
          title: 'DBコネクションプール頻繁タイムアウト',
          description:
            'DBコネクションプールが頻繁にタイムアウトし、APIサーバーの性能改善効果が削減されている。',
          detectedFromEmployee: 'Alice',
          sourceField: 'challenges',
        },
        {
          issueId: 'ISSUE-002',
          title: 'CIビルド時間延長',
          description: 'CIパイプラインのビルド時間が20分を超えており、開発サイクルを圧迫している。',
          detectedFromEmployee: 'Bob',
          sourceField: 'challenges',
        },
        {
          issueId: 'ISSUE-003',
          title: 'チーム間仕様認識ズレ',
          description:
            'API仕様書作成時にチーム間の認識が異なり、仕様定義が遅延するボトルネック。',
          detectedFromEmployee: 'Charlie',
          sourceField: 'challenges',
        },
        {
          issueId: 'ISSUE-004',
          title: 'レガシーコード脆弱性修正困難',
          description:
            'セキュリティ脆弱性スキャンで検出された問題がレガシーコードであり、修正が困難。',
          detectedFromEmployee: 'Diana',
          sourceField: 'challenges',
        },
        {
          issueId: 'ISSUE-005',
          title: 'クエリパフォーマンス未達',
          description:
            'データベーススキーマ最適化後もクエリパフォーマンスが期待値に達していない。',
          detectedFromEmployee: 'Eve',
          sourceField: 'challenges',
        },
        {
          issueId: 'ISSUE-006',
          title: '本番リソース制約による展開遅延',
          description:
            'ストレージレイアウト改修の本番環境展開が、本番環境のリソース制約により不確定。',
          detectedFromEmployee: 'Frank',
          sourceField: 'challenges',
        },
        {
          issueId: 'ISSUE-007',
          title: 'ログ集約システム遅延',
          description:
            'モニタリングダッシュボード構築後、ログ集約システムの遅延が顕著になっている。',
          detectedFromEmployee: 'Grace',
          sourceField: 'challenges',
        },
      ],
    });

    const mockAiClient: Tx4Imp1AiClient = {
      prompt: jest.fn(async (input: string): Promise<string> => {
        orchestratorLogBuffer.push('Autonomous action: Extract issues and bottlenecks');
        if (input.includes('課題抽出')) {
          orchestratorLogBuffer.push('AI client called with issue extraction prompt');
        }
        return mockAiClientOutput;
      }),
    };

    const input: Tx4Imp1AgentInput = {
      reports: mockDailyReports,
      meetingStartTime: '2024-01-15T08:00:00Z',
      aiClient: mockAiClient,
    };

    const result: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input);

    expect(orchestratorLogBuffer).toContain('Autonomous action: Extract issues and bottlenecks');

    expect(result.extractedIssues).toBeDefined();
    expect(Array.isArray(result.extractedIssues)).toBe(true);

    expect(result.extractedIssues.length).toBeGreaterThanOrEqual(3);
    expect(result.extractedIssues.length).toBeLessThanOrEqual(10);

    for (const issue of result.extractedIssues) {
      expect(issue).toHaveProperty('issueId');
      expect(issue).toHaveProperty('title');
      expect(issue).toHaveProperty('description');
      expect(issue).toHaveProperty('detectedFromEmployee');
      expect(issue).toHaveProperty('sourceField');

      expect(typeof issue.issueId).toBe('string');
      expect(issue.issueId.length).toBeGreaterThan(0);

      expect(typeof issue.title).toBe('string');
      expect(issue.title.length).toBeGreaterThan(0);

      expect(typeof issue.description).toBe('string');
      expect(issue.description.length).toBeGreaterThan(0);

      expect(typeof issue.detectedFromEmployee).toBe('string');
      expect(issue.detectedFromEmployee.length).toBeGreaterThan(0);

      expect(['yesterday', 'today', 'challenges']).toContain(issue.sourceField);
    }

    for (const issue of result.extractedIssues) {
      const employeeReport = mockDailyReports.find(
        (r) => r.employeeName === issue.detectedFromEmployee,
      );
      expect(employeeReport).toBeDefined();

      if (issue.sourceField === 'yesterday') {
        expect(employeeReport!.yesterday).toMatch(new RegExp(issue.title.split(/\s+/)[0], 'i'));
      } else if (issue.sourceField === 'today') {
        expect(employeeReport!.today).toBeDefined();
      } else if (issue.sourceField === 'challenges') {
        expect(employeeReport!.challenges).toMatch(new RegExp(issue.title.split(/\s+/)[0], 'i'));
      }
    }

    expect(result.orchestratorLog).toBeDefined();
    expect(Array.isArray(result.orchestratorLog)).toBe(true);
    expect(result.orchestratorLog).toContain('Autonomous action: Extract issues and bottlenecks');

    const promptCalls = (mockAiClient.prompt as jest.Mock).mock.calls;
    expect(promptCalls.length).toBeGreaterThanOrEqual(1);

    let promptTemplateUsed = false;
    for (const call of promptCalls) {
      const promptInput = call[0];
      if (
        promptInput.includes('課題抽出') ||
        promptInput.includes('extract') ||
        promptInput.includes('issue')
      ) {
        promptTemplateUsed = true;
        break;
      }
    }
    expect(promptTemplateUsed).toBe(true);
  });
});