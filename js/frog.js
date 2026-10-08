// カエルのキャラクター(frog/face/ = 顔だけ、frog/body/ = 全身)
// 表情: joy 喜 / angry 怒 / sad 哀 / fun 楽 / surprise 驚き / fight がんばる / shy 照れる / worry 困る・悩む / understand 理解した
const Frog = {
  NAMES: ['joy', 'angry', 'sad', 'fun', 'surprise', 'fight', 'shy', 'worry', 'understand'],
  src(name, kind = 'face') { return `frog/${kind}/${name}.svg`; },
  // <img> のHTMLを返す。px は横幅(高さは自動)
  img(name, kind = 'face', px = 96) {
    if (!Frog.NAMES.includes(name)) name = 'joy';
    return `<img class="fg" src="${Frog.src(name, kind)}" width="${px}" alt="" aria-hidden="true">`;
  }
};
