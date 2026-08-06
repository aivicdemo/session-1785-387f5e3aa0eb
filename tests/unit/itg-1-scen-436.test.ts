import { stopPromptionLoopWhenThresholdReached } from '../../src/logic/it-1-br-1-1-1';

describe('催促ループ終了判定機能 - 再報告待機時間がちょうど一定時間に達した時点で催促を停止する', () => {
  test('SCEN-436: 再報告待機時間が60分ちょうどに達したとき催促ループが終了する', () => {
    // テスト環境の初期化: 再報告待機時間の閾値を60分に設定
    const threshold_minutes = 60;
    const unprompted_user_id = 'user-001';
    const dept_head_id = 'head-001';

    // 催促ループ開始時刻（基準時刻）
    const loop_start_time = new Date('2024-01-15T08:00:00Z');

    // 現在時刻から59分59秒経過した時点での状態
    const time_at_59m59s = new Date(loop_start_time.getTime() + 59 * 60 * 1000 + 59 * 1000);
    const prompt_state_before_threshold = {
      loop_start_time: loop_start_time,
      current_time: time_at_59m59s,
      unprompted_user_id: unprompted_user_id,
      dept_head_id: dept_head_id,
      threshold_minutes: threshold_minutes,
      send_mail_called: false,
      is_active: true,
    };

    // 未報告ユーザーに対して催促ループを開始（59分59秒時点では催促メール未送信）
    expect(prompt_state_before_threshold.send_mail_called).toBe(false);
    expect(prompt_state_before_threshold.is_active).toBe(true);

    // 現在時刻からさらに1秒経過させ、合計60分ちょうどに到達
    const time_at_60m = new Date(loop_start_time.getTime() + 60 * 60 * 1000);
    const prompt_state_at_threshold = {
      loop_start_time: loop_start_time,
      current_time: time_at_60m,
      unprompted_user_id: unprompted_user_id,
      dept_head_id: dept_head_id,
      threshold_minutes: threshold_minutes,
      send_mail_called: false,
      is_active: false,
    };

    // 催促ループの判定処理を実行
    const result = stopPromptionLoopWhenThresholdReached(prompt_state_at_threshold);

    // 期待結果: 催促メール送信処理が呼び出されず、催促ループが終了状態に遷移
    expect(result.send_mail_called).toBe(false);
    expect(result.is_active).toBe(false);
    expect(result.unprompted_user_id).toBe('user-001');
    expect(result.loop_start_time).toEqual(new Date('2024-01-15T08:00:00Z'));
    expect(result.current_time).toEqual(time_at_60m);
    expect(result.threshold_minutes).toBe(60);
  });
});