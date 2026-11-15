// =====================================================
//  server.js — сервер «Мяу Башни»
//  • раздаёт файлы игры из папки ../public
//  • проверяет, что игрок пришёл из Telegram (подпись initData)
//  • хранит сохранения: по одному файлу на игрока в ../data
//  Без сторонних библиотек — npm install не нужен.
//  Запуск: node server.js   (настройки — в файле .env рядом)
// =====================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------- Настройки из .env ----------
loadEnv(path.join(__dirname, '.env'));
const PORT = Number(process.env.PORT || 3100);
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const DEV = process.env.DEV === '1';                       // режим разработчика: вход без Telegram
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const MAX_BODY = 1024 * 1024;                              // сохранение больше 1 МБ не принимаем
const INIT_DATA_MAX_AGE = 7 * 24 * 3600;                   // подпись Telegram действует 7 дней

if (!BOT_TOKEN && !DEV) {
  console.error('❌ Нет BOT_TOKEN. Впиши токен бота в server/.env (см. .env.example)');
  process.exit(1);
}
fs.mkdirSync(DATA_DIR, { recursive: true });

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}


// =====================================================
//  ПРОВЕРКА TELEGRAM
//  https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
// =====================================================
function checkTelegram(initData) {
  if (typeof initData !== 'string' || !initData) return null;

  // Режим разработчика: «dev:имя» — тестовый игрок без Telegram
  if (DEV && initData.startsWith('dev:')) {
    return { id: 'dev_' + initData.slice(4).replace(/[^\w]/g, '').slice(0, 32), first_name: 'Dev' };
  }
  if (!BOT_TOKEN) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const checkString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const calc = crypto.createHmac('sha256', secret).update(checkString).digest('hex');

  const a = Buffer.from(calc, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;     // подпись не сходится

  const authDate = Number(params.get('auth_date') || 0);
  if (Date.now() / 1000 - authDate > INIT_DATA_MAX_AGE) return null;          // слишком старая

  try {
    const user = JSON.parse(params.get('user') || 'null');
    return user && user.id ? user : null;
  } catch {
    return null;
  }
}


// =====================================================
//  СОХРАНЕНИЯ: файл data/<id>.json
// =====================================================
function saveFile(userId) {
  return path.join(DATA_DIR, String(userId).replace(/[^\w-]/g, '') + '.json');
}

function readSave(userId) {
  try { return JSON.parse(fs.readFileSync(saveFile(userId), 'utf8')); } catch { return null; }
}

// Записываем через временный файл, чтобы при сбое не получить половину сохранения
function writeSave(userId, record) {
  const file = saveFile(userId);
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(record));
  fs.renameSync(tmp, file);
}


// =====================================================
//  API
// =====================================================
async function handleApi(req, res, route) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });

  let body;
  try { body = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'bad json' }); }

  const user = checkTelegram(body.initData);
  if (!user) return send(res, 401, { error: 'not telegram' });

  if (route === '/api/load') {
    const rec = readSave(user.id);
    return send(res, 200, { save: rec ? rec.save : null, user: { id: user.id, name: user.first_name } });
  }

  if (route === '/api/save') {
    const save = body.save;
    if (!save || typeof save !== 'object' || typeof save.savedAt !== 'number') return send(res, 400, { error: 'bad save' });
    const old = readSave(user.id);
    // Не затираем более свежее сохранение (например, с другого устройства)
    if (old && old.save && old.save.savedAt > save.savedAt) return send(res, 200, { ok: true, kept: 'newer' });
    writeSave(user.id, { save, user: { id: user.id, name: user.first_name, username: user.username }, updatedAt: Date.now() });
    return send(res, 200, { ok: true });
  }

  if (route === '/api/reset') {
    try { fs.unlinkSync(saveFile(user.id)); } catch { /* и так пусто */ }
    return send(res, 200, { ok: true });
  }

  send(res, 404, { error: 'unknown api' });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('too big')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}


// =====================================================
//  ФАЙЛЫ ИГРЫ
// =====================================================
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webp': 'image/webp'
};

function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(PUBLIC_DIR, '.' + rel);
  if (!file.startsWith(PUBLIC_DIR + path.sep)) { res.writeHead(403); return res.end(); }   // защита от ../
  if (rel.split('/').some(p => p.startsWith('.'))) { res.writeHead(404); return res.end('Not found'); }   // скрытые файлы (.env) не отдаём

  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(file).toLowerCase();
    // Код и страница — всегда свежие (чтобы обновления сразу доходили), картинки — кешируем на день
    const cache = ['.html', '.js', '.css'].includes(ext) ? 'no-cache' : 'public, max-age=86400';
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': cache });
    fs.createReadStream(file).pipe(res);
  });
}


// =====================================================
//  СТАРТ
// =====================================================
http.createServer((req, res) => {
  const urlPath = new URL(req.url, 'http://x').pathname;
  if (urlPath.startsWith('/api/')) {
    handleApi(req, res, urlPath).catch(e => {
      console.error('API error:', e.message);
      if (!res.headersSent) send(res, 500, { error: 'server' });
    });
  } else {
    serveStatic(req, res, urlPath);
  }
}).listen(PORT, () => {
  console.log(`🐱 Мяу Башня: порт ${PORT}${DEV ? ' (режим разработчика)' : ''}`);
});
