// ホーム: 学習状況の確認と、クイズの開始
Screens.home = async function () {
  const d = await Learn.load();
  const newN = d.items.filter(i => i.isNew).length;
  const revN = d.items.length - newN;
  const dates = d.histories.map(h => h.answeredAt);
  const streak = Stats.streak(dates);
  const dots = Stats.last7(dates);
  const catRows = [...d.cats].sort((a, b) => a.sortOrder - b.sortOrder).map(c => {
    const hs = d.histories.filter(h => d.catOfQuiz[h.quizId] === c.id);
    const ok = hs.filter(h => h.isCorrect).length;
    return { name: c.name, pct: Stats.accuracyPercent(ok, hs.length) };
  });
  const message = d.items.length === 0 ? '問題がありません'
    : newN === 0 ? 'すべて回答済みです(復習は続けられます)' : '';

  const root = node(`
    <div class="hero"><div class="frog">🐸</div>
      <div><h1>薬剤師学習</h1><div class="muted">一歩ずつ、できることを増やしていこう!</div></div></div>
    <div class="card">
      <div class="streak">🔥 <b>${streak}</b>日連続学習中</div>
      <div class="dots">${dots.map(on => `<i class="dot ${on ? 'on' : ''}"></i>`).join('')}</div>
    </div>
    <h2>今日の学習</h2>
    <div class="card">
      <div class="statrow"><span>復習</span><b>${revN}問</b></div>
      <div class="statrow"><span>新しい問題</span><b>${newN}問</b></div>
      ${message ? `<div class="empty">${message}</div>` : ''}
      <button class="btn" id="start" ${d.items.length === 0 ? 'disabled' : ''}>学習を始める ›</button>
    </div>
    <h2>あなたの理解度</h2>
    <div class="card">${catRows.map(r => `
      <div class="statrow"><span>${esc(r.name)}</span><b>${r.pct}%</b></div>
      <div class="bar"><i style="width:${r.pct}%"></i></div>`).join('')}</div>
    <button class="btn ghost" id="reg">＋ 疑問を登録</button>`);

  root.querySelector('#start').onclick = () => {
    const ids = QuizSelector.pick(d.items.map(i => ({ id: i.quiz.id, isNew: i.isNew })), 5)
      .map(x => x.id);
    if (ids.length) App.open(Screens.quiz, { ids });
  };
  root.querySelector('#reg').onclick = () => App.switchTab('register');
  return root;
};
