// =====================================================
//  copy-web.js — собирает игру в папку www/ для приложения (iOS / Android)
//
//  Игра живёт в корне репозитория (так её видит GitHub Pages и Telegram),
//  а Capacitor берёт файлы из www/. Этот скрипт копирует туда только то,
//  что нужно игре, — без server/, node_modules/, ios/ и прочего.
//  Запуск: npm run build  (или npm run ios — соберёт и откроет Xcode)
// =====================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'www');
const ITEMS = ['index.html', 'style.css', 'js', 'assets'];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
for (const item of ITEMS) {
  fs.cpSync(path.join(ROOT, item), path.join(OUT, item), { recursive: true });
}
console.log('Игра скопирована в www/ ✔');
