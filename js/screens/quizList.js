// 問題一覧(成績画面から開く)。表示と絞り込みのみで、データは一切変更しない。
const QView = { status: 'all', star: 'all' };
const STATUS_FILTERS = [['all', 'すべて'], ['none', '未回答'], ['correct', '正解'], ['wrong', '不正解']];
const STATUS_LABEL = { none: '未回答', correct: '正解', wrong: '不正解' };

Screens.quizList = async function () {
  const d = await Learn.load();
  const rows = d.items.map(i => Learn.quizRow(i))
    .sort((a, b) => b.quiz.createdAt.localeCompare(a.quiz.createdAt));
  const root = node(`
    <div class="topbar"><button class="back" id="back">‹ 戻る</button><h1>問題一覧</h1></div>
    <div class="lbl tiny">回答状況</div><div class="chips filter" id="sf"></div>
    <div class="lbl tiny">理解度</div><div class="chips filter" id="stf"></div>
    <div class="muted tiny" id="count"></div>
    <div id="list"></div>`);
  const $ = s => root.querySelector(s);
  const when = iso => new Date(iso).toLocaleString('ja-JP',
    { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const chosen = (q, h) => h.selected === 'unsure' ? 'まだ不安'
    : `${h.selected} ${q.choices[h.selected] ?? ''}`;

  function renderFilters() {
    $('#sf').innerHTML = STATUS_FILTERS.map(([v, n]) =>
      `<button type="button" class="chip pill ${QView.status === v ? 'on' : ''}" data-v="${v}">${n}</button>`).join('');
    $('#stf').innerHTML = STAR_FILTERS.map(([v, n]) =>
      `<button type="button" class="chip pill ${QView.star === v ? 'on' : ''}" data-v="${v}">${n}</button>`).join('');
  }

  function rowHtml(r) {
    const q = r.quiz;
    const hs = [...r.histories].sort((a, b) => b.answeredAt.localeCompare(a.answeredAt));
    const latest = hs[0];
    return `<details class="card qitem">
      <summary>
        <div class="qtext clamp">${esc(q.questionText)}</div>
        <div class="meta"><span class="badge st-${r.status}">${STATUS_LABEL[r.status]}</span>
          <span class="stars">${starText(r.stars)}</span>
          <span class="muted tiny">${esc(r.category?.name || '情報源なし')}</span></div>
      </summary>
      <div class="qbody">
        ${['A', 'B', 'C', 'D'].map(k => `<div class="opt ${k === q.correctAnswer ? 'ok' : ''}">
          <span class="optk">${k}</span><span>${esc(q.choices[k])}</span>
          ${k === q.correctAnswer ? '<b class="tick">正解</b>' : ''}</div>`).join('')}
        <div class="lbl">最新の回答結果</div>
        <div class="qtext">${latest ? `${STATUS_LABEL[r.status]}(${when(latest.answeredAt)}・${esc(chosen(q, latest))})` : '未回答'}</div>
        <div class="lbl">回答履歴(${hs.length}回・正解${r.correct}回)</div>
        ${hs.length === 0 ? '<div class="muted tiny">まだ回答していません</div>'
          : hs.slice(0, 20).map(h => `<div class="hrow"><span>${when(h.answeredAt)}</span>
              <span class="grow">${esc(chosen(q, h))}</span>
              <b class="${h.isCorrect ? 'okc' : 'ngc'}">${h.isCorrect ? '○' : '×'}</b></div>`).join('')}
        ${hs.length > 20 ? `<div class="muted tiny">ほか${hs.length - 20}件</div>` : ''}
        <div class="row">${r.question
          ? `<button class="link" data-open="${r.question.id}">学習内容を開く ›</button>`
          : `<button class="link" data-edit="${q.id}">問題を編集 ›</button>`}</div>
      </div>
    </details>`;
  }

  function renderList() {
    const hit = Learn.filterQuizzes(rows, { status: QView.status, stars: QView.star });
    $('#count').textContent = `${hit.length}件 / 全${rows.length}件`;
    $('#list').innerHTML = hit.length === 0
      ? `<div class="card muted center">${Frog.img('worry', 'face', 80)}<div>${rows.length === 0 ? 'まだ問題がありません' : '該当する問題がありません'}</div></div>`
      : hit.map(rowHtml).join('');
  }

  $('#back').onclick = () => App.back();
  $('#sf').onclick = e => { if (e.target.dataset.v) { QView.status = e.target.dataset.v; renderFilters(); renderList(); } };
  $('#stf').onclick = e => {
    const v = e.target.dataset.v;
    if (v !== undefined) { QView.star = v === 'all' ? 'all' : Number(v); renderFilters(); renderList(); }
  };
  $('#list').onclick = e => {
    if (e.target.dataset.open) App.open(Screens.noteDetail, { questionId: e.target.dataset.open });
    if (e.target.dataset.edit) App.open(Screens.quizEdit, { quizId: e.target.dataset.edit });
  };
  renderFilters(); renderList();
  return root;
};
