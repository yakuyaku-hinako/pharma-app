// iPhone内(IndexedDB)への保存。ログイン・クラウド不要。
// 保存先: categories / questions / notes / quizzes / histories
const DB = (() => {
  const STORES = ['categories', 'questions', 'notes', 'quizzes', 'histories'];
  const INITIAL_CATEGORIES = ['保険・調剤報酬', '薬理学', '実務'];
  let db = null, dbName = null;

  const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
    : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
  const now = () => new Date().toISOString();

  function open(name = 'pharmacist-learning') {
    dbName = name;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(name, 1);
      req.onupgradeneeded = () =>
        STORES.forEach(s => req.result.createObjectStore(s, { keyPath: 'id' }));
      req.onsuccess = () => { db = req.result; resolve(db); };
      req.onerror = () => reject(req.error);
    });
  }
  function close() { if (db) db.close(); db = null; }
  function destroy() {
    close();
    return new Promise(res => {
      const r = indexedDB.deleteDatabase(dbName);
      r.onsuccess = r.onerror = r.onblocked = () => res();
    });
  }

  function run(store, mode, fn) {
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => resolve(req ? req.result : undefined);
      t.onerror = t.onabort = () => reject(t.error);
    });
  }
  const getAll = s => run(s, 'readonly', st => st.getAll());
  const get = (s, id) => run(s, 'readonly', st => st.get(id));
  const put = (s, obj) => run(s, 'readwrite', st => st.put(obj));
  const remove = (s, id) => run(s, 'readwrite', st => st.delete(id));
  const clear = s => run(s, 'readwrite', st => st.clear());
  // 複数の保管庫を1回の処理でまとめて消す(途中で失敗したら、何も消えない)
  const clearMany = stores => new Promise((resolve, reject) => {
    const t = db.transaction(stores, 'readwrite');
    stores.forEach(s => t.objectStore(s).clear());
    t.oncomplete = () => resolve();
    t.onerror = t.onabort = () => reject(t.error || new Error('削除に失敗しました'));
  });

  // ---- 初期データ ----
  async function seedIfNeeded() {
    if ((await getAll('categories')).length > 0) return;
    for (let i = 0; i < INITIAL_CATEGORIES.length; i++)
      await put('categories', { id: uuid(), name: INITIAL_CATEGORIES[i], sortOrder: i });
  }

  // ---- 疑問 ----
  async function addQuestion({ categoryId, content, tags = [] }) {
    if (!categoryId) throw new Error('カテゴリは必須です');
    if (!content || content.length > 200) throw new Error('疑問は1〜200字');
    const q = { id: uuid(), categoryId, content, tags, status: '未調査',
                createdAt: now(), updatedAt: now() };
    await put('questions', q);
    return q;
  }

  // ---- ノート(疑問1件につき1つ。保存すると「調査済み」になる) ----
  async function saveNote(questionId, { researchedContent = '', myAnswer = '', pharmacistPoint = '' }) {
    if (researchedContent.length > 1000) throw new Error('調べた内容は1000字まで');
    if (myAnswer.length > 500) throw new Error('自分の回答は500字まで');
    const q = await get('questions', questionId);
    if (!q) throw new Error('疑問が見つかりません');
    const existing = (await getAll('notes')).find(n => n.questionId === questionId);
    const note = existing
      ? { ...existing, researchedContent, myAnswer, pharmacistPoint, updatedAt: now() }
      : { id: uuid(), questionId, researchedContent, myAnswer, pharmacistPoint,
          createdAt: now(), updatedAt: now() };
    await put('notes', note);
    await put('questions', { ...q, status: '調査済み', updatedAt: now() });
    return note;
  }

  // ---- 問題(必ずノートから作る) ----
  async function addQuiz({ noteId, questionText, choices, correctAnswer, explanation = '', pharmacistPoint = '' }) {
    if (!noteId) throw new Error('問題はノートから作成します');
    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) throw new Error('正解はA〜D');
    if (!questionText || ['A', 'B', 'C', 'D'].some(k => !choices[k]))
      throw new Error('問題文と選択肢A〜Dをすべて入力してください');
    const quiz = { id: uuid(), noteId, questionText, choices, correctAnswer,
                   explanation, pharmacistPoint, createdAt: now(), updatedAt: now() };
    await put('quizzes', quiz);
    return quiz;
  }

  async function updateQuiz(id, { questionText, choices, correctAnswer, explanation = '', pharmacistPoint = '' }) {
    const quiz = await get('quizzes', id);
    if (!quiz) throw new Error('問題が見つかりません');
    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) throw new Error('正解はA〜D');
    if (!questionText || ['A', 'B', 'C', 'D'].some(k => !choices[k]))
      throw new Error('問題文と選択肢A〜Dをすべて入力してください');
    const next = { ...quiz, questionText, choices, correctAnswer, explanation,
                   pharmacistPoint, updatedAt: now() };
    await put('quizzes', next);
    return next;
  }

  // ---- 回答履歴(selected: A/B/C/D/unsure) ----
  async function answerQuiz(quizId, selected, at = new Date()) {
    const quiz = await get('quizzes', quizId);
    if (!quiz) throw new Error('問題が見つかりません');
    const h = { id: uuid(), quizId, selected,
                isCorrect: Stats.judge(selected, quiz.correctAnswer),
                answeredAt: at.toISOString() };
    await put('histories', h);
    return h;
  }

  // ---- 削除 ----
  // ノートを削除しても問題は残す(noteId を null にする → 「情報源なし」と表示)
  async function deleteNote(noteId) {
    for (const q of (await getAll('quizzes')).filter(q => q.noteId === noteId))
      await put('quizzes', { ...q, noteId: null });
    await remove('notes', noteId);
  }
  // 問題を削除したら、その回答履歴も削除
  async function deleteQuiz(quizId) {
    for (const h of (await getAll('histories')).filter(h => h.quizId === quizId))
      await remove('histories', h.id);
    await remove('quizzes', quizId);
  }
  // 疑問を削除したら、そのノートも削除(問題は残る)
  async function deleteQuestion(questionId) {
    for (const n of (await getAll('notes')).filter(n => n.questionId === questionId))
      await deleteNote(n.id);
    await remove('questions', questionId);
  }

  return { open, close, destroy, getAll, get, put, remove, clear, clearMany, uuid, seedIfNeeded,
           addQuestion, saveNote, addQuiz, updateQuiz, answerQuiz,
           deleteNote, deleteQuiz, deleteQuestion };
})();
