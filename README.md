# 🐱 Мяу Башня / Meow Tower

Пиксельная игра в духе Tiny Tower: отель для котов. Telegram Mini App и приложение для iPhone.

- Игра: `index.html`, `style.css`, `js/`, `assets/`
- Сохранения в Telegram хранятся в облаке Telegram (CloudStorage), вне Telegram — в браузере.
- Опубликовано через GitHub Pages.

## Свой сервер (на потом)
Папка `server/` — сервер на Node.js без зависимостей: вход по подписи Telegram и сохранения игроков.
Нужен для платных функций. Как выложить на VPS — `server/DEPLOY.md`. Токен бота хранится только на сервере, в `server/.env`.

## Приложение для iPhone
Игра упаковывается в приложение через Capacitor: проект Xcode — в папке `ios/`, настройки — `capacitor.config.json`.
Как собрать на Маке — `IOS.md`. Страницы для App Store: `privacy.html`, `support.html`.
