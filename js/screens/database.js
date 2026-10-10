// 学習記録(旧データベース): 検索・カテゴリと理解度(★)の絞り込み
const DBView = { q: '', cat: 'all', star: 'all' };   // 詳細から戻っても検索条件を保つ
const starText = n => '★'.repeat(n) + '☆'.repeat(3 - n);

Screens.database = async function () {
  const { entries, orphans, cats } = await Learn.loadNotes();
  const sorted = [...cats].sort((a, b) => a.sortOrder - b.sortOrder);
  const root = node(`
    <h1>学習記録</h1>
    <input id="q" type="search" placeholder="キーワードで検索(例:NSAIDs)" value="${esc(DBView.q)}">
    <div class="chips filter" id="filter"></div>
    <div class="lbl tiny">理解度</div>
    <div class="chips filter" id="sfilter"></div>
    <div id="list"></div>
    <div id="orphans"></div>`);
  const $ = s => root.querySelector(s);

  function renderFilter() {
    $('#filter').innerHTML = [{ id: 'all', name: 'すべて' }, ...sorted].map(c =>
      `<button type="button" class="chip pill ${DBView.cat === c.id ? 'on' : ''}" data-c="${c.id}">${esc(c.name)}</button>`).join('');
  }

  function renderStarFilter() {
    $('#sfilter').innerHTML = STAR_FILTERS.map(([v, name]) =>
      `<button type="button" class="chip pill ${DBView.star === v ? 'on' : ''}" data-s="${v}">${name}</button>`).join('');
  }

  function renderList() {
    const hit = entries.filter(e =>
      (DBView.cat === 'all' || e.question.categoryId === DBView.cat) && Learn.starOk(e.stars, DBView.star)
      && Learn.matches(e, DBView.q));
    $('#list').innerHTML = hit.length === 0
      ? `<div class="card muted center">${Frog.img('worry', 'face', 80)}<div>${entries.length === 0 ? 'まだ学習内容がありません' : '該当する学習内容がありません'}</div></div>`
      : hit.map(e => `
        <div class="card tap" data-id="${e.question.id}">
          <div class="meta"><span class="badge">${esc(e.category?.name || '')}</span>
            <span class="muted tiny">問題 ${e.quizItems.length}件</span></div>
          <div class="qtext">${esc(e.question.content)}</div>
          <div class="chips">${e.question.tags.map(t => `<span class="chip">#${esc(t)}</span>`).join('')}</div>
          <div class="row"><span class="muted tiny">最終復習:${e.last ? fmtDate(e.last) : '未回答'}</span>
            <span class="stars">理解度 ${starText(e.stars)}</span></div>
        </div>`).join('');
  }

  function renderOrphans() {
    const show = orphans.length > 0 && DBView.cat === 'all' && DBView.star === 'all' && !DBView.q.trim();
    $('#orphans').innerHTML = !show ? '' : `
      <details class="card"><summary>情報源なしの問題(${orphans.length}件)</summary>
        ${orphans.map(i => `
          <div class="qrow">
            <div class="qtext">${esc(i.quiz.questionText)}</div>
            <div class="row"><button class="link" data-edit="${i.quiz.id}">編集</button>
              <button class="link danger" data-del="${i.quiz.id}">削除</button></div>
          </div>`).join('')}
      </details>`;
  }
  const refresh = () => { renderFilter(); renderStarFilter(); renderList(); renderOrphans(); };

  $('#q').addEventListener('input', e => { DBView.q = e.target.value; renderList(); renderOrphans(); });
  $('#filter').addEventListener('click', e => {
    if (e.target.dataset.c) { DBView.cat = e.target.dataset.c; refresh(); }
  });
  $('#sfilter').addEventListener('click', e => {
    const v = e.target.dataset.s;
    if (v !== undefined) { DBView.star = v === 'all' ? 'all' : Number(v); refresh(); }
  });
  $('#list').addEventListener('click', e => {
    const card = e.target.closest('.tap');
    if (card) App.open(Screens.noteDetail, { questionId: card.dataset.id });
  });
  $('#orphans').addEventListener('click', async e => {
    if (e.target.dataset.edit) return App.open(Screens.quizEdit, { quizId: e.target.dataset.edit });
    if (e.target.dataset.del && confirm('この問題を削除しますか?回答履歴も削除されます。')) {
      await DB.deleteQuiz(e.target.dataset.del);
      App.show();
    }
  });

  refresh();
  return root;
};
