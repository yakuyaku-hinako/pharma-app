// 集計ロジック(画面や保存に依存しない。初期状態はすべて0)
const Stats = {
  // 正誤判定: 「まだ不安(unsure)」は常に不正解
  judge(selected, correct) { return selected === correct; },

  // 理解度(%) = 正答数 ÷ 全回答数 × 100(回答なしは0)
  accuracyPercent(correct, total) {
    return total > 0 ? Math.round(correct / total * 100) : 0;
  },

  // ★: 90%以上=3 / 50%以上=2 / 50%未満=1 / 未回答=0
  stars(correct, total) {
    if (total === 0) return 0;
    const r = correct / total;
    return r >= 0.9 ? 3 : r >= 0.5 ? 2 : 1;
  },

  // 新規: 履歴なし or 直近が不正解 / 復習: 直近が正解
  isNew(histories) {
    if (histories.length === 0) return true;
    const latest = histories.reduce((a, b) =>
      new Date(a.answeredAt) >= new Date(b.answeredAt) ? a : b);
    return !latest.isCorrect;
  },

  dayKey(d) {
    const x = new Date(d);
    return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`;
  },

  // 連続学習日数(今日未回答でも昨日までの連続は維持)
  streak(answerDates, today = new Date()) {
    const days = new Set(answerDates.map(d => Stats.dayKey(d)));
    const cur = new Date(today);
    if (!days.has(Stats.dayKey(cur))) cur.setDate(cur.getDate() - 1);
    let n = 0;
    while (days.has(Stats.dayKey(cur))) { n++; cur.setDate(cur.getDate() - 1); }
    return n;
  },

  // 直近7日のドット(古い→新しい、今日が最後)。学習した日=true
  last7(answerDates, today = new Date()) {
    const days = new Set(answerDates.map(d => Stats.dayKey(d)));
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      out.push(days.has(Stats.dayKey(d)));
    }
    return out;
  },

  // 最新の回答結果: 'none'(未回答) / 'correct'(正解) / 'wrong'(不正解)。回答日時が最新のものを基準にする
  lastResult(histories) {
    if (histories.length === 0) return 'none';
    const latest = histories.reduce((a, b) =>
      new Date(a.answeredAt) >= new Date(b.answeredAt) ? a : b);
    return latest.isCorrect ? 'correct' : 'wrong';
  }
};
