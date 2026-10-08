// 学習内容詳細: ノート全文 + 紐づく問題の一覧(追加・編集・削除)
Screens.noteDetail = async function ({ questionId }) {
  const { entries } = await Learn.loadNotes();
  const e = entries.find(x => x.question.id === questionId);
  if (!e) {
    const r = node('<div class="topbar"><button class="back" id="b">‹ 戻る</button></div><div class="card muted">学習内容が見つかりません</div>');
    r.querySelector('#b').onclick = () => App.back();
    return r;
  }

  const n = e.note;
  const root = node(`
    <div class="topbar"><button class="back" id="back">‹ 戻る</button><h1>学習内容</h1></div>
    <div class="card">
      <div class="meta"><span class="badge">${esc(e.category?.name || '')}</span>
        <span class="stars">${starText(e.stars)}</span>
        <span class="muted tiny">回答 ${e.total}回</span></div>
      <div class="chips">${e.question.tags.map(t => `<span class="chip">#${esc(t)}</span>`).join('')}</div>
      <div class="lbl">疑問</div><div class="qtext">${esc(e.question.content)}</div>
      <div class="lbl">調べた内容</div><div class="qtext">${esc(n.researchedContent)}</div>
      <div class="lbl">自分の回答</div><div class="qtext">${esc(n.myAnswer) || '—'}</div>
      <div class="lbl">薬剤師POINT</div><div class="qtext">${esc(n.pharmacistPoint) || '—'}</div>
      <div class="row"><button class="link" id="editNote">ノートを編集</button>
        <button class="link danger" id="delNote">ノートを削除</button></div>
    </div>
    <h2>問題(${e.quizItems.length}件)</h2>
    <div id="quizzes">${e.quizItems.length === 0 ? '<div class="card muted">まだ問題がありません</div>'
      : e.quizItems.map((i, k) => {
        const ok = i.histories.filter(h => h.isCorrect).length;
        return `<div class="card">
          <div class="muted tiny">問題${k + 1} ・ 正答 ${ok}/${i.histories.length}回</div>
          <div class="qtext">${esc(i.quiz.questionText)}</div>
          <div class="muted tiny">正解:${i.quiz.correctAnswer} ${esc(i.quiz.choices[i.quiz.correctAnswer])}</div>
          <div class="row"><button class="link" data-edit="${i.quiz.id}">編集</button>
            <button class="link danger" data-del="${i.quiz.id}">削除</button></div></div>`;
      }).join('')}</div>
    <button class="btn" id="addQuiz">＋ この学習内容から問題を作る</button>`);

  const $ = s => root.querySelector(s);
  $('#back').onclick = () => App.back();
  $('#editNote').onclick = () => App.open(Screens.note, { questionId });
  $('#addQuiz').onclick = () => App.open(Screens.quizEdit, { noteId: n.id });
  $('#delNote').onclick = async () => {
    if (!confirm('この疑問とノートを削除しますか?\n作成した問題は残り、「情報源なし」と表示されます。')) return;
    await DB.deleteQuestion(questionId);
    toast('削除しました');
    App.back();
  };
  $('#quizzes').addEventListener('click', async ev => {
    if (ev.target.dataset.edit) return App.open(Screens.quizEdit, { quizId: ev.target.dataset.edit });
    if (ev.target.dataset.del && confirm('この問題を削除しますか?回答履歴も削除されます。')) {
      await DB.deleteQuiz(ev.target.dataset.del);
      App.show();
    }
  });
  return root;
};
