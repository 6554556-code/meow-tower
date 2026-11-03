// =====================================================
//  events.js — СОБЫТИЯ: особый заказ, распродажа, проверка
//  Приходят раз в 5–8 минут ИГРЫ (пока игра закрыта — нет). Одно за раз.
//  Все цифры — в CONFIG.events (config.js)
// =====================================================


// ---------- Временные бонусы и штрафы к рейтингу ----------
function addRatingMod(value, minutes, text) {
  state.ratingMods.push({ value, until: Date.now() + minutes * 60000, text });
}

function activeRatingMods() {
  const now = Date.now();
  state.ratingMods = state.ratingMods.filter(m => m.until > now);
  return state.ratingMods;
}


// ---------- Распродажа: скидка на закупку ----------
function saleFactor(num) {
  const e = state.event;
  return e && e.type === 'sale' && e.floor === num ? CONFIG.events.sale.discount : 1;
}


// ---------- Запуск событий ----------

// Каждый тик: dt — секунды ИГРЫ
function eventsTick(dt) {
  const E = CONFIG.events;
  if (!E.enabled) { state.event = null; return; }      // события выключены
  if (state.event) return runEvent(state.event, dt);

  state.eventTimer -= dt;
  if (state.eventTimer > 0) return;

  const started = startRandomEvent();
  state.eventTimer = started ? rand(E.everyMinutes[0], E.everyMinutes[1]) * 60 : 30;   // не вышло — попробуем через 30 с
}

// Открытые магазины и товары, за которые кто-то отвечает
function openShops() {
  return state.floors.filter(f => isOpen(f));
}

function startRandomEvent() {
  const shops = openShops();
  if (!shops.length) return false;

  const kinds = ['order', 'sale', 'inspection'];
  // Заказ возможен, только если есть хотя бы один работник
  const kind = randomItem(kinds);

  if (kind === 'order') {
    const shop = randomItem(shops);
    const slots = [];
    for (let i = 0; i < CONFIG.work.slots; i++) if (workerOf(shop.num, i)) slots.push(i);
    const slot = randomItem(slots);
    const fan = randomItem(state.residents);                       // кто заказывает
    const O = CONFIG.events.order;
    state.event = {
      type: 'order', floor: shop.num, slot, rid: fan.id,
      need: Math.round(rand(O.need[0], O.need[1])), got: 0,
      status: 'offer', left: O.offerSeconds
    };
    const item = productsOf(shop)[slot].name;
    chatSay('eventOrder', fan, { item, n: state.event.need, shop: shopName(shop.type) }, { event: true });
  }

  if (kind === 'sale') {
    const shop = randomItem(shops);
    state.event = { type: 'sale', floor: shop.num, left: CONFIG.events.sale.seconds };
    chatSay('eventSale', SUPPLIER, { shop: shopName(shop.type) }, { event: true });
  }

  if (kind === 'inspection') {
    const shop = randomItem(state.floors.filter(f => isBuilt(f, 'work')));
    state.event = { type: 'inspection', floor: shop.num, left: CONFIG.events.inspection.warnSeconds };
    chatSay('eventInspection', INSPECTOR, { shop: shopName(shop.type), num: shop.num }, { event: true });
  }

  sfx('ding');
  refreshEventModal();
  return true;
}

const SUPPLIER  = { name: 'Поставщик Мурзилкин', breed: 'grey' };
const INSPECTOR = { name: 'Инспектор Усатый',    breed: 'black' };


// ---------- Ход события ----------
function runEvent(e, dt) {
  e.left -= dt;
  const f = getFloor(e.floor);

  if (e.type === 'order') {
    if (!f || !isBuilt(f, 'work')) return endEvent();             // этаж пропал — тихо отменяем
    if (e.status === 'offer') {
      if (e.left <= 0) { endEvent(); }                             // не ответила — заказ ушёл
      return;
    }
    // Принят: забираем товар со склада в «отложенное», пока не наберём нужное
    const take = Math.min(f.stock[e.slot], e.need - e.got);
    if (take > 0) { f.stock[e.slot] -= take; e.got += take; refreshShopModal(); }
    if (e.got >= e.need) return orderDone(e, true);
    if (e.left <= 0)     return orderDone(e, false);
  }

  if (e.type === 'sale' && e.left <= 0) {
    chatSay('eventSaleEnd', SUPPLIER, {});
    endEvent();
  }

  if (e.type === 'inspection' && e.left <= 0) {
    inspect(e, f);
  }
}

function endEvent() {
  state.event = null;
  refreshEventModal();
  refreshShopModal();
}

// Принять / отказаться от особого заказа
function acceptOrder() {
  const e = state.event;
  if (!e || e.type !== 'order' || e.status !== 'offer') return;
  e.status = 'accepted';
  e.left = CONFIG.events.order.seconds;
  refreshEventModal();
}

function declineOrder() {
  const e = state.event;
  if (!e || e.type !== 'order') return;
  const r = getResident(e.rid);
  if (r) chatSay('eventOrderDeclined', r, {});
  endEvent();
}

function orderDone(e, ok) {
  const f = getFloor(e.floor);
  const r = getResident(e.rid) || { name: 'Кот', breed: 'grey' };
  const O = CONFIG.events.order;
  if (ok) {
    const reward = priceOf(f, e.slot) * e.need * O.rewardMult;
    state.coins += reward;
    addRatingMod(O.ratingBonus, O.ratingMinutes, 'Выполнен особый заказ');
    chatSay('eventOrderOk', r, { coins: reward });
    flyCoinsView(floorEl(e.floor), 6);
    sfx('upgrade');
  } else {
    // Не успели: отложенное возвращается на полку
    f.stock[e.slot] = Math.min(stockCap(), f.stock[e.slot] + e.got);
    addRatingMod(-O.ratingBonus, O.ratingMinutes, 'Сорван особый заказ');
    chatSay('eventOrderFail', r, {});
    sfx('sad');
  }
  endEvent();
  updateHud();
}

// Проверка: все места работников заняты и на всех полках есть товар
function inspectionOk(f) {
  if (!f || !isBuilt(f, 'work')) return false;
  for (let i = 0; i < CONFIG.work.slots; i++) {
    if (!workerOf(f.num, i) || f.stock[i] <= 0) return false;
  }
  return true;
}

function inspect(e, f) {
  const I = CONFIG.events.inspection;
  if (inspectionOk(f)) {
    const prize = I.prizePerFloor * e.floor;
    state.coins += prize;
    addRatingMod(I.ratingBonus, I.ratingMinutes, 'Проверка пройдена');
    chatSay('eventInspectionOk', INSPECTOR, { shop: shopName(f.type), coins: prize });
    flyCoinsView(floorEl(e.floor), 6);
    sfx('upgrade');
  } else {
    const fine = Math.min(state.coins, I.fine);
    state.coins -= fine;
    addRatingMod(-I.ratingBonus, I.ratingMinutes, 'Проверка провалена');
    chatSay('eventInspectionFail', INSPECTOR, { shop: f ? shopName(f.type) : 'магазин', coins: fine });
    sfx('sad');
  }
  endEvent();
  updateHud();
}


// =====================================================
//  ЭКРАН: значок в панели и окошко события
// =====================================================

const EVENT_ICON = { order: '📋', sale: '🏷️', inspection: '🕵️' };

function updateEventBadgeView() {
  const btn = document.getElementById('btn-event');
  const e = state.event;
  btn.hidden = !e;
  if (!e) return;
  setHTML(btn, `${EVENT_ICON[e.type]} ${fmtTime(e.left)}`);
  btn.classList.toggle('urgent', e.left < 60 || (e.type === 'order' && e.status === 'offer'));
  const t = document.getElementById('event-left');
  if (t) t.textContent = fmtTime(e.left);
  const g = document.getElementById('event-got');
  if (g && e.type === 'order') g.textContent = `${e.got}/${e.need}`;
}

let eventOpen = false;

function openEvent() {
  if (!state.event) return;
  eventOpen = true;
  document.getElementById('event').hidden = false;
  refreshEventModal();
}

function closeEvent() {
  eventOpen = false;
  closeModal('event');
}

function refreshEventModal() {
  updateEventBadgeView();
  if (!eventOpen) return;
  const e = state.event;
  if (!e) return closeEvent();
  const f = getFloor(e.floor);
  const body = document.getElementById('event-body');
  const shop = `${floorInfo(f.type).icon} ${floorInfo(f.type).name} · ${f.num}`;
  let html = '';

  if (e.type === 'order') {
    const r = getResident(e.rid) || { name: 'Кот', breed: 'grey' };
    const p = productsOf(f)[e.slot];
    const reward = priceOf(f, e.slot) * e.need * CONFIG.events.order.rewardMult;
    html = `
      <div class="modal-title">📋 ОСОБЫЙ ЗАКАЗ</div>
      <div class="ev-who">${avatarHTML(r.breed, 'mini')}<span><b>${r.name}</b> просит</span></div>
      <div class="ev-item"><img src="assets/items/${p.icon}.png" alt=""><span>${p.name} × ${e.need}</span></div>
      <p class="hint">из «${shop}». Товар со склада откладывается для заказа и обычным гостям не продаётся.</p>
      <div class="ev-line">Награда: ${COIN}${fmtNum(reward)} и +${CONFIG.events.order.ratingBonus} ⭐ на ${CONFIG.events.order.ratingMinutes} мин</div>
      <div class="ev-line warn">Не успеешь: −${CONFIG.events.order.ratingBonus} ⭐</div>
      ${e.status === 'offer'
        ? `<div class="ev-line">Ответить за: <b id="event-left">${fmtTime(e.left)}</b></div>
           <div class="confirm-row">
             <button class="fire" id="ev-no">Отказаться</button>
             <button class="btn-ok" id="ev-yes">Принять · ${fmtTime(CONFIG.events.order.seconds)}</button>
           </div>`
        : `<div class="ev-line">Собрано: <b id="event-got">${e.got}/${e.need}</b> · осталось <b id="event-left">${fmtTime(e.left)}</b></div>
           <button class="btn-ok" id="ev-go">К магазину</button>`}`;
  }

  if (e.type === 'sale') {
    html = `
      <div class="modal-title">🏷️ РАСПРОДАЖА</div>
      <div class="ev-who">${avatarHTML(SUPPLIER.breed, 'mini')}<span><b>${SUPPLIER.name}</b></span></div>
      <p class="hint">Закупка в «${shop}» за ${Math.round((1 - CONFIG.events.sale.discount) * 100)}% дешевле!
        Можно дозаказать даже неполные полки.</p>
      <div class="ev-line">Осталось: <b id="event-left">${fmtTime(e.left)}</b></div>
      <button class="btn-ok" id="ev-go">К магазину</button>`;
  }

  if (e.type === 'inspection') {
    const ok = inspectionOk(f);
    const I = CONFIG.events.inspection;
    html = `
      <div class="modal-title">🕵️ ПРОВЕРКА</div>
      <div class="ev-who">${avatarHTML(INSPECTOR.breed, 'mini')}<span><b>${INSPECTOR.name}</b> придёт в «${shop}»</span></div>
      <div class="ev-line">Через: <b id="event-left">${fmtTime(e.left)}</b></div>
      <p class="hint">Нужно: все ${CONFIG.work.slots} места работников заняты и на всех полках есть товар.</p>
      <div class="ev-line ${ok ? 'good' : 'warn'}">${ok ? '✅ Сейчас всё в порядке' : '⚠️ Сейчас проверку не пройти'}</div>
      <div class="ev-line">Пройдёшь: ${COIN}${fmtNum(I.prizePerFloor * f.num)} и +${I.ratingBonus} ⭐ на ${I.ratingMinutes} мин</div>
      <div class="ev-line warn">Провалишь: −${COIN}${I.fine} и −${I.ratingBonus} ⭐</div>
      <button class="btn-ok" id="ev-go">К магазину</button>`;
  }

  body.innerHTML = html;
  const go = body.querySelector('#ev-go');
  if (go) go.onclick = () => { closeEvent(); scrollToFloor(e.floor); openShop(e.floor); };
  const yes = body.querySelector('#ev-yes');
  if (yes) yes.onclick = acceptOrder;
  const no = body.querySelector('#ev-no');
  if (no) no.onclick = declineOrder;
}

// Плашка события в карточке магазина
function eventBannerHTML(num) {
  const e = state.event;
  if (!e || e.floor !== num) return '';
  if (e.type === 'sale') return `<div class="ev-banner">🏷️ Распродажа: закупка −${Math.round((1 - CONFIG.events.sale.discount) * 100)}% · ${fmtTime(e.left)}</div>`;
  if (e.type === 'inspection') return `<div class="ev-banner ${inspectionOk(getFloor(num)) ? 'good' : ''}">🕵️ Проверка через ${fmtTime(e.left)}: ${inspectionOk(getFloor(num)) ? 'всё готово ✅' : 'нужны все работники и товар на всех полках'}</div>`;
  if (e.type === 'order' && e.status === 'accepted') {
    const p = productsOf(getFloor(num))[e.slot];
    return `<div class="ev-banner">📋 Заказ: ${p.name} ${e.got}/${e.need} · ${fmtTime(e.left)}</div>`;
  }
  return '';
}
