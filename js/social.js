// =====================================================
//  social.js — РЕЙТИНГ, МУР-ЧАТ и ПОДАРОК ДНЯ
//  Всё про настроение котов и башни.
//  Фразы котов — в CHAT_LINES ниже, их можно дописывать.
// =====================================================


// ---------- Фразы котов ----------
// {name} — имя кота, {shop} — этаж, {dream} — этаж мечты, {item} — товар
const CHAT_LINES = {
  hello: [
    'Всем мяу! Я {name}, мечтаю работать в «{dream}» 😺',
    'Привет, соседи! {name} заселился. Кто покажет, где тут миска?',
    'Мур! Новенький тут. Говорят, в «{dream}» очень круто…'
  ],
  dreamJob: [
    'Ура! Работаю в «{shop}» — это моя мечта! 💖',
    'Я в «{shop}»! Мурчу от счастья 😻',
    'Лучший день: взяли в «{shop}»! 🎉'
  ],
  job: [
    'Ну ладно, «{shop}» так «{shop}»… Но вообще я хочу в «{dream}» 😿',
    'Вышел на работу в «{shop}». Не мечта, но миска сама себя не наполнит',
    'Работаю в «{shop}». Надеюсь, когда-нибудь переведут в «{dream}»…'
  ],
  fired: [
    'Меня уволили?! 😾',
    'Ну и ладно. Пойду полежу. Но я запомню 😼'
  ],
  outOfStock: [
    'В «{shop}» кончился товар «{item}»! Закажите поставку 📦',
    'Покупатели спрашивают «{item}», а у нас пусто 😿',
    'Полка с «{item}» пустая. Я тут просто стою…'
  ],
  arrived: [
    '«{item}» привезли, торгуем! 🚚',
    'Поставка пришла! «{item}» снова в продаже 😺'
  ],
  // Случайные посетители (visitors.js)
  visTipper: [
    'Чудесная башня! Держите {coins} монет на чай 🤑',
    'Обслуживание — мур! Вот вам {coins} монет 💰'
  ],
  visTipperFish: ['Какой сервис! {coins} монет и рыбка в придачу 🐟'],
  visThief: [
    'Хе-хе, {coins} монет теперь мои! Ищите ветра в поле 😼',
    'Ой, а чей это кошелёк? Был ваш — стал мой. Минус {coins} монет 🦹'
  ],
  visThiefEmpty: ['Залез в кошелёк, а там пусто… Ну и башня 🙄'],
  visGlutton: [
    'Ам-ням! {items} — было вкусно, а платить я не буду 🐷',
    'Я тут немножко перекусил: {items}. Запишите на счёт соседа 😋'
  ],
  visGluttonEmpty: ['Пришёл покушать, а полки пустые… Обидно 🐷'],
  visIntruder: ['Тревога! К нам хочет проникнуть недоброжелатель {icon} Он крутится у входа — тапни по нему, чтобы прогнать!'],
  visShooedThief: ['Эх, заметили… Ладно, в другой раз 😼', 'Да я просто мимо проходил! 🦹'],
  visShooedGlutton: ['Ну и ладно, пообедаю в другой башне 🐷', 'Я только понюхать хотел… 🐷'],
  vip: [
    'Хм, неплохой люкс. Я остаюсь 👑',
    'Шампанское… то есть сливки в номер, пожалуйста 👑'
  ],
  bored: [
    'Мне скучно… Найдите мне работу 🥺',
    'Лежу уже целый час. Может, я кому-то нужен?'
  ],
  warn: [
    'Если мне не найдут работу, я съеду 😠',
    'Последнее предупреждение: без работы я ухожу!'
  ],
  leave: [
    'Всё, съезжаю от вас. Прощайте 😾',
    'Ухожу в другую башню. Там хоть работа есть 😤'
  ],
  eventOrder: [
    'У меня праздник! Нужно {n} шт. «{item}» из «{shop}». Поможете? 🎂',
    'Хочу устроить вечеринку: {n} шт. «{item}». Успеете? 🥳'
  ],
  eventOrderDeclined: ['Ну ладно… обойдусь 😿', 'Эх, жаль. В другой раз.'],
  eventOrderOk: ['Ура, заказ готов! Вот {coins} монет, спасибо! 💖', 'Лучшая башня! Держите {coins} монет 😻'],
  eventOrderFail: ['Заказ так и не собрали… Праздник испорчен 😾', 'Я ждал-ждал… Больше не попрошу 😿'],
  eventSale: ['Распродажа! Закупка в «{shop}» в два раза дешевле, 3 минуты! 🏷️'],
  eventSaleEnd: ['Распродажа закончилась. Приходите ещё!'],
  eventInspection: ['Через 3 минуты проверю «{shop}» на {num} этаже. Чтоб все на местах и полки полные! 🕵️'],
  eventInspectionOk: ['«{shop}» в отличном состоянии. Премия {coins} монет 🏅'],
  eventInspectionFail: ['«{shop}»: пустые полки или некому работать! Штраф {coins} монет 📝'],
  guestLeft: [
    'Сколько можно ждать лифт?! Ухожу 😾',
    'Я тут не для того, чтобы в лобби стоять. До свидания!',
    'Пойду в другую башню, там лифт быстрее 😤'
  ],
  // Болтовня: раз в несколько минут кто-нибудь что-нибудь говорит
  grumble: [
    'Опять «{shop}»… А я хочу в «{dream}» 😿',
    'Кто-нибудь, переведите меня в «{dream}», а?',
    'В «{dream}» сейчас, наверное, так хорошо…'
  ],
  happy: [
    'Обожаю свою работу в «{shop}» 💖',
    'Сегодня в «{shop}» отличный день!',
    'Мурр. Всё хорошо.'
  ],
  smalltalk: [
    'Кто-нибудь видел мой клубок?',
    'Лифт сегодня быстрый, мне нравится',
    'А вы знали, что кот в шляпе в лобби — наш консьерж? 🎩',
    'Пахнет рыбкой… это из кафе?',
    'Кто опять занял моё место на подоконнике?'
  ],
  sad: [
    'Что-то в нашей башне стало грустно…',
    'Гостей всё меньше. Может, навести порядок?'
  ]
};


// =====================================================
//  РЕЙТИНГ
// =====================================================

// Из чего складывается рейтинг прямо сейчас: список «причин» и итог
function ratingFactors() {
  const R = CONFIG.rating;
  const list = [];
  const now = Date.now();

  // Коты на работе мечты
  const res = state.residents;
  if (res.length) {
    const dream = res.filter(isDreamJob).length;
    list.push({ text: t('rate.dream', { n: dream, all: res.length }), value: R.dreamMax * dream / res.length });
  }
  // Безработные
  const idle = res.filter(r => r.job === null).length;
  if (idle) list.push({ text: t('rate.idle', { n: idle }), value: Math.max(-1, R.perIdle * idle) });

  // Полки: товар в наличии / пустые без заказа
  let active = 0, full = 0, empty = 0;
  state.floors.filter(f => isBuilt(f, 'work')).forEach(f => {
    for (let i = 0; i < CONFIG.work.slots; i++) {
      if (!workerOf(f.num, i)) continue;
      active++;
      if (f.stock[i] > 0) full++;
      else if (!f.deliveryAt[i]) empty++;
    }
  });
  if (active) list.push({ text: t('rate.stock', { n: full, all: active }), value: R.shelvesMax * full / active });
  if (empty) list.push({ text: t('rate.empty', { n: empty }), value: Math.max(-1, R.perEmptyShelf * empty) });


  // Недавно съехавшие коты
  const recent = state.departures.filter(t => now - t < R.departureMinutes * 60000).length;
  if (recent) list.push({ text: t('rate.left', { n: recent }), value: Math.max(-1.5, R.perDeparture * recent) });

  activeRatingMods().forEach(m => list.push({ text: t('rate.mod', { text: m.text, m: Math.ceil((m.until - now) / 60000) }), value: m.value }));

  const target = Math.min(5, Math.max(1, R.start + list.reduce((s, x) => s + x.value, 0)));
  return { list, target };
}

// Рейтинг плавно движется к цели (вызывается каждый тик)
function updateRating(dt) {
  const { target } = ratingFactors();
  const k = Math.min(1, dt / CONFIG.rating.smoothSeconds);
  state.rating += (target - state.rating) * k;
}

// Как часто приходят гости при текущем рейтинге (между точками 1⭐, 3⭐, 5⭐ — плавно)
function ratingGuestSeconds() {
  const g = CONFIG.rating.guestSeconds;
  const r = state.rating;
  if (r <= 3) return g[1] + (g[3] - g[1]) * (r - 1) / 2;
  return g[3] + (g[5] - g[3]) * (r - 3) / 2;
}


// =====================================================
//  МУР-ЧАТ
// =====================================================

// Написать в чат. r — кот (жилец) или { name, breed } для гостей.
// go — куда ведёт тап по сообщению: { rid } — профиль кота, { floor } — карточка этажа.
// Для жильцов по умолчанию — его профиль
function chatSay(kind, r, vars = {}, go = null) {
  const lines = CHAT_LINES[kind];
  if (!lines || !r) return;
  let text = randomItem(lines);
  const all = { name: r.name, ...vars };
  Object.entries(all).forEach(([k, v]) => { text = text.split(`{${k}}`).join(v); });

  if (!go && r.id) go = { rid: r.id };
  state.chat.push({ at: Date.now(), name: r.name || t('chat.guest'), breed: r.breed, text, go });
  if (state.chat.length > 60) state.chat.shift();   // храним последние 60 сообщений
  state.chatUnread++;

  const important = ['leave', 'outOfStock', 'warn', 'eventOrder', 'eventSale', 'eventInspection',
                     'eventOrderOk', 'eventOrderFail', 'eventInspectionOk', 'eventInspectionFail',
                     'visTipper', 'visTipperFish', 'visThief', 'visThiefEmpty', 'visGlutton', 'visGluttonEmpty',
                     'visIntruder'];
  if (important.includes(kind)) showToastView(r, text, go);   // важное — всплывашкой
  refreshChatModal();
}

// Названия для подстановки во фразы
function shopName(type) { return floorInfo(type).name.toLowerCase().replace(/^./, c => c.toUpperCase()); }
function jobVars(r) {
  const v = { dream: shopName(r.dream) };
  if (r.job !== null) v.shop = shopName(getFloor(r.job).type);
  return v;
}

// Болтовня раз в 2–4 минуты (только пока игра открыта)
let nextChatterAt = Date.now() + 60000;

function chatter() {
  if (Date.now() < nextChatterAt) return;
  nextChatterAt = Date.now() + rand(120, 240) * 1000;
  if (state.rating < 2.2 && state.residents.length) return chatSay('sad', randomItem(state.residents));
  const r = randomItem(state.residents);
  if (!r) return;
  if (r.job !== null && !isDreamJob(r) && Math.random() < 0.6) return chatSay('grumble', r, jobVars(r));
  if (isDreamJob(r) && Math.random() < 0.6) return chatSay('happy', r, jobVars(r));
  chatSay('smalltalk', r);
}


// Тап по сообщению или всплывашке: профиль кота или карточка этажа
function canGo(go) {
  if (!go) return false;
  if (go.event) return Boolean(state.event);              // событие ещё идёт
  if (go.rid) return Boolean(getResident(go.rid));       // кот мог уже съехать
  return Boolean(go.floor && getFloor(go.floor));
}

function chatGo(go) {
  if (!canGo(go)) return;
  closeChat();
  if (go.event) return openEvent();
  if (go.rid) {
    const r = getResident(go.rid);
    scrollToFloor(r.job ?? r.home);
    openResidents(r.home);
    openResident(r.id);
  } else {
    scrollToFloor(go.floor);
    if (go.floor !== 1) openShop(go.floor);              // лобби — просто показываем
  }
}


// =====================================================
//  ТЕРПЕНИЕ ГОСТЕЙ: долго ждут лифт — обижаются и уходят
//  Считается только время игры. Рейтинг не трогает
// =====================================================

function guestPatienceTick(dt) {
  const g = state.guests;
  [...g.waiting].forEach(guest => {
    guest.waited = (guest.waited || 0) + dt;
    if (guest.waited < CONFIG.guests.patienceSeconds) return;
    g.waiting = g.waiting.filter(x => x !== guest);
    guestLeavesView(guest);
    chatSay('guestLeft', { name: guest.vip ? t('chat.vipGuest') : t('chat.guest'), breed: guest.breed });
  });
}


// =====================================================
//  БЕЗРАБОТНЫЕ: скучают, предупреждают, съезжают
//  dt — секунды ИГРЫ (пока вкладка открыта), отсутствие не считается
// =====================================================

function idleTick(dt) {
  const I = CONFIG.idle;
  [...state.residents].forEach(r => {
    if (r.job !== null) { r.idle = 0; r.idleStage = 0; return; }
    r.idle = (r.idle || 0) + dt;
    const min = r.idle / 60;
    if (min >= I.leaveMinutes)                          return residentLeaves(r);
    const stage = r.idleStage || 0;
    if (min >= I.warnMinutes && stage < 2)              { r.idleStage = 2; chatSay('warn', r); }
    else if (min >= I.complainMinutes && stage < 1)     { r.idleStage = 1; chatSay('bored', r); }
  });
}

// Кот съезжает: пишет в чат, исчезает, рейтинг проседает на полчаса
function residentLeaves(r) {
  chatSay('leave', r);
  sfx('sad');
  state.residents = state.residents.filter(x => x.id !== r.id);
  state.departures.push(Date.now());
  const el = towerEl.querySelector(`.cat[data-rid="${r.id}"]`);
  if (el) el.remove();
  refreshResidentsModal();
}


// =====================================================
//  ПОДАРОК ДНЯ
// =====================================================

// Дата «ГГГГ-ММ-ДД» по местному времени игрока
function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Сегодня ещё не забирала? Вернёт номер дня в серии (1–7) или null
function dailyDue() {
  const d = state.daily;
  const today = dayKey();
  if (d.lastDay === today) return null;
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  const streak = d.lastDay === yesterday ? d.streak + 1 : 1;   // пропустила день — сначала
  return ((streak - 1) % CONFIG.daily.length) + 1;              // после 7-го — снова 1-й
}

function claimDaily() {
  const day = dailyDue();
  if (!day) return;
  const prize = CONFIG.daily[day - 1];
  state.coins += prize.coins || 0;
  state.fish += prize.fish || 0;
  state.daily = { lastDay: dayKey(), streak: day };
  sfx('coin');
  flyCoinsView(document.querySelector('#daily .btn-ok'), 6);
  closeModal('daily');
  updateHud();
  saveGame();
}


// =====================================================
//  ЭКРАН: звёзды, чат, всплывашки, подарок
// =====================================================

function updateRatingView() {
  setHTML(document.getElementById('rating-num'), fmtDec(state.rating, 1));
  const badge = document.getElementById('chat-unread');
  badge.hidden = !state.chatUnread;
  setHTML(badge, String(Math.min(99, state.chatUnread)));
}

function openRating() {
  const { list } = ratingFactors();
  const rows = list.map(x => `
    <div class="factor ${x.value >= 0 ? 'plus' : 'minus'}">
      <span>${x.text}</span><span>${x.value >= 0 ? '+' : '−'}${fmtDec(Math.abs(x.value), 1)}</span>
    </div>`).join('') || `<p class="hint">${t('rate.calm')}</p>`;
  document.getElementById('rating-body').innerHTML = `
    <div class="modal-title">${t('rate.title', { r: fmtDec(state.rating, 1) })}</div>
    <div class="modal-sub">${t('rate.guests', { s: Math.round(ratingGuestSeconds()) })}</div>
    <div class="factor base"><span>${t('rate.base')}</span><span>${CONFIG.rating.start}</span></div>
    ${rows}
    <p class="hint">${t('rate.hint')}</p>`;
  document.getElementById('rating').hidden = false;
}

let chatOpen = false;

function openChat() {
  chatOpen = true;
  state.chatUnread = 0;
  document.getElementById('chat').hidden = false;
  refreshChatModal();
  updateRatingView();
}

function closeChat() {
  chatOpen = false;
  closeModal('chat');
}

// «5 мин назад»
function agoText(at) {
  const m = Math.floor((Date.now() - at) / 60000);
  if (m < 1) return t('chat.now');
  if (m < 60) return t('chat.min', { m });
  return t('chat.h', { h: Math.floor(m / 60) });
}

function refreshChatModal() {
  if (!chatOpen) return;
  state.chatUnread = 0;
  const msgs = state.chat.map((m, i) => ({ m, i })).reverse().map(({ m, i }) => `
    <div class="msg${canGo(m.go) ? ' link' : ''}" data-i="${i}">
      ${avatarHTML(m.breed, 'mini')}
      <div class="msg-main">
        <div class="msg-head"><b>${m.name}</b><span>${agoText(m.at)}</span></div>
        <div class="msg-text">${m.text}</div>
      </div>
      ${canGo(m.go) ? '<span class="msg-go">›</span>' : ''}
    </div>`).join('') || `<p class="hint">${t('chat.quiet')}</p>`;
  const body = document.getElementById('chat-body');
  body.innerHTML = `
    <div class="modal-title">${t('chat.title')}</div>
    <div class="modal-sub">${t('chat.sub')}</div>
    <div class="chat-list">${msgs}</div>`;
  body.querySelectorAll('.msg.link').forEach(el => el.onclick = () => chatGo(state.chat[Number(el.dataset.i)].go));
}

// Важное сообщение всплывает сверху на 4 секунды
function showToastView(r, text, go) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `${avatarHTML(r.breed, 'mini')}<span><b>${r.name}:</b> ${text}</span>`;
  t.onclick = () => { t.remove(); canGo(go) ? chatGo(go) : openChat(); };
  document.querySelector('.game').appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function showDaily() {
  const day = dailyDue();
  if (!day) return;
  const cells = CONFIG.daily.map((p, i) => `
    <div class="day ${i + 1 < day ? 'done' : ''} ${i + 1 === day ? 'today' : ''}">
      <div class="day-n">${t('daily.day', { n: i + 1 })}</div>
      <div class="day-prize">${p.fish ? `${FISH}${p.fish}` : `${COIN}${p.coins}`}</div>
    </div>`).join('');
  document.getElementById('daily-body').innerHTML = `
    <div class="modal-title">${t('daily.title')}</div>
    <div class="modal-sub">${t('daily.sub')}</div>
    <div class="days">${cells}</div>
    <button class="btn-ok" onclick="claimDaily()">${t('daily.take')}</button>`;
  document.getElementById('daily').hidden = false;
}
