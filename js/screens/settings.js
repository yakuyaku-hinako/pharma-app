// 設定: バックアップ(JSON書き出し)と復元
Screens.settings = async function () {
  const counts = {};
  for (const s of Backup.STORES) counts[s] = (await DB.getAll(s)).length;
  const last = Backup.lastDate();
  const root = node(`
    <div class="topbar"><button class="back" id="back">‹ 戻る</button><h1>設定・バックアップ</h1></div>
    <div class="card warn">⚠ データはこのiPhoneの中だけに保存されています。ホーム画面のアイコンを削除したり、
      Safariのサイトデータを消したり、機種変更をすると失われます。<b>定期的にバックアップしてください。</b></div>
    <div class="card">
      <div class="lbl">バックアップ</div>
      <div class="muted tiny">疑問 ${counts.questions}件 / ノート ${counts.notes}件 / 問題 ${counts.quizzes}件 / 回答履歴 ${counts.histories}件</div>
      <div class="muted tiny">最終バックアップ:${last ? fmtDate(last) : '未実施'}</div>
      <button class="btn" id="share">ファイルに保存(共有)</button>
      <button class="btn ghost" id="copy">テキストをコピー</button>
      <div class="muted tiny" style="margin-top:8px">「ファイルに保存」で「ファイルに保存」やAirDrop、メールを選べます。うまくいかないときは「テキストをコピー」して、メモアプリなどに貼り付けて保管してください。</div>
    </div>
    <div class="card">
      <div class="lbl">復元</div>
      <label class="radiorow"><input type="radio" name="mode" value="merge" checked> 追加する(今あるデータは残し、重複はスキップ)</label>
      <label class="radiorow"><input type="radio" name="mode" value="replace"> 置き換える(今のデータをすべて消して復元)</label>
      <input type="file" id="file" accept=".json,application/json,text/plain">
      <button class="btn ghost" id="restore">復元する</button>
    </div>`);
  const $ = s => root.querySelector(s);
  $('#back').onclick = () => App.back();

  $('#share').onclick = async () => {
    const text = JSON.stringify(await Backup.export(), null, 2);
    const d = new Date(), p = n => String(n).padStart(2, '0');
    const name = `pharma-backup-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`;
    const file = new File([text], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: name }); Backup.markDone(); toast('保存しました'); App.show(); return; }
      catch (e) { if (e.name === 'AbortError') return; }     // キャンセルは何もしない
    }
    const a = document.createElement('a');                    // 共有できない環境ではダウンロード
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    Backup.markDone(); toast('ダウンロードしました');
  };

  $('#copy').onclick = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(await Backup.export()));
      Backup.markDone(); toast('コピーしました。メモなどに貼り付けて保管してください'); App.show();
    } catch { toast('コピーできませんでした'); }
  };

  $('#restore').onclick = async () => {
    const f = $('#file').files[0];
    if (!f) return toast('バックアップファイルを選んでください');
    let data;
    try { data = JSON.parse(await f.text()); Backup.validate(data); }
    catch (e) { return toast(e instanceof SyntaxError ? 'ファイルを読み込めませんでした' : e.message); }
    const mode = root.querySelector('input[name=mode]:checked').value;
    const msg = mode === 'replace'
      ? `今のデータをすべて消して、バックアップ(疑問${data.questions.length}件・問題${data.quizzes.length}件)に置き換えます。よろしいですか?`
      : `バックアップ(疑問${data.questions.length}件・問題${data.quizzes.length}件)を追加します。よろしいですか?`;
    if (!confirm(msg)) return;
    try {
      const a = await Backup.import(data, mode);
      toast(`復元しました(疑問${a.questions}件・問題${a.quizzes}件)`);
      App.show();
    } catch (e) { toast('復元に失敗しました: ' + e.message); }
  };
  return root;
};
