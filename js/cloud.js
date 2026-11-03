// =====================================================
//  cloud.js — TELEGRAM и ОБЛАЧНОЕ СОХРАНЕНИЕ
//
//  Два способа хранить сохранение в облаке:
//   • 'tg'     — в облаке самого Telegram (CloudStorage). Сервер не нужен.  ← сейчас
//   • 'server' — на нашем сервере (папка server/). Включим, когда понадобятся
//                платные функции: USE_SERVER = true
//
//  В Telegram: при запуске берём более свежее сохранение (облако или телефон),
//  потом отправляем прогресс раз в 10 секунд и при сворачивании.
//  Вне Telegram (просто открыла index.html) — всё как раньше, только в браузере.
// =====================================================

const USE_SERVER = false;       // true — хранить на своём сервере вместо Telegram

const TG = window.Telegram && window.Telegram.WebApp;

const CLOUD = {
  mode: null,         // 'tg' | 'server' | null (только браузер)
  on: false,          // облако работает
  initData: '',       // «пропуск» от Telegram (для сервера)
  user: null,         // { id, first_name, language_code }
  lastPushAt: 0,
  lastPushedSavedAt: 0,
  pushEvery: 9500,    // раз в 10 секунд (автосохранение идёт каждые 5)
  writing: false,     // Telegram: идёт запись
  pending: null       // Telegram: что записать следующим, если запись уже идёт
};

// Вызывается до старта игры
async function cloudInit() {
  const dev = new URLSearchParams(location.search).get('dev');

  if (TG && TG.initData) {
    CLOUD.initData = TG.initData;
    CLOUD.user = TG.initDataUnsafe && TG.initDataUnsafe.user;
    setupTelegramView();
    CLOUD.mode = USE_SERVER ? 'server' : (hasTgStorage() ? 'tg' : null);
  } else if (dev && location.protocol !== 'file:') {
    CLOUD.initData = 'dev:' + dev;                 // проверка без Telegram (сервер с DEV=1)
    CLOUD.user = { id: 'dev_' + dev, first_name: dev };
    CLOUD.mode = 'server';
  }
  if (!CLOUD.mode) return;                         // обычный браузер — играем локально

  // У каждого игрока своё сохранение (если на телефоне два аккаунта Telegram)
  SAVE_KEY = 'myau-bashnya-save-' + CLOUD.user.id;

  try {
    const save = CLOUD.mode === 'tg' ? await tgLoad() : await serverLoad();
    CLOUD.on = true;

    // Кто свежее: облако или этот телефон?
    let local = null;
    try { local = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { /* нет */ }
    if (save && (!local || save.savedAt > local.savedAt)) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    }
    CLOUD.lastPushedSavedAt = save ? save.savedAt : 0;
  } catch (e) {
    console.warn('Облако недоступно, играем локально:', e.message);
  }
}

// Вызывается из saveGame(): не чаще раза в 10 секунд, или сразу если force
function cloudPush(data, force) {
  if (!CLOUD.on || !data) return;
  if (data.savedAt === CLOUD.lastPushedSavedAt) return;
  const now = Date.now();
  if (!force && now - CLOUD.lastPushAt < CLOUD.pushEvery) return;

  CLOUD.lastPushAt = now;
  CLOUD.lastPushedSavedAt = data.savedAt;
  if (CLOUD.mode === 'tg') tgSave(data);
  else serverSave(data, force);
}

// «Начать заново» — стираем и в облаке
async function cloudReset() {
  if (!CLOUD.on) return;
  try {
    if (CLOUD.mode === 'tg') await tgClear();
    else await api('/api/reset', {});
  } catch (e) { /* не страшно */ }
}

// Язык из Telegram (если игрок в Telegram)
function telegramLang() {
  return CLOUD.user && CLOUD.user.language_code;
}

// Telegram: на весь экран, без закрытия свайпом вниз (иначе листать башню нельзя), цвета игры
function setupTelegramView() {
  try {
    TG.ready();
    TG.expand();
    if (TG.disableVerticalSwipes) TG.disableVerticalSwipes();
    if (TG.setHeaderColor) TG.setHeaderColor('#1b1838');
    if (TG.setBackgroundColor) TG.setBackgroundColor('#1b1838');
  } catch (e) { /* старый Telegram — не страшно */ }
}


// =====================================================
//  ОБЛАКО TELEGRAM (CloudStorage)
//  Одна запись — не больше 4096 символов, поэтому сохранение режем на куски:
//  s0, s1, s2… и в конце «паспорт» smeta = { n: сколько кусков, savedAt }
// =====================================================
const CHUNK = 4000;

function hasTgStorage() {
  return Boolean(TG && TG.CloudStorage && (!TG.isVersionAtLeast || TG.isVersionAtLeast('6.9')));
}

// Обёртки: Telegram отвечает через callback — превращаем в обещания с таймаутом 6 секунд
function tgCall(method, ...args) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Telegram не отвечает')), 6000);
    TG.CloudStorage[method](...args, (err, result) => {
      clearTimeout(timer);
      err ? reject(new Error(String(err))) : resolve(result);
    });
  });
}

async function tgLoad() {
  const metaRaw = await tgCall('getItem', 'smeta');
  if (!metaRaw) return null;                                   // в облаке пусто
  const meta = JSON.parse(metaRaw);
  const keys = Array.from({ length: meta.n }, (_, i) => 's' + i);
  const parts = await tgCall('getItems', keys);
  const json = keys.map(k => parts[k] || '').join('');
  const save = JSON.parse(json);
  if (save.savedAt !== meta.savedAt) throw new Error('сохранение записано не до конца');
  CLOUD.lastN = meta.n;
  return save;
}

// Запись по очереди: если прошлая ещё идёт — запомним самое свежее и запишем после
async function tgSave(data) {
  if (CLOUD.writing) { CLOUD.pending = data; return; }
  CLOUD.writing = true;
  try {
    const json = JSON.stringify(data);
    const n = Math.ceil(json.length / CHUNK);
    for (let i = 0; i < n; i++) {
      await tgCall('setItem', 's' + i, json.slice(i * CHUNK, (i + 1) * CHUNK));
    }
    await tgCall('setItem', 'smeta', JSON.stringify({ n, savedAt: data.savedAt }));   // «паспорт» — последним
    if (CLOUD.lastN > n) {                                                              // лишние старые куски
      const extra = Array.from({ length: CLOUD.lastN - n }, (_, i) => 's' + (n + i));
      await tgCall('removeItems', extra);
    }
    CLOUD.lastN = n;
  } catch (e) {
    console.warn('Не получилось сохранить в Telegram:', e.message);
  } finally {
    CLOUD.writing = false;
    if (CLOUD.pending) { const next = CLOUD.pending; CLOUD.pending = null; tgSave(next); }
  }
}

async function tgClear() {
  const keys = await tgCall('getKeys');
  if (keys && keys.length) await tgCall('removeItems', keys);
}


// =====================================================
//  СВОЙ СЕРВЕР (папка server/) — для платных функций потом
// =====================================================

// Запрос к серверу. Не ждём дольше 6 секунд: если сервер молчит — играем локально
function api(url, extra) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: CLOUD.initData, ...extra }),
    signal: ctrl.signal
  }).finally(() => clearTimeout(timer));
}

async function serverLoad() {
  const res = await api('/api/load', {});
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return (await res.json()).save;
}

function serverSave(data, force) {
  const body = JSON.stringify({ initData: CLOUD.initData, save: data });
  if (force && navigator.sendBeacon) {
    // Вкладку закрывают — sendBeacon успевает отправить даже при закрытии
    navigator.sendBeacon('/api/save', new Blob([body], { type: 'application/json' }));
  } else {
    fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
      .catch(e => console.warn('Не получилось сохранить на сервер:', e.message));
  }
}
