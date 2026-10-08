// 学習内容登録(疑問 → 調べた内容・自分の回答・薬剤師POINT)
// 保存すると疑問は「調査済み」になり、未調査一覧から消える。保存済みなら編集画面として使える。
Screens.note = async function ({ questionId }) {
  const q = await DB.get('questions', questionId);
  if (!q) return node('<div class="card muted">疑問が見つかりません</div>');
  const cat = await DB.get('categories', q.categoryId);
  const note = (await DB.getAll('notes')).find(n => n.questionId === questionId);

  const root = node(`
    <div class="topbar"><button class="back" id="back">‹ 戻る</button><h1>学習内容を登録</h1></div>
    <div class="card">
      <div class="meta"><span class="badge">${esc(cat ? cat.name : '')}</span></div>
      <div class="lbl">疑問</div>
      <div class="qtext">${esc(q.content)}</div>
    </div>
    <div class="card">
      <div class="lbl">調べた内容 <b class="req">*</b></div>
      <textarea id="rc" rows="7" maxlength="1000">${esc(note?.researchedContent)}</textarea>
      <div class="counter"><span id="rcn">0</span>/1000</div>
      <div class="lbl">自分の回答</div>
      <textarea id="ma" rows="4" maxlength="500">${esc(note?.myAnswer)}</textarea>
      <div class="counter"><span id="man">0</span>/500</div>
      <div class="lbl">薬剤師POINT</div>
      <textarea id="pp" rows="3">${esc(note?.pharmacistPoint)}</textarea>
      <button class="btn" id="save">保存する</button>
    </div>`);

  const $ = s => root.querySelector(s);
  const count = (ta, out) => {
    const upd = () => { $(out).textContent = $(ta).value.length; };
    $(ta).addEventListener('input', upd); upd();
  };
  count('#rc', '#rcn'); count('#ma', '#man');

  $('#back').addEventListener('click', () => App.back());
  $('#save').addEventListener('click', async () => {
    const researchedContent = $('#rc').value.trim();
    if (!researchedContent) return toast('調べた内容を入力してください');
    await DB.saveNote(questionId, {
      researchedContent,
      myAnswer: $('#ma').value.trim(),
      pharmacistPoint: $('#pp').value.trim()
    });
    toast('学習ノートを保存しました');
    App.back();
  });
  return root;
};
