# 🐱 Мяу Башня — как выложить на сервер и подключить к боту

Адрес игры: **https://meow.friend-e.com**
Сервер: VPS с Ubuntu и Node.js 18+ (например, на Fornex).

```
/var/www/meow-tower/
├── public/   ← игра: index.html, style.css, js/, assets/ из корня репозитория
├── server/   ← сервер: вход через Telegram и облачные сохранения
│   ├── server.js
│   ├── .env.example   ← образец настроек
│   └── package.json
└── data/     ← появится сам: сохранения игроков (не удалять!)
```

> Сервер отдаёт файлы **только из папки `public/`**. Поэтому игру кладём туда,
> а не в корень: иначе браузер смог бы открыть `server/.env` с токеном.

> 🔁 Сервер включается в игре одной строкой: в `js/cloud.js` поставь
> `USE_SERVER = true`. Пока там `false`, сохранения живут в облаке Telegram.

> ⚠️ Токен бота живёт **только** на сервере, в файле `server/.env`.
> Не присылай его никому и не вставляй в файлы игры.

Делай по шагам. Если на каком-то шаге ошибка — пришли мне текст ошибки целиком.

---

## Шаг 1. Поддомен

1. Там, где зарегистрирован домен **friend-e.com** → DNS → **Add New Record**.
2. Type: **A**, Name: **meow**, Value: **IP твоего VPS**, TTL: по умолчанию.
3. Сохрани. Обычно начинает работать за 5–30 минут.

Проверка (в терминале на Mac): `ping meow.friend-e.com` — должен показать IP VPS.

---

## Шаг 2. Залить на VPS

На сервере (`ssh root@IP_СЕРВЕРА`):

```bash
cd /var/www
git clone https://github.com/6554556-code/meow-tower.git meow-tower-src
mkdir -p meow-tower/public
cp -r meow-tower-src/server meow-tower/
cp -r meow-tower-src/index.html meow-tower-src/style.css meow-tower-src/js meow-tower-src/assets meow-tower/public/
```

Получится `/var/www/meow-tower/public` (игра) и `/var/www/meow-tower/server` (сервер).

---

## Шаг 3. Настройки и запуск сервера

Зайди на сервер: `ssh root@IP_СЕРВЕРА`, дальше:

```bash
node -v                      # нужна версия 18 или новее
ss -tlnp | grep 3100         # порт 3100 должен быть СВОБОДЕН (пустой ответ)

cd /var/www/meow-tower/server
cp .env.example .env
nano .env                    # впиши BOT_TOKEN=токен_от_BotFather, DEV=0
                             # сохранить: Ctrl+O, Enter; выйти: Ctrl+X

node server.js               # пробный запуск
```

Должно появиться: `🐱 Мяу Башня: порт 3100`. Останови: **Ctrl+C**.

> Если порт 3100 занят — поставь в `.env` другой, например `PORT=3110`,
> и в шаге 4 тоже замени 3100 на него.

Теперь запускаем «навсегда», чтобы работал после перезагрузки сервера.
Если на сервере уже есть **pm2** (проверь: `pm2 list`):

```bash
cd /var/www/meow-tower/server
pm2 start server.js --name meow-tower
pm2 save
```

Если pm2 нет: `npm install -g pm2`, затем команды выше и ещё `pm2 startup` (выполни строчку, которую он напишет).

---

## Шаг 4. nginx: адрес → сервер

```bash
nano /etc/nginx/sites-available/meow.friend-e.com
```

Вставь:

```nginx
server {
    listen 80;
    server_name meow.friend-e.com;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 2m;
    }
}
```

Включи и проверь:

```bash
ln -s /etc/nginx/sites-available/meow.friend-e.com /etc/nginx/sites-enabled/
nginx -t                     # должно быть «syntax is ok» и «test is successful»
systemctl reload nginx
```

---

## Шаг 5. HTTPS (обязателен для Telegram)

```bash
certbot --nginx -d meow.friend-e.com
```

На вопрос про редирект на HTTPS — выбери «Redirect».

Проверка: открой в браузере **https://meow.friend-e.com** — должна открыться игра
(вне Telegram она сохраняет прогресс просто в браузере, это нормально).

---

## Шаг 6. Подключить игру к боту (@BotFather)

1. @BotFather → `/mybots` → выбери бота → **Bot Settings** → **Configure Mini App** →
   **Enable Mini App** → пришли адрес `https://meow.friend-e.com`
2. Там же: **Bot Settings** → **Menu Button** → **Configure menu button** →
   адрес `https://meow.friend-e.com`, название кнопки: `Играть` (или `Play`)

Открой своего бота → кнопка **Играть** внизу слева → игра откроется в Telegram.

---

## Шаг 7. Проверка, что облако работает

1. Поиграй в Telegram минуту (построй этаж).
2. На сервере: `ls /var/www/meow-tower/data` — появится файл с номером твоего Telegram, например `123456789.json`.
3. Открой бота на **другом устройстве** (компьютер / второй телефон) — там та же башня.

Логи сервера, если что-то не так: `pm2 logs meow-tower`

---

## Как обновлять игру потом

Когда в репозитории появится новая версия:

```bash
cd /var/www/meow-tower-src && git pull
cp -r index.html style.css js assets /var/www/meow-tower/public/
```

Перезапускать ничего не нужно. Если поменялся `server.js` — ещё `cp server/server.js /var/www/meow-tower/server/` и `pm2 restart meow-tower`.

**Папку `data` не трогай и не удаляй** — там сохранения игроков.
Совет: раз в неделю копируй её себе (`scp -r root@IP_СЕРВЕРА:/var/www/meow-tower/data ./backup-data`).
