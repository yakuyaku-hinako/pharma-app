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
  }
};
