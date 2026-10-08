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

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 1800);
}

function fmtDate(iso) { return new Date(iso).toLocaleDateString('ja-JP'); }
