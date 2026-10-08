// 成績: 総合・カテゴリ別の理解度(正答数 ÷ 全回答数)。弱点分析は行わない。
Screens.stats = async function () {
  const d = await Learn.load();
  const questions = await DB.getAll('questions');
  const ok = d.histories.filter(h => h.isCorrect).length;
  const total = d.histories.length;
  const pct = Stats.accuracyPercent(ok, total);
  const rows = [...d.cats].sort((a, b) => a.sortOrder - b.sortOrder).map(c => {
    const hs = d.histories.filter(h => d.catOfQuiz[h.quizId] === c.id);
    return { name: c.name, pct: Stats.accuracyPercent(hs.filter(h => h.isCorrect).length, hs.length) };
  });

  const root = node(`
    <h1>成績</h1>
    <div class="card statwrap">
      <div class="ring" style="background:conic-gradient(var(--primary) ${pct * 3.6}deg,#e3efe9 0)">
        <div><span class="muted tiny">総合理解度</span><b class="pct">${pct}%</b></div></div>
      <div class="statlist">
        <div><span class="muted tiny">学習問題数</span><b>${d.items.length}問</b></div>
        <div><span class="muted tiny">登録した疑問</span><b>${questions.length}件</b></div>
        <div><span class="muted tiny">延べ回答数</span><b>${total}回</b></div>
      </div>
    </div>
    <h2>カテゴリ別の理解度</h2>
    <div class="card">${rows.map(r => `
      <div class="statrow"><span>${esc(r.name)}</span><b>${r.pct}%</b></div>
      <div class="bar"><i style="width:${r.pct}%"></i></div>`).join('')}</div>
    <button class="btn ghost" id="settings">⚙ 設定・バックアップ</button>`);
  root.querySelector('#settings').onclick = () => App.open(Screens.settings);
  return root;
};
