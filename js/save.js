// =====================================================
//  save.js — СОХРАНЕНИЕ и доход, пока игрока не было
//  Сохраняем «память» игры в браузере (localStorage).
//  Живёт на этом устройстве и в этом браузере.
// =====================================================

let SAVE_KEY = 'myau-bashnya-save';      // в Telegram cloud.js добавит сюда id игрока
const SAVE_VERSION = 1;
let resetting = false;   // во время сброса больше не сохраняем


// ---------- Сохранить ----------
// force = true — сразу отправить в облако (вкладку сворачивают или закрывают)
function saveGame(force) {
  if (resetting) return;
  const data = {
    v: SAVE_VERSION,
    savedAt: Date.now(),
    coins: state.coins,
    fish: state.fish,
    floors: state.floors,
    residents: state.residents,
    residentSeq: state.residentSeq,
    guestCount: state.guests.count,
    upgrades: state.upgrades,
    autoLiftUntil: state.autoLiftUntil,
    rating: state.rating,
    chat: state.chat,
    chatUnread: state.chatUnread,
    departures: state.departures,
    daily: state.daily,
    settings: state.settings,
    tutorial: state.tutorial,
    event: state.event,
    eventTimer: state.eventTimer,
    ratingMods: state.ratingMods
    // Гость в лобби и в кабинке не сохраняются: после возвращения придёт новый
  };
  const json = JSON.stringify(data);
  try {
    localStorage.setItem(SAVE_KEY, json);
  } catch (e) {
    console.warn('Не получилось сохранить игру:', e);
  }
  nativeSave(json);                                    // в приложении — ещё и в надёжное хранилище (native.js)
  cloudPush(data, force === true);
}


// ---------- Загрузить ----------
// Вернёт отчёт «пока тебя не было» или null, если сохранения нет
function loadGame() {
  let data = null;
  try {
    data = JSON.parse(localStorage.getItem(SAVE_KEY));
  } catch (e) {
    console.warn('Сохранение не читается, начинаем заново:', e);
  }
  if (!data || data.v !== SAVE_VERSION) return null;

  state.coins = data.coins;
  state.fish = data.fish;
  state.floors = data.floors;
  state.residents = data.residents;
  state.residentSeq = data.residentSeq;
  state.guests.count = data.guestCount || 0;
  state.upgrades = Object.assign({ lift: 0, build: 0, delivery: 0, storage: 0 }, data.upgrades);
  state.autoLiftUntil = data.autoLiftUntil || 0;
  if (typeof data.rating === 'number') state.rating = data.rating;
  state.chat = data.chat || [];
  state.chatUnread = data.chatUnread || 0;
  state.departures = data.departures || [];
  state.daily = data.daily || { lastDay: null, streak: 0 };
  state.settings = Object.assign({ sound: false, music: true, lang: null }, data.settings);
  // Старые сохранения (до обучения) — обучение не показываем, ты уже всё знаешь
  state.tutorial = data.tutorial || { step: 0, done: true };
  state.event = data.event || null;
  if (typeof data.eventTimer === 'number') state.eventTimer = data.eventTimer;
  state.ratingMods = data.ratingMods || [];

  // Переезд со старого сохранения (шаг 6): магазины копили кассу, теперь у них склад
  let migrated = 0;
  state.floors.forEach(f => {
    if (!isBuilt(f, 'work') || f.stock) return;
    migrated += Math.floor(f.cash || 0);       // остаток старой кассы — в кошелёк
    delete f.cash;
    initShop(f);
  });
  state.coins += migrated;
  // Работникам из старого сохранения выдаём товары по порядку
  state.residents.forEach(r => { if (r.slot === undefined) r.slot = null; });
  state.residents.forEach(r => { if (r.job !== null && r.slot === null) r.slot = freeSlot(r.job); });

  // Сколько секунд игрока не было
  const now = Date.now();
  const away = Math.max(0, (now - data.savedAt) / 1000);

  // Запоминаем кассы «до», копим за время отсутствия, считаем разницу
  const before = state.floors.map(f => ({ cash: f.cash || 0, fish: f.fishCash || 0 }));
  earn(away);
  state.lastTick = now;

  const report = { away, deliveries: 0, migrated, luxCoins: 0, luxFish: 0, built: null, full: false };
  state.floors.forEach((f, i) => {
    const gain = Math.floor(f.cash || 0) - Math.floor(before[i].cash);
    // Поставки, которые приехали, пока нас не было (на складе появятся в первом же тике)
    if (isBuilt(f, 'work')) report.deliveries += f.deliveryAt.filter(t => t && now >= t).length;
    if (kindOf(f) === 'lux') {
      report.luxCoins += gain;
      report.luxFish += Math.floor(f.fishCash) - Math.floor(before[i].fish);
    }
    if (isCashFull(f)) report.full = true;
  });

  // Стройка закончилась, пока нас не было?
  const top = topFloor();
  if (top.status === 'building' && now >= top.endsAt) report.built = top.num;

  return report;
}


// ---------- Начать заново ----------
async function resetGame() {
  resetting = true;
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ничего страшного */ }
  await nativeReset();                                 // и в приложении
  await cloudReset();                                  // и в облаке тоже
  location.reload();
}


// ---------- Автосохранение ----------
function startAutosave() {
  setInterval(saveGame, 5000);                         // каждые 5 секунд
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) saveGame(true);               // свернули вкладку или телефон
  });
  window.addEventListener('pagehide', () => saveGame(true));   // закрыли вкладку
}
