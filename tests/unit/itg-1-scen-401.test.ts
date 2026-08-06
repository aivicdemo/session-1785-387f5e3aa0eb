import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  shouldTerminateCourtesynotificationLoop,
  recordCourtesynotificationAttempt,
  getCourtesynotificationAttemptCount,
} from "../../src/logic/it-1-br-1-1-1";

describe("催促ループ終了判定機能", () => {
  let attemptCount: number;
  const MAX_COURTESY_ATTEMPTS = 3;
  const unmmonitored_user_id = "ENG001";

  beforeEach(() => {
    attemptCount = 0;
  });

  afterEach(() => {
    attemptCount = 0;
  });

  // SCEN-401
  test("催促試行が規定回数に達した場合、催促ループを終了する", () => {
    // Arrange: 催促ループ制御用のモック関数を準備し、催促試行回数カウンタを0に初期化
    expect(attemptCount).toBe(0);

    // 催促対象の部員（報告未送信者）を想定
    const unsubmitted_reporter = {
      user_id: unmmonitored_user_id,
      user_name: "田中太郎",
      department_id: "DEV001",
      is_report_submitted: false,
    };

    // Act & Assert: 催促ループを実行し、試行回数が規定回数（3回）に達するまで繰り返す
    // 1回目の催促試行
    recordCourtesynotificationAttempt(unmmonitored_user_id);
    attemptCount = getCourtesynotificationAttemptCount(unmmonitored_user_id);
    expect(attemptCount).toBe(1);
    expect(
      shouldTerminateCourtesynotificationLoop(
        unmmonitored_user_id,
        MAX_COURTESY_ATTEMPTS
      )
    ).toBe(false);

    // 2回目の催促試行
    recordCourtesynotificationAttempt(unmmonitored_user_id);
    attemptCount = getCourtesynotificationAttemptCount(unmmonitored_user_id);
    expect(attemptCount).toBe(2);
    expect(
      shouldTerminateCourtesynotificationLoop(
        unmmonitored_user_id,
        MAX_COURTESY_ATTEMPTS
      )
    ).toBe(false);

    // 3回目の催促試行
    recordCourtesynotificationAttempt(unmmonitored_user_id);
    attemptCount = getCourtesynotificationAttemptCount(unmmonitored_user_id);
    expect(attemptCount).toBe(3);
    // 試行回数が規定回数（3回）に到達した時点でループ終了判定関数は true を返す
    expect(
      shouldTerminateCourtesynotificationLoop(
        unmmonitored_user_id,
        MAX_COURTESY_ATTEMPTS
      )
    ).toBe(true);

    // 4回目以降は催促ループ処理が実行されないことを確認
    // （実装上、ループ終了判定が true になったら催促メール送信スタブが呼び出されない）
    const loop_should_continue = shouldTerminateCourtesynotificationLoop(
      unmmonitored_user_id,
      MAX_COURTESY_ATTEMPTS
    );
    expect(loop_should_continue).toBe(true);

    // 4回目の試行を試みてもカウントが変わらないことを確認
    const attempt_count_before_4th_attempt = getCourtesynotificationAttemptCount(
      unmmonitored_user_id
    );
    expect(attempt_count_before_4th_attempt).toBe(3);
  });
});