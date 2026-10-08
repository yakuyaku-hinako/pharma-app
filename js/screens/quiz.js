// クイズ(最大5問) → 回答・解説 → 結果。回答するたびに履歴を保存する。
// 選択肢はA〜D + 「まだ不安」(末尾固定)。「まだ不安」は不正解として扱う。
Screens.quiz = async function (params) {
  const ids = params.ids;
  // 状態は params に持たせる(情報源ノートを見て戻っても続きから再開できる)
  const S = (params.s ||= { idx: 0, correct: 0, mode: 'q', selected: null, last: null });
  const all = await Learn.load();
  const map = Object.fromEntries(all.items.map(i => [i.quiz.id, i]));
  const total = ids.length;
  const root = document.createElement('div');
  const LABEL = { A: 'A', B: 'B', C: 'C', D: 'D', unsure: 'E' };
  const choiceText = (quiz, k) => k === 'unsure' ? 'まだ不安' : quiz.choices[k];

  const header = () => `
    <div class="qhead"><button class="back" id="exit">✕</button>
      <div class="progress"><i style="width:${(S.idx + (S.mode === 'q' ? 0 : 1)) / total * 100}%"></i></div>
      <span class="muted">${S.idx + 1} / ${total}</span></div>`;
  const badge = it => it.category ? `<span class="badge">${esc(it.category.name)}</span>` : '<span class="badge gray">情報源なし</span>';

  function questionView() {
    const it = map[ids[S.idx]], q = it.quiz;
    root.innerHTML = `${header()}
      <div class="card">${badge(it)}<div class="qtext big">${esc(q.questionText)}</div></div>
      ${['A', 'B', 'C', 'D', 'unsure'].map(k => `
        <button class="opt pick ${S.selected === k ? 'on' : ''} ${k === 'unsure' ? 'unsure' : ''}" data-k="${k}">
          <span class="optk">${LABEL[k]}</span><span>${esc(choiceText(q, k))}</span></button>`).join('')}
      <button class="btn" id="go" ${S.selected ? '' : 'disabled'}>回答する</button>`;
    root.querySelectorAll('.pick').forEach(b => b.onclick = () => { S.selected = b.dataset.k; render(); });
    root.querySelector('#go').onclick = async () => {
      const h = await DB.answerQuiz(q.id, S.selected);     // 履歴を保存
      if (h.isCorrect) S.correct++;
      S.last = { selected: S.selected, isCorrect: h.isCorrect };
      S.mode = 'result'; render();
    };
  }

  function resultView() {
    const it = map[ids[S.idx]], q = it.quiz, ok = S.last.isCorrect;
    const lastQ = S.idx + 1 >= total;
    root.innerHTML = `${header()}
      <div class="frogrow">${Frog.img(ok ? 'joy' : 'worry', 'body', 96)}</div>
      <div class="banner ${ok ? 'ok' : 'ng'}">${ok ? '✓ 正解!' : '✗ 不正解'}</div>
      <div class="card">
        <div class="lbl">あなたの回答</div>
        <div class="opt ${ok ? 'ok' : 'bad'}"><span class="optk">${LABEL[S.last.selected]}</span><span>${esc(choiceText(q, S.last.selected))}</span></div>
        ${ok ? '' : `<div class="lbl">正解</div>
        <div class="opt ok"><span class="optk">${q.correctAnswer}</span><span>${esc(q.choices[q.correctAnswer])}</span></div>`}
        <div class="lbl">解説</div><div class="qtext">${esc(q.explanation) || '—'}</div>
        <div class="lbl">薬剤師POINT</div><div class="qtext">${esc(q.pharmacistPoint) || '—'}</div>
        <div class="row">${it.question
          ? '<button class="link" id="src">情報源のノートを見る ›</button>'
          : '<span class="muted">情報源なし</span>'}</div>
      </div>
      <button class="btn" id="next">${lastQ ? '結果を見る' : '次の問題へ'}</button>`;
    const src = root.querySelector('#src');
    if (src) src.onclick = () => App.open(Screens.note, { questionId: it.question.id });
    root.querySelector('#next').onclick = () => {
      if (lastQ) S.mode = 'done'; else { S.idx++; S.mode = 'q'; S.selected = null; }
      render();
    };
  }

  function doneView() {
    root.innerHTML = `
      <div class="card center">${Frog.img(S.correct === total ? 'fun' : S.correct * 2 >= total ? 'joy' : 'fight', 'body', 120)}
        <div class="qtext big">お疲れさまでした!</div>
        <div class="score">${S.correct} / ${total} 問正解</div></div>
      <button class="btn" id="home">ホームへ</button>`;
    root.querySelector('#home').onclick = () => App.switchTab('home');
  }

  function render() {
    ({ q: questionView, result: resultView, done: doneView })[S.mode]();
    const exit = root.querySelector('#exit');
    if (exit) exit.onclick = () => { if (confirm('クイズを終了しますか?(回答済みの結果は保存されています)')) App.switchTab('home'); };
    window.scrollTo(0, 0);
  }
  render();
  return root;
};
