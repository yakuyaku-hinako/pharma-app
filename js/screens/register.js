// 登録タブ: 疑問登録フォーム + 未調査の疑問一覧
Screens.register = async function () {
  const cats = (await DB.getAll('categories')).sort((a, b) => a.sortOrder - b.sortOrder);
  const catName = Object.fromEntries(cats.map(c => [c.id, c.name]));
  let catId = null;
  let tags = [];

  const root = node(`
    <h1>疑問を登録</h1>
    <div class="card">
      <div class="lbl">カテゴリー <b class="req">*</b></div>
      <div class="cats">${cats.map(c =>
        `<button type="button" class="cat" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>
      <div class="lbl">疑問の内容 <b class="req">*</b></div>
      <textarea id="qc" rows="4" maxlength="${200}" placeholder="例:DOACとNSAIDsを併用するとき何に注意?"></textarea>
      <div class="counter"><span id="qcn">0</span>/200</div>
      <div class="lbl">タグ(任意)</div>
      <div class="tagrow">
        <input id="tin" placeholder="例:相互作用">
        <button type="button" id="tadd" class="small">追加</button>
      </div>
      <div id="tags" class="chips"></div>
      <button class="btn" id="save">保存する</button>
    </div>
    <h2>未調査の疑問 <span id="cnt" class="muted"></span></h2>
    <div id="list"></div>`);

  const $ = s => root.querySelector(s);

  function renderTags() {
    $('#tags').innerHTML = tags.map((t, i) =>
      `<span class="chip">#${esc(t)} <button type="button" data-i="${i}" aria-label="削除">×</button></span>`).join('');
  }
  function addTag() {
    const t = $('#tin').value.trim().replace(/^[#＃]/, '');
    if (t && !tags.includes(t)) tags.push(t);
    $('#tin').value = '';
    renderTags();
  }

  async function renderList() {
    const qs = (await DB.getAll('questions'))
      .filter(q => q.status === '未調査')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    $('#cnt').textContent = `${qs.length}件`;
    $('#list').innerHTML = qs.length === 0
      ? '<div class="card muted">未調査の疑問はありません</div>'
      : qs.map(q => `
        <div class="card tap" data-id="${q.id}">
          <div class="meta"><span class="badge">${esc(catName[q.categoryId] || '')}</span>
            <span class="muted">${fmtDate(q.createdAt)}</span></div>
          <div class="qtext">${esc(q.content)}</div>
          <div class="chips">${q.tags.map(t => `<span class="chip">#${esc(t)}</span>`).join('')}</div>
          <div class="row">
            <button type="button" class="link danger" data-del="${q.id}">削除</button>
            <span class="go">調べて登録 ›</span>
          </div>
        </div>`).join('');
  }

  root.querySelectorAll('.cat').forEach(b => b.addEventListener('click', () => {
    catId = b.dataset.id;
    root.querySelectorAll('.cat').forEach(x => x.classList.toggle('on', x === b));
  }));
  $('#qc').addEventListener('input', e => { $('#qcn').textContent = e.target.value.length; });
  $('#tadd').addEventListener('click', addTag);
  $('#tin').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } });
  $('#tags').addEventListener('click', e => {
    const i = e.target.dataset.i;
    if (i !== undefined) { tags.splice(Number(i), 1); renderTags(); }
  });

  $('#save').addEventListener('click', async () => {
    addTag(); // 入力途中のタグも取り込む
    const content = $('#qc').value.trim();
    if (!catId) return toast('カテゴリーを選んでください');
    if (!content) return toast('疑問の内容を入力してください');
    await DB.addQuestion({ categoryId: catId, content, tags });
    $('#qc').value = ''; $('#qcn').textContent = '0';
    tags = []; renderTags();
    toast('未調査の一覧に追加しました');
    await renderList();
  });

  $('#list').addEventListener('click', async e => {
    const del = e.target.dataset.del;
    if (del) {
      if (confirm('この疑問を削除しますか?')) { await DB.deleteQuestion(del); await renderList(); }
      return;
    }
    const card = e.target.closest('.tap');
    if (card) App.open(Screens.note, { questionId: card.dataset.id });
  });

  await renderList();
  return root;
};
