// 画面の切り替え(タブ + 戻れる子画面)
const TITLES = { home: 'ホーム', database: 'データベース', stats: '成績' };

// まだ作っていない画面は仮表示
for (const t of Object.keys(TITLES)) {
  Screens[t] = async () =>
    node(`<h1>${TITLES[t]}</h1><div class="card muted">${TITLES[t]}画面(実装予定)</div>`);
}

const App = {
  tab: 'home',
  stack: [],
  async show() {
    const top = this.stack[this.stack.length - 1];
    const view = await (top ? top.fn(top.params) : Screens[this.tab]());
    const screen = document.getElementById('screen');
    screen.replaceChildren(view);
    document.querySelectorAll('#tabbar button').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === this.tab));
    window.scrollTo(0, 0);
  },
  switchTab(t) { this.tab = t; this.stack = []; return this.show(); },
  open(fn, params) { this.stack.push({ fn, params }); return this.show(); },
  back() { this.stack.pop(); return this.show(); }
};

document.querySelectorAll('#tabbar button').forEach(b =>
  b.addEventListener('click', () => App.switchTab(b.dataset.tab)));

(async () => {
  await DB.open();
  await DB.seedIfNeeded();
  await App.show();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
})();
