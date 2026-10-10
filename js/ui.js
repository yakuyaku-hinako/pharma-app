// 画面づくりの共通部品
const Screens = {};

// 文字を安全に表示する(入力文字をHTMLとして解釈させない)
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// HTML文字列から画面の部品を作る
function node(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d;
}

function toast(msg, frog) {
  const t = document.createElement('div');
  t.className = 'toast';
  if (frog) {                                   // 第2引数にカエルの表情名を渡すと顔つきで表示
    t.innerHTML = Frog.img(frog, 'face', 34);
    const sp = document.createElement('span'); sp.textContent = msg; t.append(sp);
  } else t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), frog ? 2600 : 1800);
}

function fmtDate(iso) { return new Date(iso).toLocaleDateString('ja-JP'); }

// アプリ内の確認画面。OKなら true、キャンセル(外側をタップも含む)なら false を返す
function confirmDialog({ title, body, okLabel = 'OK', cancelLabel = 'キャンセル', danger = false, frog = null }) {
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = `<div class="dialog" role="dialog" aria-modal="true">
      ${frog ? `<div class="center">${Frog.img(frog, 'body', 72)}</div>` : ''}
      <h3></h3><div class="dbody"></div>
      <div class="dbtns"><button class="btn ghost" data-r="0"></button>
        <button class="btn ${danger ? 'dangerbtn' : ''}" data-r="1"></button></div></div>`;
    wrap.querySelector('h3').textContent = title;
    wrap.querySelector('.dbody').textContent = body;
    wrap.querySelector('[data-r="0"]').textContent = cancelLabel;
    wrap.querySelector('[data-r="1"]').textContent = okLabel;
    const done = v => { wrap.remove(); resolve(v); };
    wrap.addEventListener('click', e => {
      const r = e.target.dataset && e.target.dataset.r;
      if (r !== undefined) done(r === '1'); else if (e.target === wrap) done(false);
    });
    document.body.append(wrap);
  });
}
