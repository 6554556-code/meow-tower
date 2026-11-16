// =====================================================
//  game.js — ПРАВИЛА ИГРЫ и её «память» (состояние)
//  Здесь решается, ЧТО происходит. Как это выглядит — в view.js
// =====================================================

// ---------- Память игры ----------
// Всё, что знает игра в данный момент. Шаг 6 научит её сохраняться.
const state = {
  coins: CONFIG.startCoins,
  fish: 0,
  // Этажи снизу вверх. status: 'building' — стройка, 'choose' — ждём выбор типа, 'built' — готов
  // У рабочих этажей склад: stock (сколько штук каждого товара) и deliveryAt (когда приедет поставка)
  // У люкса касса: cash (монеты) и fishCash (рыбки)
  floors: [
    { num: 1, type: 'lobby', status: 'built' }
  ],
  // Жильцы: { id, name, breed, home (этаж комнаты сна), job (этаж работы или null),
  //           slot (за какой товар отвечает), dream (тип этажа мечты) }
  residents: [],
  residentSeq: 0,
  lift: { floor: 1, moving: false, boardAt: null },
  upgrades: { lift: 0, build: 0, delivery: 0, storage: 0 },   // общие улучшения башни (уровни)
  autoLiftUntil: 0,                               // до какого момента работает робот-лифтёр
  rating: CONFIG.rating.start,                    // рейтинг башни 1–5 (дробный, меняется плавно)
  chat: [],                                       // Мур-чат: [{ at, name, breed, text }]
  chatUnread: 0,
  departures: [],                                 // когда съезжали коты (для минуса к рейтингу)
  daily: { lastDay: null, streak: 0 },            // подарок дня: когда забирала и какая серия
  settings: { sound: false, music: true },        // звуки по умолчанию выключены, музыка включена
  tutorial: { step: 0, done: false, tips: [] },
  event: null,                                    // текущее событие (events.js)
  eventTimer: CONFIG.events.firstMinutes * 60,    // секунд игры до следующего события
  ratingMods: [],                                 // временные бонусы/штрафы рейтинга от событий           // обучение: какой шаг
  guests: {
    waiting: [],                    // кто ждёт лифт в лобби (до 3): [{ id, breed, dest, vip, resident }]
    inCab: null,                    // кто едет в кабинке
    nextAt: Date.now() + CONFIG.guests.everySeconds * 1000,  // когда придёт следующий (скрытый таймер, игрок не видит)
    count: 0                        // сколько гостей уже приходило (для VIP)
  },
  lastTick: Date.now()
};


// ---------- Помощники ----------
function topFloor() {
  return state.floors[state.floors.length - 1];
}

function getFloor(num) {
  return state.floors.find(f => f.num === num);
}

// Вид этажа: 'lobby', 'living', 'work' или 'lux'
function kindOf(floor) {
  return floor.type ? CONFIG.floorTypes[floor.type].kind : null;
}

function isBuilt(floor, kind) {
  return floor.status === 'built' && (!kind || kindOf(floor) === kind);
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Типы рабочих этажей: ['cafe', 'toyshop', 'spa', 'milkbar']
function workTypes() {
  return Object.keys(CONFIG.floorTypes).filter(id => CONFIG.floorTypes[id].kind === 'work');
}

function getResident(id) {
  return state.residents.find(r => r.id === id);
}

// Сколько жильцов живёт в комнате сна / работает на этаже
function residentsIn(num) { return state.residents.filter(r => r.home === num).length; }
function workersIn(num)   { return state.residents.filter(r => r.job === num).length; }

// Сколько гостей уже едут (ждут или в кабинке) на этот этаж — чтобы не перебронировать места
function headingTo(num) {
  const g = state.guests;
  return [...g.waiting, g.inCab].filter(x => x && x.dest === num).length;
}


// ---------- Стройка ----------

// Округлить до «красивого» шага: roundNice(337.5, 10) → 340
function roundNice(value, step) {
  return Math.round(value / step) * step;
}

// Цена и время СЛЕДУЮЩЕЙ стройки — считается по формуле, округляется до десятков
function nextBuild() {
  const b = CONFIG.build;
  const done = state.floors.length - 1;          // сколько этажей уже над лобби

  const speed = timeMult('build');               // улучшение «Скорость стройки»
  if (done === 0) {
    return { cost: 0, seconds: Math.max(5, Math.round(b.firstSeconds * speed)) };  // первая стройка — подарок
  }
  const mult = Math.pow(b.growth, done - 1);     // 1, 1.5, 2.25, 3.375...
  return {
    cost: roundNice(b.baseCost * mult, b.roundTo),
    seconds: Math.max(b.roundTo, roundNice(b.baseSeconds * mult * speed, b.roundTo))
  };
}

// Сейчас идёт стройка или ждём выбор типа?
function isBusy() {
  return topFloor().status !== 'built';
}

function canBuild() {
  return !isBusy() && state.coins >= nextBuild().cost;
}

// Можно ли выбрать этот тип для этажа num? Вернёт текст причины или null
function lockReason(type, num) {
  const ft = CONFIG.floorTypes[type];
  if (ft.unlockAt && num < ft.unlockAt) return t('lock.floor', { n: ft.unlockAt });
  // Без комнаты сна магазины некому открыть — игра встанет. Поэтому сначала жильё
  if (ft.kind === 'work' && !state.floors.some(f => isBuilt(f, 'living'))) return t('lock.home');
  return null;
}

// Нажали «Построить этаж»
function startBuild() {
  if (!canBuild()) return;

  const { cost, seconds } = nextBuild();
  state.coins -= cost;

  const floor = {
    num: state.floors.length + 1,
    type: null,
    status: 'building',
    endsAt: Date.now() + seconds * 1000   // момент, когда стройка закончится
  };
  state.floors.push(floor);

  sfx('build');
  addFloorView(floor);
  updateHud();
}

// Нижняя кнопка: строить новый этаж или выбрать тип готового
function onBuildButton() {
  const top = topFloor();
  if (top.status === 'choose') showChooser(top.num);
  else startBuild();
}

// Выбрали тип в окошке
function chooseFloorType(num, type) {
  const floor = getFloor(num);
  if (!floor || floor.status !== 'choose') return;
  if (lockReason(type, num)) return;

  const ft = CONFIG.floorTypes[type];
  floor.type = type;
  floor.status = 'built';
  if (ft.kind === 'work') initShop(floor);
  if (ft.kind === 'lux') { floor.vips = []; floor.cash = 0; floor.fishCash = 0; }

  updateFloorView(floor);
  floorAppearView(num);
  sfx('appear');
  hideChooser();
  updateHud();
}


// ---------- Жильцы и работа ----------

// Номер имени, которого ещё нет в башне. Повтор — очень редко (2%) или когда имена кончились.
// Кот хранит номер, а не само имя: так он переименуется при смене языка (см. names.js)
function pickNameIdx() {
  const used = new Set(state.residents.map(r => r.nameIdx));
  const all = CAT_NAMES.map((_, i) => i);
  const free = all.filter(i => !used.has(i));
  if (!free.length || Math.random() < 0.02) return randomItem(all);
  return randomItem(free);
}

// Гость заселился в комнату сна
function addResident(guest, num) {
  const nameIdx = pickNameIdx();
  const r = {
    id: ++state.residentSeq,
    name: CAT_NAMES[nameIdx],
    nameIdx,
    breed: guest.breed,
    home: num,
    job: null,
    dream: randomItem(workTypes()),
    idle: 0                                       // сколько секунд игры без работы
  };
  state.residents.push(r);
  chatSay('hello', r, { dream: shopName(r.dream) });
  return r;
}

// Работает ли кот на работе мечты
function isDreamJob(r) {
  return r.job !== null && getFloor(r.job).type === r.dream;
}

// Склад нового магазина: на каждый товар по полной партии, поставок нет
function initShop(floor) {
  floor.stock = Array(CONFIG.work.slots).fill(stockCap());
  floor.deliveryAt = Array(CONFIG.work.slots).fill(null);   // когда приедет поставка (или null)
}

// Товары этажа из config.js
function productsOf(floor) {
  return CONFIG.products[floor.type] || [];
}

// Кто отвечает за товар slot на этаже num (или undefined)
function workerOf(num, slot) {
  return state.residents.find(r => r.job === num && r.slot === slot);
}

// Первый свободный товар на этаже (за который ещё никто не отвечает)
function freeSlot(num) {
  for (let i = 0; i < CONFIG.work.slots; i++) if (!workerOf(num, i)) return i;
  return null;
}

// Устроить жильца на этаж num (null — уволить). Кот берёт свободный товар
function assignJob(id, num) {
  const r = getResident(id);
  if (!r) return;
  if (num === r.job) return;
  if (num !== null) {
    const floor = getFloor(num);
    if (!floor || !isBuilt(floor, 'work')) return;
    if (freeSlot(num) === null) return;                 // мест нет
  }
  const hadJob = r.job !== null;
  r.job = num;
  r.slot = num === null ? null : freeSlot(num);
  r.idle = 0; r.idleStage = 0;
  if (num === null) { if (hadJob) chatSay('fired', r); }
  else chatSay(isDreamJob(r) ? 'dreamJob' : 'job', r, jobVars(r));
  placeResidentView(r);
  refreshResidentsModal();
  refreshShopModal();
}

// Товар продаётся, если за него кто-то отвечает и он есть на складе
function isSelling(floor, slot) {
  return Boolean(workerOf(floor.num, slot)) && floor.stock[slot] > 0;
}

// Сколько штук этаж может продать прямо сейчас
function stockAvailable(floor) {
  let n = 0;
  for (let i = 0; i < CONFIG.work.slots; i++) if (isSelling(floor, i)) n += floor.stock[i];
  return n;
}

// Рабочий этаж открыт, если там есть хотя бы один работник
function isOpen(floor) {
  return isBuilt(floor, 'work') && workersIn(floor.num) > 0;
}

// Гостям есть что купить: открыт и товар в наличии (с учётом тех, кто уже едет)
function hasGoodsFor(floor) {
  return isOpen(floor) && stockAvailable(floor) - headingTo(floor.num) > 0;
}

// Сколько секунд едет поставка товара slot (на работе мечты — быстрее)
function deliverySeconds(num, slot) {
  const w = workerOf(num, slot);
  const k = w && isDreamJob(w) ? CONFIG.work.dreamDelivery : 1;
  return Math.max(1, Math.round(CONFIG.work.deliverySeconds * k * timeMult('delivery')));
}

// Сколько стоит закупка партии: половина выручки по базовой цене, до десятков.
// Продаём по текущей цене (с улучшением) — поэтому «Цены товаров» растят прибыль
// Платим только за недостающие штуки (дозаказ), на распродаже — со скидкой (events.js)
function restockCost(floor, slot) {
  const base = productsOf(floor)[slot].price;
  const missing = Math.max(0, stockCap() - floor.stock[slot]);
  const raw = missing * base * CONFIG.work.purchaseShare * saleFactor(floor.num);
  return Math.max(1, Math.round(raw));    // точная цена, только без дробей (12,5 → 13)
}

// Страховка от тупика: денег нет ни на одну закупку и во всей башне нечего продавать
function isBroke() {
  const shops = state.floors.filter(f => isBuilt(f, 'work'));
  const anything = shops.some(f => stockAvailable(f) > 0 || f.deliveryAt.some(Boolean));
  if (anything) return false;
  const costs = [];
  shops.forEach(f => { for (let i = 0; i < CONFIG.work.slots; i++) if (workerOf(f.num, i) && f.stock[i] === 0) costs.push(restockCost(f, i)); });
  return costs.length > 0 && state.coins < Math.min(...costs);
}

// Цена заказа прямо сейчас (0 — в долг, когда совсем нет денег)
function orderPrice(floor, slot) {
  return isBroke() ? 0 : restockCost(floor, slot);
}

// Тапнули «Заказать»: платим закупку, поставка поехала. Пока едет, этот товар не продаётся
function orderDelivery(num, slot) {
  const f = getFloor(num);
  if (!f || !isBuilt(f, 'work')) return;
  if (!workerOf(num, slot)) return;                     // некому принять товар
  if (f.deliveryAt[slot] || f.stock[slot] >= stockCap()) return;  // уже едет или полка полная
  const cost = orderPrice(f, slot);
  if (state.coins < cost) return;                       // не хватает на закупку
  state.coins -= cost;
  f.deliveryAt[slot] = Date.now() + deliverySeconds(num, slot) * 1000;
  refreshShopModal();
  updateHud();
}

// Поставки, которые уже приехали: сразу вся партия. Вернёт, сколько приехало
function arriveDeliveries(now) {
  let arrived = 0;
  state.floors.forEach(f => {
    if (!isBuilt(f, 'work')) return;
    f.deliveryAt.forEach((t, i) => {
      if (t && now >= t) {
        f.stock[i] = stockCap();
        f.deliveryAt[i] = null;
        arrived++;
        if (workerOf(f.num, i)) chatSay('arrived', workerOf(f.num, i), { item: productsOf(f)[i].name }, { floor: f.num });
      }
    });
  });
  if (arrived) { refreshShopModal(); sfx('whoosh'); }
  return arrived;
}

// Гость купил 1 случайный товар из тех, что в наличии. Вернёт цену (0 — нечего купить)
function sellOne(num) {
  const f = getFloor(num);
  const slots = [];
  for (let i = 0; i < CONFIG.work.slots; i++) if (isSelling(f, i)) slots.push(i);
  if (!slots.length) return 0;

  const slot = randomItem(slots);
  f.stock[slot]--;
  if (f.stock[slot] === 0) {
    chatSay('outOfStock', workerOf(num, slot), { shop: shopName(f.type), item: productsOf(f)[slot].name }, { floor: num });
  }
  refreshShopModal();
  return priceOf(f, slot);
}


// ---------- Касса люкса ----------

// Люкс копит аренду за прошедшие dt секунд
function earn(dt) {
  state.floors.forEach(f => {
    if (isBuilt(f, 'lux')) {
      const L = CONFIG.lux;
      const vips = f.vips.length;
      const coinRate = vips * luxCoins(f) / (L.coinsEveryMinutes * 60);
      const fishRate = vips / (L.fishEveryHours * 3600);
      f.cash     = Math.min(f.cash + coinRate * dt,     Math.max(coinRate * L.cashHours * 3600, f.cash));
      f.fishCash = Math.min(f.fishCash + fishRate * dt, Math.max(fishRate * L.cashHours * 3600, f.fishCash));
    }
  });
}

// Тапнули значок кассы над этажом
function collectCash(num) {
  const f = getFloor(num);
  if (!f || f.cash === undefined) return;

  const coins = Math.floor(f.cash);
  const fish = Math.floor(f.fishCash || 0);
  if (!coins && !fish) return;

  state.coins += coins;
  state.fish += fish;
  f.cash -= coins;
  if (fish) f.fishCash -= fish;

  showCollectView(num, coins, fish);
  updateHud();
}


// ---------- Улучшения ----------

// Уровень улучшения: общего (лифт, стройка, доставка) или этажа (цены, VIP-зона)
function upLevel(id, floor) {
  if (id === 'price') return floor.priceLvl || 0;
  if (id === 'vip')   return floor.vipLvl || 0;
  return state.upgrades[id] || 0;
}

// Цена следующего уровня: base × 1.5^уровень, округляем до десятков. null — максимум
function upCost(id, floor) {
  const u = CONFIG.upgrades[id];
  const lvl = upLevel(id, floor);
  if (lvl >= u.max) return null;
  return roundNice(u.base * Math.pow(CONFIG.build.growth, lvl), CONFIG.build.roundTo);
}

// Купить уровень. floor — для цен магазина и VIP-зоны
function buyUpgrade(id, floor) {
  const cost = upCost(id, floor);
  if (cost === null || state.coins < cost) return;
  state.coins -= cost;
  if (id === 'price')    floor.priceLvl = upLevel(id, floor) + 1;
  else if (id === 'vip') floor.vipLvl = upLevel(id, floor) + 1;
  else                   state.upgrades[id] = upLevel(id) + 1;
  sfx('upgrade');
  refreshUpgradesModal();
  refreshShopModal();
  updateHud();
}

// Сколько штук помещается на полку: база + улучшение «Объём склада»
function stockCap() {
  return CONFIG.work.stockSize + CONFIG.upgrades.storage.step * upLevel('storage');
}

// Во сколько раз короче время: 0.9 за каждый уровень «скорости»
function timeMult(id) {
  return Math.pow(CONFIG.timeFactor, upLevel(id));
}

// Цена товара с учётом улучшения «Цены товаров» этого этажа (округляем до целых)
function priceOf(floor, slot) {
  const k = 1 + CONFIG.upgrades.price.step * upLevel('price', floor);
  return Math.round(productsOf(floor)[slot].price * k);
}

// Аренда одного VIP за период с учётом «VIP-зоны»
function luxCoins(floor) {
  return CONFIG.lux.coins * (1 + CONFIG.upgrades.vip.step * upLevel('vip', floor));
}


// ---------- Траты рыбок ----------

// Достроить сразу: 1 рыбка за каждые начатые 5 минут оставшегося времени
function finishBuildCost(floor) {
  const left = Math.max(0, (floor.endsAt - Date.now()) / 1000);
  return Math.max(1, Math.ceil(left / (CONFIG.fish.buildPerMinutes * 60)));
}

function finishBuildNow(num) {
  const f = getFloor(num);
  if (!f || f.status !== 'building') return;
  const cost = finishBuildCost(f);
  if (state.fish < cost) return;
  state.fish -= cost;
  f.endsAt = Date.now();        // следующий тик сам покажет выбор типа
  updateHud();
}

// Поставка приезжает сразу
function instantDelivery(num, slot) {
  const f = getFloor(num);
  if (!f || !f.deliveryAt || !f.deliveryAt[slot]) return;
  if (state.fish < CONFIG.fish.delivery) return;
  state.fish -= CONFIG.fish.delivery;
  f.deliveryAt[slot] = Date.now();
  arriveDeliveries(Date.now());
  updateHud();
}


// ---------- Робот-лифтёр ----------

function autoLiftActive() {
  return Date.now() < state.autoLiftUntil;
}

// Цена найма: 100 монет за каждый этаж над лобби
function autoLiftCost() {
  return CONFIG.autoLift.costPerFloor * Math.max(1, state.floors.length - 1);
}

// Нанять на 10 минут (за монеты или за рыбки). Уже работает — продлеваем ещё на 10
function buyAutoLift(withFish) {
  if (withFish) {
    if (state.fish < CONFIG.fish.autoLift) return;
    state.fish -= CONFIG.fish.autoLift;
  } else {
    const cost = autoLiftCost();
    if (state.coins < cost) return;
    state.coins -= cost;
  }
  const from = Math.max(Date.now(), state.autoLiftUntil);
  state.autoLiftUntil = from + CONFIG.autoLift.minutes * 60 * 1000;
  refreshUpgradesModal();
  updateHud();
}


// ---------- Гости ----------

// Люкс, где есть свободное место
function luxWithRoom() {
  return state.floors.find(f =>
    isBuilt(f, 'lux') &&
    f.vips.length + headingTo(f.num) < CONFIG.floorTypes[f.type].residents
  );
}

// Сколько ДРУГИХ гостей (кроме guest) едут на этаж num
function othersHeadingTo(num, guest) {
  return headingTo(num) - (guest && guest.dest === num ? 1 : 0);
}

// Куда гостю ещё можно ехать. Возвращает списки этажей
function destOptions(guest) {
  const homes = state.floors.filter(f => isBuilt(f, 'living') &&
    residentsIn(f.num) + othersHeadingTo(f.num, guest) < CONFIG.floorTypes[f.type].residents);
  const shops = state.floors.filter(f => isOpen(f) &&
    stockAvailable(f) - othersHeadingTo(f.num, guest) > 0);
  const luxes = state.floors.filter(f => isBuilt(f, 'lux') &&
    f.vips.length + othersHeadingTo(f.num, guest) < CONFIG.floorTypes[f.type].residents);
  return { homes, shops, luxes };
}

// Этаж гостя всё ещё подходит? (магазин мог закрыться или распродаться)
function isDestValid(guest) {
  const f = getFloor(guest.dest);
  if (!f) return false;
  const o = destOptions(guest);
  const list = guest.vip ? o.luxes : guest.resident ? o.homes : o.shops;
  return list.includes(f);
}

// Каждый тик: гости, чей этаж стал недоступен, выбирают другой. Некуда — уходят
function revalidateGuests() {
  const g = state.guests;
  const all = [...g.waiting];
  if (g.inCab && !state.lift.moving) all.push(g.inCab);
  all.forEach(guest => {
    if (isDestValid(guest)) return;
    const o = destOptions(guest);
    // Сначала того же вида (VIP → люкс, жилец → комната, покупатель → магазин), иначе любой
    const same = guest.vip ? o.luxes : guest.resident ? o.homes : o.shops;
    const pool = same.length ? same : [...o.homes, ...o.shops];
    if (!pool.length) {
      if (g.inCab === guest) return;          // в кабинке — пусть ждёт, вдруг что-то откроется
      g.waiting = g.waiting.filter(x => x !== guest);
      guestLeavesView(guest);
      return;
    }
    const dest = randomItem(pool);
    guest.dest = dest.num;
    if (!same.length) { guest.vip = false; guest.resident = kindOf(dest) === 'living'; }
    if (kindOf(dest) !== 'work' && guest.special) {      // особые гости — только в магазины
      guest.special = null;
      if (guest.sneakUntil) { guest.sneakUntil = null; sneakEndView(guest); }
    }
    updateGuestBubbleView(guest);
  });
}

// Пришёл новый гость. Вернёт false, если везти пока некуда
function spawnGuest() {
  const g = state.guests;
  // Комнаты сна со свободным местом — туда едут будущие жильцы
  const homes = state.floors.filter(f =>
    isBuilt(f, 'living') &&
    residentsIn(f.num) + headingTo(f.num) < CONFIG.floorTypes[f.type].residents
  );
  // Магазины, где есть что купить — туда едут покупатели. Остальные никого не ждут
  const shops = state.floors.filter(hasGoodsFor);
  const regular = [...homes, ...shops];
  const lux = luxWithRoom();
  if (!regular.length && !lux) return false;

  g.count++;
  const isVip = Boolean(lux) && (g.count % CONFIG.guests.vipEvery === 0 || !regular.length);
  const dest = isVip ? lux : randomItem(regular);

  const guest = {
    id: g.count,
    breed: randomItem(['ginger', 'black', 'grey', 'calico']),
    dest: dest.num,
    vip: isVip,
    resident: !isVip && kindOf(dest) === 'living',  // едет заселяться
    special: !isVip && kindOf(dest) === 'work' ? rollSpecial() : null,   // щедрый / воришка / обжора (visitors.js)
    waited: 0                                       // сколько секунд игры ждёт лифт (терпение)
  };
  prepareSpecial(guest);                          // недоброжелатель сначала крутится у входа (visitors.js)
  g.waiting.push(guest);
  addGuestView(guest);
  if (guest.sneakUntil) warnIntruder(guest);
  g.nextAt = Date.now() + guestInterval() * 1000;
  return true;
}

// Тапнули кабинку: гость из лобби заходит
function boardGuest() {
  const g = state.guests;
  const lift = state.lift;
  if (lift.moving || lift.floor !== 1) return;   // кабинка должна стоять в лобби
  if (g.inCab) return;                          // уже занята
  const i = g.waiting.findIndex(x => !isSneaking(x));   // первый в очереди (недоброжелатель у входа не в счёт)
  if (i < 0) return;                            // никого нет

  const guest = g.waiting.splice(i, 1)[0];
  g.inCab = guest;
  boardView(guest);

}

// Через сколько секунд придёт следующий гость — зависит от рейтинга башни (social.js)
function guestInterval() {
  return ratingGuestSeconds();
}

// Кабинка приехала на этаж
function onLiftArrive(num) {
  const guest = state.guests.inCab;
  if (!guest) return;                 // ехали пустыми — ничего не происходит

  if (num === guest.dest) {
    sfx('ding');
    deliverGuest(guest, num);
  } else if (num !== 1) {
    wrongFloorView();                 // не туда! гость остаётся в кабинке
  }
}

// Довезли куда надо: гость выходит (VIP оставляет чаевые), кабинка едет в лобби
function deliverGuest(guest, num) {
  const tip = guest.vip ? CONFIG.guests.vipTip : 0;
  state.coins += tip;
  state.guests.inCab = null;
  clearCabView();

  if (guest.vip) {
    getFloor(num).vips.push(guest.breed);        // VIP заселился в люкс навсегда
    chatSay('vip', { name: t('chat.vipGuest'), breed: guest.breed }, {}, { floor: num });
    visitorView(guest.breed, num, { vip: true });
  } else if (guest.resident) {
    const r = addResident(guest, num);           // новый жилец
    sfx('meow');
    placeResidentView(r, { x: 3 });
  } else {
    visitorView(guest.breed, num, { leaveAfter: CONFIG.guests.staySeconds, badge: specialIcon(guest) });
    if (guest.special) specialVisit(guest, num);   // сюрприз от особого гостя (visitors.js)
    else shopperBuys(num);
  }

  if (tip) showTipView(tip);
  updateHud();
  setTimeout(returnCab, CONFIG.lift.returnDelay * 1000);
}

// Покупатель в магазине: берёт 1 товар
function shopperBuys(num) {
  if (!isBuilt(getFloor(num), 'work')) return;
  const price = sellOne(num);
  if (price) {
    state.coins += price;
    showSaleView(num, price);
    sfx('coin');
  }
}

// Довезли — кабинка сама едет вниз в лобби (с анимацией)
function returnCab() {
  const lift = state.lift;
  if (lift.moving || lift.floor === 1 || state.guests.inCab) return;
  const seconds = (lift.floor - 1) * CONFIG.lift.secondsPerFloor * timeMult('lift');
  lift.moving = true;
  moveCabView(1, seconds);
  setTimeout(() => { lift.floor = 1; lift.moving = false; }, seconds * 1000);
}


// ---------- Лифт ----------

// Тапнули номер этажа в шахте
function sendLift(num) {
  const lift = state.lift;
  const floor = getFloor(num);

  if (lift.moving) return;                          // уже едет — ждём
  if (!state.guests.inCab) return;                  // пустую кабинку никуда не возим
  if (!floor || floor.status !== 'built') return;   // на стройку не возим
  if (num === lift.floor) return;                   // уже здесь

  const seconds = Math.abs(num - lift.floor) * CONFIG.lift.secondsPerFloor * timeMult('lift');
  lift.moving = true;
  moveCabView(num, seconds);

  setTimeout(() => {
    lift.floor = num;
    lift.moving = false;
    onLiftArrive(num);
  }, seconds * 1000);
}


// ---------- Часы игры: проверяем всё 4 раза в секунду ----------
function tick() {
  const now = Date.now();
  const dt = (now - state.lastTick) / 1000;
  earn(dt);
  state.lastTick = now;
  // «Время игры»: если вкладка спала, большой скачок не считаем — отсутствие не идёт котам в минус
  const playDt = Math.min(dt, 2);
  updateRating(playDt);
  idleTick(playDt);
  guestPatienceTick(playDt);
  chatter();
  arriveDeliveries(now);
  revalidateGuests();
  eventsTick(playDt);

  // Стройка
  const f = topFloor();
  if (f.status === 'building') {
    if (now >= f.endsAt) {
      f.status = 'choose';            // выбор откроется, когда игрок сам тапнет этаж или кнопку
      updateFloorView(f);
      sfx('appear');
    } else {
      updateCountdownView(f);
    }
  }

  // Гости: в лобби есть место и таймер истёк — приходит новый.
  // Лобби полное — таймер ждёт и стартует, когда место освободится.
  // Везти некуда — гость появится сразу, как только будет куда.
  const g = state.guests;
  if (g.waiting.length >= CONFIG.guests.maxWaiting) {
    g.nextAt = now + guestInterval() * 1000;
  } else if (now >= g.nextAt) {
    spawnGuest();
  }

  // Автопосадка: кабинка стоит в лобби, гость ждёт — через полсекунды заходит сам
  const lift = state.lift;
  sneakTick();                        // недоброжелатели у входа: время вышло — встают в очередь
  const canBoard = lift.floor === 1 && !lift.moving && !g.inCab && g.waiting.some(x => !isSneaking(x));
  if (!canBoard) lift.boardAt = null;
  else if (!lift.boardAt) lift.boardAt = now + CONFIG.lift.boardDelay * 1000;
  else if (now >= lift.boardAt) { lift.boardAt = null; boardGuest(); }

  // Робот-лифтёр: гость в кабинке — сам везёт куда надо
  if (autoLiftActive() && g.inCab && !lift.moving && lift.floor !== g.inCab.dest) {
    sendLift(g.inCab.dest);
  }

  updateFloorsInfoView();
  updateShopTimersView();
  updateAutoLiftView();
  updateRatingView();
  updateEventBadgeView();
  updateCabReadyView();
  updateLiftNumsView();
  updateLiftArrowView();
  tutorialTick();
  updateHud();
}


// ---------- Старт ----------
function startGame() {
  const report = loadGame();          // сохранение есть? подхватываем
  applyLanguage();                    // язык: из сохранения или по браузеру

  renderTower();
  startCats();
  // Жильцы — на работу или домой, VIP — в свои люксы
  state.residents.forEach(r => placeResidentView(r));
  state.floors.forEach(f => {
    if (isBuilt(f, 'lux')) f.vips.forEach(breed => visitorView(breed, f.num, { vip: true, x: null }));
  });
  updateFloorsInfoView();
  updateHud();
  if (report) showWelcomeBack(report);
  showDaily();                        // подарок дня — поверх «с возвращением»
  updateRatingView();
  startAutosave();
  initMusic();                        // фоновая музыка (music.js)

  document.getElementById('btn-settings').addEventListener('click', openSettings);
  document.getElementById('btn-upgrades').addEventListener('click', openUpgrades);
  document.getElementById('btn-rating').addEventListener('click', openRating);
  document.getElementById('btn-chat').addEventListener('click', openChat);
  document.getElementById('btn-event').addEventListener('click', openEvent);
  document.querySelector('#tut .tut-next').addEventListener('click', tutorialNext);
  document.querySelector('#tut .tut-skip').addEventListener('click', skipTutorial);
  document.getElementById('btn-build').addEventListener('click', onBuildButton);
  document.getElementById('lift-cab').addEventListener('click', boardGuest);
  document.getElementById('to-lift').addEventListener('click', scrollToLift);
  window.addEventListener('scroll', updateLiftArrowView, { passive: true });
  window.addEventListener('resize', layoutShaft);
  setInterval(tick, 250);
}

// Сначала спрашиваем облако (в Telegram), потом запускаем игру
cloudInit().finally(startGame);
