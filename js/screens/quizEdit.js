// 問題作成・編集(4択を自分で作る)。登録前に必ず確認プレビューを経由する。
// 選択肢はA〜Dの4つ(正解1+ダミー3)。「まだ不安」はアプリが末尾に自動で追加する。
Screens.quizEdit = async function ({ noteId, quizId }) {
  const quiz = quizId ? await DB.get('quizzes', quizId) : null;
  const srcNoteId = quiz ? quiz.noteId : noteId;
  const note = srcNoteId ? await DB.get('notes', srcNoteId) : null;
  const question = note ? await DB.get('questions', note.questionId) : null;
  if (!quiz && !note) return node('<div class="card muted">ノートが見つかりません</div>');

  const K = ['A', 'B', 'C', 'D'];
  const s = {
    mode: 'form',                       // form → preview → done
    text: quiz?.questionText || '',
    choices: { A: '', B: '', C: '', D: '', ...(quiz?.choices || {}) },
    correct: quiz?.correctAnswer || null,
    explanation: quiz?.explanation || '',
    point: quiz?.pharmacistPoint || ''
  };
  const root = document.createElement('div');

  const source = note ? `
    <details class="card src">
      <summary>情報源のノートを見る</summary>
      <div class="lbl">疑問</div><div class="qtext">${esc(question?.content)}</div>
      <div class="lbl">調べた内容</div><div class="qtext">${esc(note.researchedContent)}</div>
      <div class="lbl">自分の回答</div><div class="qtext">${esc(note.myAnswer) || '—'}</div>
    </details>` : '<div class="card muted">情報源なし</div>';

  function formView() {
    root.innerHTML = `
      <div class="topbar"><button class="back" id="back">‹ 戻る</button><h1>${quiz ? '問題を編集' : '問題を作成'}</h1></div>
      ${source}
      <div class="card">
        <div class="lbl">問題文 <b class="req">*</b></div>
        <textarea id="qt" rows="3" placeholder="例:DOAC服用患者にNSAIDsが処方された。特に確認すべきことは?">${esc(s.text)}</textarea>
        <div class="lbl">選択肢 <b class="req">*</b> <span class="muted note">正解の○を選び、ダミーは一見もっともらしい内容に</span></div>
        ${K.map(k => `
          <div class="opt-edit">
            <label class="radio"><input type="radio" name="ans" value="${k}" ${s.correct === k ? 'checked' : ''}>
              <span class="optk">${k}</span><span class="muted tiny">正解</span></label>
            <textarea data-k="${k}" rows="2">${esc(s.choices[k])}</textarea>
          </div>`).join('')}
        <div class="lbl">解説</div>
        <textarea id="ex" rows="3">${esc(s.explanation)}</textarea>
        <div class="lbl">薬剤師POINT</div>
        <textarea id="pp" rows="2">${esc(s.point)}</textarea>
        <button class="btn" id="preview">確認する</button>
      </div>`;
    const $ = q => root.querySelector(q);
    $('#back').onclick = () => App.back();
    $('#qt').oninput = e => { s.text = e.target.value; };
    $('#ex').oninput = e => { s.explanation = e.target.value; };
    $('#pp').oninput = e => { s.point = e.target.value; };
    root.querySelectorAll('textarea[data-k]').forEach(t =>
      t.oninput = e => { s.choices[t.dataset.k] = e.target.value; });
    root.querySelectorAll('input[name=ans]').forEach(r =>
      r.onchange = () => { s.correct = r.value; });
    $('#preview').onclick = () => {
      const vals = K.map(k => s.choices[k].trim());
      if (!s.text.trim()) return toast('問題文を入力してください');
      if (vals.some(v => !v)) return toast('選択肢A〜Dをすべて入力してください');
      if (new Set(vals).size < 4) return toast('同じ内容の選択肢があります');
      if (!s.correct) return toast('正解を選んでください');
      s.mode = 'preview'; render();
    };
  }

  function previewView() {
    root.innerHTML = `
      <div class="topbar"><h1>登録内容の確認</h1></div>
      <div class="card">
        <div class="qtext big">${esc(s.text)}</div>
        ${K.map(k => `<div class="opt ${s.correct === k ? 'ok' : ''}">
            <span class="optk">${k}</span><span>${esc(s.choices[k])}</span>
            ${s.correct === k ? '<b class="tick">正解</b>' : ''}</div>`).join('')}
        <div class="opt unsure"><span class="optk">E</span><span>まだ不安</span>
          <span class="muted tiny">自動追加</span></div>
        <div class="lbl">解説</div><div class="qtext">${esc(s.explanation) || '—'}</div>
        <div class="lbl">薬剤師POINT</div><div class="qtext">${esc(s.point) || '—'}</div>
      </div>
      <button class="btn" id="ok">この内容で登録する</button>
      <button class="btn ghost" id="edit">修正する</button>`;
    root.querySelector('#edit').onclick = () => { s.mode = 'form'; render(); };
    root.querySelector('#ok').onclick = async () => {
      const data = {
        questionText: s.text.trim(),
        choices: Object.fromEntries(K.map(k => [k, s.choices[k].trim()])),
        correctAnswer: s.correct,
        explanation: s.explanation.trim(),
        pharmacistPoint: s.point.trim()
      };
      try {
        if (quiz) await DB.updateQuiz(quiz.id, data);
        else await DB.addQuiz({ noteId: srcNoteId, ...data });
      } catch (e) { return toast(e.message); }
      toast(quiz ? '問題を更新しました' : '問題を登録しました');
      if (quiz) return App.back();
      s.mode = 'done'; render();
    };
  }

  function doneView() {
    root.innerHTML = `
      <div class="card center"><div class="bigicon">✅</div>
        <div class="qtext">問題を登録しました</div></div>
      <button class="btn" id="more">同じノートから続けて問題を作る</button>
      <button class="btn ghost" id="fin">完了</button>`;
    root.querySelector('#more').onclick = () => {
      Object.assign(s, { mode: 'form', text: '', choices: { A: '', B: '', C: '', D: '' },
                         correct: null, explanation: '', point: '' });
      render();
      window.scrollTo(0, 0);
    };
    root.querySelector('#fin').onclick = () => App.back();
  }

  function render() { ({ form: formView, preview: previewView, done: doneView })[s.mode](); }
  render();
  return root;
};
