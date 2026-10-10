// ホーム: 学習状況の確認と、クイズの開始
Screens.home = async function () {
  const d = await Learn.load();
  const newN = d.items.filter(i => i.isNew).length;
  const revN = d.items.length - newN;
  const dates = d.activity;   // 問題を解いた・疑問を登録・ノートを作成・問題を作成
  const streak = Stats.streak(dates);
  const dots = Stats.last7(dates);
  const catRows = [...d.cats].sort((a, b) => a.sortOrder - b.sortOrder).map(c => {
    const hs = d.histories.filter(h => d.catOfQuiz[h.quizId] === c.id);
    const ok = hs.filter(h => h.isCorrect).length;
    return { name: c.name, pct: Stats.accuracyPercent(ok, hs.length) };
  });
  const mascot = streak > 0 && streak % 7 === 0 ? 'surprise' : 'fight';   // 7日ごとの節目は驚き
  const message = d.items.length === 0 ? '問題がありません'
    : newN === 0 ? 'すべて回答済みです(復習は続けられます)' : '';

  const hasData = (await DB.getAll('questions')).length > 0;
  const last = Backup.lastDate();
  const days = last ? Math.floor((Date.now() - last) / 86400000) : null;
  const notice = hasData && (days === null || days >= 14)
    ? `<div class="card warn">💾 ${days === null ? 'まだバックアップがありません' : days + '日間バックアップしていません'}
        <button class="link" id="bk">バックアップする ›</button></div>` : '';

  let introSeen = false;
  try { introSeen = !!localStorage.getItem('pharma-intro-seen'); } catch {}
  const intro = !hasData && !introSeen ? `<div class="card intro">${Frog.img('shy', 'body', 84)}
      <div><b>はじめまして!</b><div class="muted">仕事中に気になったことを、まず1つ登録してみましょう。調べて、自分の言葉でまとめて、クイズにして復習できます。</div>
      <button class="link" id="introGo">疑問を登録する ›</button></div></div>` : '';

  const root = node(`
    <div class="hero"><div class="herofrog">${Frog.img(mascot, 'body', 84)}</div>
      <div><h1>薬剤師学習</h1><div class="muted">一歩ずつ、できることを増やしていこう!</div></div></div>
    ${intro}
    ${notice}
    <div class="card">
      <div class="streak">🔥 <b>${streak}</b>日連続学習中</div>
      <div class="dots">${dots.map(on => `<i class="dot ${on ? 'on' : ''}"></i>`).join('')}</div>
    </div>
    <h2>今日の学習</h2>
    <div class="card">
      <div class="statrow"><span>復習</span><b>${revN}問</b></div>
      <div class="statrow"><span>新しい問題</span><b>${newN}問</b></div>
      ${message ? `<div class="empty">${Frog.img(d.items.length === 0 ? 'worry' : 'joy', 'face', 72)}<div>${message}</div></div>` : ''}
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
  const ig = root.querySelector('#introGo');
  if (ig) ig.onclick = () => { try { localStorage.setItem('pharma-intro-seen', '1'); } catch {} App.switchTab('register'); };
  const bk = root.querySelector('#bk');
  if (bk) bk.onclick = () => App.switchTab('stats').then(() => App.open(Screens.settings));
  root.querySelector('#reg').onclick = () => App.switchTab('register');
  return root;
};
