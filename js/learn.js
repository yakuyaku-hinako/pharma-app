// 理解度フィルターの選択肢(学習記録・問題一覧で共通): 0=未設定 / 1〜3=★の数
const STAR_FILTERS = [['all', 'すべて'], [0, '未設定(0)'], [1, '★1'], [2, '★2'], [3, '★3']];
// 出題ロジックと、画面で使うデータのまとめ読み込み
const QuizSelector = {
  // 新規を優先して n 問選び、足りなければ復習で補充。出題順はランダム。
  // items: [{ id, isNew }]
  pick(items, n = 5, rng = Math.random) {
    const shuffle = a => {
      const x = [...a];
      for (let i = x.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [x[i], x[j]] = [x[j], x[i]];
      }
      return x;
    };
    const fresh = shuffle(items.filter(i => i.isNew));
    const review = shuffle(items.filter(i => !i.isNew));
    return shuffle([...fresh, ...review].slice(0, n));
  }
};

const Learn = {
  // 問題ごとに「ノート・疑問・カテゴリ・回答履歴・新規かどうか」をまとめて返す
  async load() {
    const [quizzes, histories, notes, questions, cats] = await Promise.all(
      ['quizzes', 'histories', 'notes', 'questions', 'categories'].map(s => DB.getAll(s)));
    const byId = a => Object.fromEntries(a.map(x => [x.id, x]));
    const noteM = byId(notes), qM = byId(questions), cM = byId(cats);
    const hBy = {};
    histories.forEach(h => (hBy[h.quizId] ||= []).push(h));
    const catOfQuiz = {};
    const items = quizzes.map(quiz => {
      const note = noteM[quiz.noteId] || null;          // null = 情報源なし
      const question = note ? qM[note.questionId] || null : null;
      const category = question ? cM[question.categoryId] || null : null;
      if (category) catOfQuiz[quiz.id] = category.id;
      const hs = hBy[quiz.id] || [];
      return { quiz, note, question, category, histories: hs, isNew: Stats.isNew(hs) };
    });
    return { items, histories, cats, catOfQuiz };
  },
  // ノート単位の一覧(学習記録画面用)。情報源なしの問題は orphans に分ける
  async loadNotes() {
    const d = await Learn.load();
    const [notes, questions] = await Promise.all([DB.getAll('notes'), DB.getAll('questions')]);
    const qM = Object.fromEntries(questions.map(q => [q.id, q]));
    const cM = Object.fromEntries(d.cats.map(c => [c.id, c]));
    const entries = notes.filter(n => qM[n.questionId]).map(note => {
      const question = qM[note.questionId];
      const quizItems = d.items.filter(i => i.quiz.noteId === note.id);
      const hs = quizItems.flatMap(i => i.histories);
      const correct = hs.filter(h => h.isCorrect).length;
      const last = hs.length ? hs.map(h => h.answeredAt).sort().pop() : null;
      return { note, question, category: cM[question.categoryId] || null, quizItems,
               total: hs.length, correct, stars: Stats.stars(correct, hs.length), last };
    }).sort((a, b) => b.note.updatedAt.localeCompare(a.note.updatedAt));
    return { entries, orphans: d.items.filter(i => !i.note), cats: d.cats };
  },

  // 検索: 疑問・調べた内容・自分の回答・タグ。空白区切りは AND。全角/半角・大小文字は区別しない
  matches(entry, query) {
    const norm = t => String(t || '').normalize('NFKC').toLowerCase();
    const hay = norm([entry.question.content, entry.note.researchedContent,
      entry.note.myAnswer, ...(entry.question.tags || [])].join('\n'));
    return norm(query).split(/\s+/).filter(Boolean).every(w => hay.includes(w));
  },

  // 理解度フィルター: f は 'all' または 0〜3
  starOk(stars, f) { return f === 'all' || stars === f; },

  // 問題1件を一覧用に整形(最新の回答結果・正答数・理解度★)。データは変更しない
  quizRow(item) {
    const hs = item.histories;
    const correct = hs.filter(h => h.isCorrect).length;
    return { ...item, status: Stats.lastResult(hs), correct, total: hs.length,
             stars: Stats.stars(correct, hs.length) };
  },

  // 回答状況('all'/'none'/'correct'/'wrong')と理解度の併用フィルター
  filterQuizzes(rows, { status = 'all', stars = 'all' } = {}) {
    return rows.filter(r => (status === 'all' || r.status === status) && Learn.starOk(r.stars, stars));
  }
};
