// JSONバックアップ(書き出し・復元)
const Backup = {
  STORES: ['categories', 'questions', 'notes', 'quizzes', 'histories'],
  KEY: 'pharma-last-backup',

  async export() {
    const o = { app: 'pharma-app', schemaVersion: 1, exportedAt: new Date().toISOString() };
    for (const s of Backup.STORES) o[s] = await DB.getAll(s);
    return o;
  },

  validate(o) {
    if (!o || o.app !== 'pharma-app') throw new Error('このアプリのバックアップファイルではありません');
    if (o.schemaVersion > 1) throw new Error('新しい形式のバックアップです。アプリを更新してください');
    for (const s of Backup.STORES) {
      if (!Array.isArray(o[s])) throw new Error(`バックアップの中身が不正です(${s})`);
      if (o[s].some(r => !r || !r.id)) throw new Error(`バックアップの中身が不正です(${s})`);
    }
  },

  // mode: 'merge' = 既存を残して追加(同じidはスキップ) / 'replace' = 全置き換え
  async import(o, mode = 'merge') {
    Backup.validate(o);                       // 先に検査(不正なら何も変更しない)
    const added = {};
    if (mode === 'replace') {
      for (const s of Backup.STORES) await DB.clear(s);
      for (const s of Backup.STORES) { for (const r of o[s]) await DB.put(s, r); added[s] = o[s].length; }
      await DB.seedIfNeeded();
      return added;
    }
    // 追加: カテゴリは名前で突き合わせる(端末ごとに初期カテゴリのidが違うため)
    const idMap = {};
    const catByName = Object.fromEntries((await DB.getAll('categories')).map(c => [c.name, c]));
    const existing = {};
    for (const s of Backup.STORES) existing[s] = new Set((await DB.getAll(s)).map(r => r.id));
    added.categories = 0;
    for (const c of o.categories) {
      if (existing.categories.has(c.id)) continue;
      if (catByName[c.name]) { idMap[c.id] = catByName[c.name].id; continue; }
      await DB.put('categories', c); added.categories++;
    }
    for (const s of ['questions', 'notes', 'quizzes', 'histories']) {
      added[s] = 0;
      for (const r of o[s]) {
        if (existing[s].has(r.id)) continue;
        await DB.put(s, s === 'questions' && idMap[r.categoryId] ? { ...r, categoryId: idMap[r.categoryId] } : r);
        added[s]++;
      }
    }
    return added;
  },

  // 学習データ(疑問・ノート・問題・回答履歴)をすべて削除して初期状態に戻す。
  // カテゴリ(初期の3種)、最終バックアップ日などの設定、テーマ、カエルは消さない。
  DATA_STORES: ['histories', 'quizzes', 'notes', 'questions'],
  async resetAll(clearIntroFlag = true) {
    await DB.clearMany(Backup.DATA_STORES);             // 1回の処理で削除(失敗したら何も消えない)
    for (const s of Backup.DATA_STORES) {               // 本当に空になったか確認
      if ((await DB.getAll(s)).length > 0) throw new Error('削除を確認できませんでした(' + s + ')');
    }
    await DB.seedIfNeeded();
    if (clearIntroFlag) { try { localStorage.removeItem('pharma-intro-seen'); } catch {} }  // 初回の案内を再表示
  },

  lastDate() {
    try { const v = localStorage.getItem(Backup.KEY); return v ? Number(v) : null; } catch { return null; }
  },
  markDone() { try { localStorage.setItem(Backup.KEY, String(Date.now())); } catch {} }
};
