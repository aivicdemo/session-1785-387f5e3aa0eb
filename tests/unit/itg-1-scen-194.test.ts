import { getUnsubmittedReportersForDate } from "../../src/logic/it-1";

describe("朝会報告送信状況判定機能", () => {
  test("SCEN-194: 複数の未送信者が存在する場合、未送信者リストが正しく抽出される", () => {
    // Arrange
    const target_date = "2024-01-15";
    const submitted_reports = [
      {
        reporter_id: "A",
        reporter_name: "部員A",
        submitted_at: "2024-01-15T08:00:00Z",
      },
      {
        reporter_id: "D",
        reporter_name: "部員D",
        submitted_at: "2024-01-15T08:15:00Z",
      },
    ];
    const all_reporters = [
      { reporter_id: "A", reporter_name: "部員A" },
      { reporter_id: "B", reporter_name: "部員B" },
      { reporter_id: "C", reporter_name: "部員C" },
      { reporter_id: "D", reporter_name: "部員D" },
      { reporter_id: "E", reporter_name: "部員E" },
    ];

    // Act
    const result = getUnsubmittedReportersForDate(
      target_date,
      submitted_reports,
      all_reporters
    );

    // Assert
    expect(result.unsubmitted_reporters).toHaveLength(3);
    expect(result.unsubmitted_reporters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reporter_id: "B", reporter_name: "部員B" }),
        expect.objectContaining({ reporter_id: "C", reporter_name: "部員C" }),
        expect.objectContaining({ reporter_id: "E", reporter_name: "部員E" }),
      ])
    );
    expect(
      result.unsubmitted_reporters.some((r) => r.reporter_id === "A")
    ).toBe(false);
    expect(
      result.unsubmitted_reporters.some((r) => r.reporter_id === "D")
    ).toBe(false);
    expect(result.unsubmitted_count).toBe(3);
  });
});