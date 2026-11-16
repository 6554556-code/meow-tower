// =====================================================
//  view.js — всё, что рисуется и двигается на экране
//  Читает «память» из game.js и показывает её
// =====================================================

const towerEl = document.getElementById('tower');
const shaftEl = document.getElementById('shaft');
const cabEl   = document.getElementById('lift-cab');


// ---------- Мелкие помощники ----------
function rand(min, max) {
  return min + Math.random() * (max - min);
}

// 1139 → «1 139» (по-английски «1,139»)
function fmtNum(n) {
  return n.toLocaleString(lang() === 'ru' ? 'ru-RU' : 'en-US');
}

// 68 секунд → «1:08»
function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function floorInfo(type) {
  return CONFIG.floorTypes[type];
}

function floorEl(num) {
  return towerEl.querySelector(`.floor[data-num="${num}"]`);
}

// Меняем HTML, только если он правда изменился (чтобы ничего не мигало)
function setHTML(el, html) {
  if (el.innerHTML !== html) el.innerHTML = html;
}

const COIN = '<img class="ico" src="assets/ui/coin.png" alt="">';
const FISH = '<img class="ico" src="assets/ui/fish.png" alt="">';


// =====================================================
//  БАШНЯ
// =====================================================

// Нарисовать башню целиком: сад на крыше сверху, дальше этажи от верхнего к лобби
function renderTower() {
  towerEl.innerHTML = `
    <div class="roof-block">
      <img src="assets/floors/roof_garden.png" alt="${t('roof.alt')}">
    </div>`;
  [...state.floors].reverse().forEach(f => towerEl.appendChild(makeFloorBlock(f)));
  layoutShaft();
}

// Блок одного этажа: подпись сверху + картинка (или стройка) под ней
function makeFloorBlock(floor) {
  const block = document.createElement('div');
  block.className = 'floor-block';
  block.dataset.num = floor.num;

  const isLobby = floor.type === 'lobby';
  block.innerHTML =
    `<div class="floor-label">
       <span class="fl-name"></span>
       <span class="fl-right"><span class="fl-occ"></span><span class="fl-num">${floor.num}</span></span>
     </div>` +
    `<div class="floor${isLobby ? ' lobby' : ''}" data-num="${floor.num}"><img alt=""></div>`;

  fillFloor(block, floor);
  return block;
}

// Обновить содержимое этажа по его статусу (котов внутри не трогаем)
function fillFloor(block, floor) {
  const el = block.querySelector('.floor');
  const img = el.querySelector('img');
  const name = block.querySelector('.fl-name');
  let cover = el.querySelector('.construct');

  if (floor.status === 'built') {
    const ft = floorInfo(floor.type);
    if (cover) cover.remove();
    el.classList.remove('is-building');
    img.src = 'assets/floors/' + ft.image;
    img.alt = ft.name;
    name.textContent = `${ft.icon} ${ft.name}`;

    // Люкс: значок кассы (тап — собрать аренду), тап по этажу — карточка люкса
    if (ft.kind === 'lux') {
      if (!el.querySelector('.cash')) {
        const btn = document.createElement('button');
        btn.className = 'cash';
        btn.hidden = true;
        btn.addEventListener('click', e => { e.stopPropagation(); collectCash(floor.num); });
        el.appendChild(btn);
      }
      el.classList.add('tappable');
      el.onclick = () => openShop(floor.num);
    }
    // Магазин: значок склада («нужна поставка» / «едет»), табличка «закрыто», тап — карточка товаров
    if (ft.kind === 'work') {
      if (!el.querySelector('.cash')) {
        const btn = document.createElement('button');
        btn.className = 'cash stock-badge';
        btn.hidden = true;
        btn.addEventListener('click', e => { e.stopPropagation(); openShop(floor.num); });
        el.appendChild(btn);
      }
      if (!el.querySelector('.closed-tag')) el.insertAdjacentHTML('beforeend', '<div class="closed-tag"></div>');
      el.classList.add('tappable');
      el.onclick = () => openShop(floor.num);
    }
    // Комната сна: тап — список жильцов
    if (ft.kind === 'living') {
      el.classList.add('tappable');
      el.onclick = () => openResidents(floor.num);
    }
  } else {
    // Стройка или «готово, выбери тип» — показываем леса
    el.classList.add('is-building');
    if (!cover) {
      cover = document.createElement('div');
      cover.className = 'construct';
      cover.innerHTML = '<span class="construct-text"></span><button class="fish-btn rush" hidden></button>';
      cover.querySelector('.rush').onclick = e => { e.stopPropagation(); finishBuildNow(floor.num); };
      el.appendChild(cover);
    }
    updateRushView(floor, cover);
    const text = cover.querySelector('.construct-text');
    if (floor.status === 'building') {
      text.textContent = '🚧 ' + fmtTime((floor.endsAt - Date.now()) / 1000);
      name.textContent = t('floor.building');
    } else {
      text.textContent = t('floor.ready');
      name.textContent = t('floor.choose');
      el.classList.add('tappable', 'ready-choose');
      el.onclick = () => showChooser(floor.num);
    }
  }
  if (floor.status === 'built') el.classList.remove('ready-choose');
}

// Гость передумал — обновить облачко (в лобби или в кабинке)
function updateGuestBubbleView(guest) {
  const html = bubbleHTML(guest);
  const lobbyCat = lobbyEl().querySelector(`.guest[data-guest="${guest.id}"]`);
  const holder = lobbyCat || (state.guests.inCab === guest ? document.getElementById('cab-rider') : null);
  if (!holder) return;
  const old = holder.querySelector('.bubble');
  if (old) old.outerHTML = html;
}

function getBlock(num) {
  return towerEl.querySelector(`.floor-block[data-num="${num}"]`);
}

// Новый этаж встаёт сразу под крышей
function addFloorView(floor) {
  towerEl.querySelector('.roof-block').after(makeFloorBlock(floor));
  layoutShaft();
}

function updateFloorView(floor) {
  fillFloor(getBlock(floor.num), floor);
  layoutShaft();
}

function updateCountdownView(floor) {
  const block = getBlock(floor.num);
  block.querySelector('.construct-text').textContent = '🚧 ' + fmtTime((floor.endsAt - Date.now()) / 1000);
  updateRushView(floor, block.querySelector('.construct'));
}

// Кнопка «⚡ достроить за рыбки» на стройке
function updateRushView(floor, cover) {
  const btn = cover.querySelector('.rush');
  if (!btn) return;
  btn.hidden = floor.status !== 'building';
  if (btn.hidden) return;
  const cost = finishBuildCost(floor);
  setHTML(btn, `⚡ ${FISH}${cost}`);
  btn.disabled = state.fish < cost;
}

// Каждый тик: заполненность в подписях, касса, «закрыто»
function updateFloorsInfoView() {
  state.floors.forEach(f => {
    if (f.status !== 'built') return;
    const block = getBlock(f.num);
    const el = block.querySelector('.floor');
    const occ = block.querySelector('.fl-occ');
    const kind = kindOf(f);
    const cap = floorInfo(f.type).residents;

    if (kind === 'living') setHTML(occ, `🏠 ${residentsIn(f.num)}/${cap}`);
    if (kind === 'lux')    setHTML(occ, `👑 ${f.vips.length}/${cap}`);
    if (kind === 'work') {
      const w = workersIn(f.num);
      const ev = state.event && state.event.floor === f.num && !(state.event.type === 'order' && state.event.status === 'offer')
        ? EVENT_ICON[state.event.type] + ' ' : '';
      setHTML(occ, `${ev}🐾 ${w}/${CONFIG.work.slots}`);
      // Закрыт: нет работников или всё распродано
      const tag = w === 0 ? t('floor.closedNoWorkers') : stockAvailable(f) === 0 ? t('floor.closedNoStock') : '';
      el.classList.toggle('closed', Boolean(tag));
      setHTML(el.querySelector('.closed-tag'), tag);
      updateStockBadge(f, el.querySelector('.stock-badge'));
      return;
    }

    // Значок кассы люкса
    const btn = el.querySelector('.cash');
    if (btn) {
      const coins = Math.floor(f.cash);
      const fish = Math.floor(f.fishCash || 0);
      btn.hidden = !coins && !fish;
      setHTML(btn, (coins ? `${COIN}${fmtNum(coins)}` : '') + (fish ? ` ${FISH}${fish}` : ''));
      btn.classList.toggle('full', isCashFull(f));
    }
  });
}

// Значок склада магазина: «📦 !» — пора заказать, «🚚 0:42» — поставка едет
function updateStockBadge(f, btn) {
  let needOrder = false;
  let soonest = null;
  for (let i = 0; i < CONFIG.work.slots; i++) {
    if (!workerOf(f.num, i)) continue;
    if (f.deliveryAt[i]) soonest = soonest === null ? f.deliveryAt[i] : Math.min(soonest, f.deliveryAt[i]);
    else if (f.stock[i] === 0) needOrder = true;
  }
  btn.hidden = !needOrder && soonest === null;
  btn.classList.toggle('full', needOrder);          // пульсирует, когда надо заказать
  if (needOrder) setHTML(btn, '📦 !');
  else if (soonest !== null) setHTML(btn, `<img class="ico" src="assets/items/truck.png" alt=""> ${fmtTime((soonest - Date.now()) / 1000)}`);
}

// Гость купил товар: «+25 🪙» над этажом
function showSaleView(num, price) {
  showCollectView(num, price, 0);
  flyCoinsView(floorEl(num), 3);
}

// Монетки летят от элемента к балансу наверху, баланс «подпрыгивает»
function flyCoinsView(fromEl, count = 3) {
  const pill = document.getElementById('coins').closest('.pill');
  if (!fromEl || !pill || !fromEl.getBoundingClientRect) return;
  const a = fromEl.getBoundingClientRect();
  const b = pill.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const c = document.createElement('img');
    c.src = 'assets/ui/coin.png';
    c.className = 'fly-coin';
    const x0 = a.left + a.width * (0.6 + Math.random() * 0.3);
    const y0 = a.top + a.height * (0.2 + Math.random() * 0.4);
    c.style.left = x0 + 'px';
    c.style.top = y0 + 'px';
    document.body.appendChild(c);
    const dx = b.left + 12 - x0, dy = b.top + 8 - y0;
    const anim = c.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 30}px) scale(1.2)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.6)`, opacity: 0.8 }
    ], { duration: 700, delay: i * 90, easing: 'ease-in', fill: 'forwards' });
    anim.onfinish = () => {
      c.remove();
      pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
    };
  }
}

// Новый этаж «выезжает» с облачками пыли
function floorAppearView(num) {
  const block = getBlock(num);
  if (!block) return;
  block.classList.remove('appear'); void block.offsetWidth; block.classList.add('appear');
  const el = block.querySelector('.floor');
  for (let i = 0; i < 6; i++) {
    const d = document.createElement('span');
    d.className = 'dust';
    d.style.left = (5 + i * 18) + '%';
    d.style.animationDelay = (i * 40) + 'ms';
    el.appendChild(d);
    setTimeout(() => d.remove(), 900);
  }
}

// Касса люкса полная — значок пульсирует: «забери меня»
function isCashFull(f) {
  if (kindOf(f) === 'lux') {
    const L = CONFIG.lux;
    const max = f.vips.length * luxCoins(f) * (L.cashHours * 60 / L.coinsEveryMinutes);
    return max > 0 && f.cash >= max - 0.5;
  }
  return false;
}

// «+120 🪙» всплывает над этажом после сбора кассы
function showCollectView(num, coins, fish) {
  const pop = document.createElement('div');
  pop.className = 'collect-pop';
  pop.innerHTML = (coins ? `+${fmtNum(coins)} ${COIN}` : '') + (fish ? ` +${fish} ${FISH}` : '');
  floorEl(num).appendChild(pop);
  setTimeout(() => pop.remove(), 1300);
}


// =====================================================
//  ЛИФТ
// =====================================================

// Где низ этажа, в пикселях от низа башни (по нему ставим кабинку и номера)
function floorBottom(num) {
  const t = towerEl.getBoundingClientRect();
  const r = floorEl(num).getBoundingClientRect();
  return { bottom: t.bottom - r.bottom, height: r.height };
}

// Расставить номера этажей в шахте и поставить кабинку на место
function layoutShaft() {
  shaftEl.querySelectorAll('.lift-num').forEach(n => n.remove());

  state.floors.forEach(floor => {
    const { bottom, height } = floorBottom(floor.num);
    const btn = document.createElement('button');
    btn.className = 'lift-num';
    btn.textContent = floor.num;
    btn.style.bottom = (bottom + height / 2) + 'px';   // по центру этажа
    btn.disabled = floor.status !== 'built';
    btn.addEventListener('click', () => sendLift(floor.num));
    shaftEl.appendChild(btn);
  });

  if (!state.lift.moving) placeCab(state.lift.floor, 0);
}

// Поставить кабинку на этаж (seconds = 0 — мгновенно)
function placeCab(num, seconds) {
  cabEl.style.transition = (seconds ? `bottom ${seconds}s ease-in-out, ` : '') + 'opacity 0.2s';
  cabEl.style.bottom = floorBottom(num).bottom + 'px';
}

function moveCabView(num, seconds) {
  placeCab(num, seconds);
}

// Номера в шахте нажимаются, только когда в кабинке есть гость
function updateLiftNumsView() {
  shaftEl.classList.toggle('empty', !state.guests.inCab);
}

// Стрелка к лифту: кабинка ниже экрана → стрелка вниз.
// Мигает, если гость ждёт в лобби или сидит в кабинке
function updateLiftArrowView() {
  const arrow = document.getElementById('to-lift');
  const r = cabEl.getBoundingClientRect();
  const topEdge = document.querySelector('.topbar').getBoundingClientRect().bottom;
  const bottomEdge = document.querySelector('.bottombar').getBoundingClientRect().top;
  // Только когда лифт НИЖЕ экрана (кабинка уехала наверх — стрелка не нужна)
  arrow.hidden = !(r.top > bottomEdge - 10);
  if (arrow.hidden) return;

  // Мигает только из-за гостей: ждёт в лобби или сидит в кабинке
  const g = state.guests;
  arrow.classList.toggle('blink', g.waiting.length > 0 || Boolean(g.inCab));
}

function scrollToLift() {
  cabEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

// Прокрутить башню к этажу (для переходов из чата)
function scrollToFloor(num) {
  const el = floorEl(num);
  if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

// Гость не дождался лифта: облачко «😾» и тает
function guestLeavesView(guest) {
  const el = lobbyEl().querySelector(`.guest[data-guest="${guest.id}"]`);
  if (!el) return;
  const b = el.querySelector('.bubble');
  if (b) { b.textContent = '😾'; b.classList.add('wrong'); }
  el.style.transition = 'opacity 1s';
  el.style.opacity = '0';
  setTimeout(() => { el.remove(); layoutQueue(); }, 1000);
}

// Кабинка мигает, когда в лобби ждёт гость и можно сажать
function updateCabReadyView() {
  const g = state.guests;
  const ready = state.lift.floor === 1 && !state.lift.moving && !g.inCab && g.waiting.length > 0;
  cabEl.classList.toggle('ready', ready);
}


// =====================================================
//  ГОСТИ
// =====================================================

function lobbyEl() {
  return floorEl(1);
}

// Облачко над головой: «→ 4». VIP — с короной, будущий жилец — с домиком
function bubbleHTML(guest) {
  const mark = guest.vip ? '👑 ' : guest.special ? specialIcon(guest) + ' ' : guest.resident ? '🏠 ' : '';
  return `<div class="bubble${guest.vip ? ' vip' : ''}">${mark}→ ${guest.dest}</div>`;
}

// Новый гость встал в лобби
function addGuestView(guest) {
  const el = makeCatEl(guest.breed);
  el.classList.add('guest');
  el.dataset.guest = guest.id;
  el.dataset.pose = 'sit';
  el.dataset.dir = 'left';            // смотрит на лифт
  el.insertAdjacentHTML('beforeend', bubbleHTML(guest));
  lobbyEl().appendChild(el);
  layoutQueue();
}

// Расставить очередь: первый — ближе всех к лифту. Облачка через одно выше, чтобы не налезали
function layoutQueue() {
  state.guests.waiting.forEach((guest, i) => {
    const el = lobbyEl().querySelector(`.guest[data-guest="${guest.id}"]`);
    if (!el) return;
    el.style.left = (2 + i * 15) + '%';
    el.classList.toggle('bubble-up', i % 2 === 1);
  });
}

// Гость зашёл в кабинку
function boardView(guest) {
  const el = lobbyEl().querySelector(`.guest[data-guest="${guest.id}"]`);
  if (el) el.remove();

  const rider = document.getElementById('cab-rider');
  rider.innerHTML =
    `<div class="cat-sprite" style="background-image:url(assets/cats/cat_${guest.breed}.png)"></div>` +
    bubbleHTML(guest);
  layoutQueue();
  updateCabReadyView();
}

function clearCabView() {
  document.getElementById('cab-rider').innerHTML = '';
}

// Гость вышел на этаже: посетитель (гуляет и уходит) или VIP (остаётся)
function visitorView(breed, num, opts) {
  createCat(breed, floorEl(num), { x: 3, ...opts });
}

// Не тот этаж: облачко краснеет и трясётся
function wrongFloorView() {
  const bubble = document.querySelector('#cab-rider .bubble');
  if (!bubble) return;
  bubble.classList.remove('wrong');
  void bubble.offsetWidth;            // перезапуск анимации
  bubble.classList.add('wrong');
}

// «+40 🪙» всплывает над кабинкой
function showTipView(tip) {
  const pop = document.createElement('div');
  pop.className = 'tip-pop';
  pop.innerHTML = `+${fmtNum(tip)} ${COIN}`;
  pop.style.bottom = (parseFloat(cabEl.style.bottom) + cabEl.offsetHeight) + 'px';
  shaftEl.appendChild(pop);
  setTimeout(() => pop.remove(), 1300);
}


// =====================================================
//  ЖИЛЬЦЫ
// =====================================================

// Показать жильца там, где он сейчас: на работе или дома
function placeResidentView(r, opts = {}) {
  const old = towerEl.querySelector(`.cat[data-rid="${r.id}"]`);
  if (old) old.remove();
  const num = r.job ?? r.home;
  createCat(r.breed, floorEl(num), { rid: r.id, heart: isDreamJob(r), x: opts.x });
}

// Маленький портрет кота (кадр «сидит»)
function avatarHTML(breed, cls = '') {
  return `<div class="avatar ${cls}" style="background-image:url(assets/cats/cat_${breed}.png)"></div>`;
}

function jobText(r) {
  if (r.job === null) return t('res.noJob');
  const f = getFloor(r.job);
  const ft = floorInfo(f.type);
  return `${ft.icon} ${ft.name} · ${f.num}`;
}

// Какое окно жильцов открыто: этаж и (если выбран) кот
const residentsModal = { floor: null, rid: null };

function openResidents(num) {
  residentsModal.floor = num;
  residentsModal.rid = null;
  document.getElementById('residents').hidden = false;
  refreshResidentsModal();
}

function closeResidents() {
  residentsModal.floor = null;
  document.getElementById('residents').hidden = true;
}

function openResident(id) {
  residentsModal.rid = id;
  refreshResidentsModal();
}

// Перерисовать окошко (после устройства на работу и т.п.)
function refreshResidentsModal() {
  const num = residentsModal.floor;
  if (num === null) return;
  const box = document.getElementById('residents-body');
  const f = getFloor(num);
  const ft = floorInfo(f.type);

  // --- Карточка одного кота ---
  if (residentsModal.rid !== null) {
    const r = getResident(residentsModal.rid);
    const dream = floorInfo(r.dream);
    const shops = state.floors.filter(x => isBuilt(x, 'work')).reverse();

    const jobs = shops.length ? shops.map(s => {
      const st = floorInfo(s.type);
      const here = r.job === s.num;
      const w = workersIn(s.num);
      const full = !here && w >= CONFIG.work.slots;
      const isDream = s.type === r.dream;
      return `
        <button class="job${here ? ' here' : ''}${isDream ? ' dream' : ''}" data-job="${s.num}" ${here || full ? 'disabled' : ''}>
          <span>${st.icon} ${st.name} · ${s.num}</span>
          <span class="job-side">${isDream ? '❤️ ' : ''}${here ? t('res.here') : full ? t('res.full') : `🐾 ${w}/${CONFIG.work.slots}`}</span>
        </button>`;
    }).join('') : `<p class="hint">${t('res.nowhere')}</p>`;

    box.innerHTML = `
      <button class="back">${t('res.back')}</button>
      <div class="card">
        ${avatarHTML(r.breed, 'big')}
        <div class="card-name">${r.name}</div>
        <div class="card-line">${t('res.now', { job: jobText(r) })}</div>
        <div class="card-line dream-line">${t('res.dream', { dream: dream.icon + ' ' + dream.name })}</div>
        <div class="hint">${t('res.dreamHint')}</div>
      </div>
      <div class="modal-sub">${t('res.assign')}</div>
      <div class="jobs">${jobs}</div>
      ${r.job !== null ? `<button class="fire">${t('res.fire')}</button>` : ''}`;

    box.querySelector('.back').onclick = () => { residentsModal.rid = null; refreshResidentsModal(); };
    box.querySelectorAll('.job').forEach(b => b.onclick = () => assignJob(r.id, Number(b.dataset.job)));
    const fire = box.querySelector('.fire');
    if (fire) fire.onclick = () => assignJob(r.id, null);
    return;
  }

  // --- Список жильцов этажа ---
  const list = state.residents.filter(r => r.home === num);
  const rows = list.length ? list.map(r => `
      <button class="resident" data-rid="${r.id}">
        ${avatarHTML(r.breed)}
        <span class="res-text">
          <span class="res-name">${r.name}${isDreamJob(r) ? ' ❤️' : ''}</span>
          <span class="res-job">${jobText(r)}</span>
        </span>
        <span class="res-dream">❤️ ${floorInfo(r.dream).icon}</span>
      </button>`).join('')
    : `<p class="hint">${t('res.empty')}</p>`;

  box.innerHTML = `
    <div class="modal-title">${ft.icon} ${ft.name} · ${num}</div>
    <div class="modal-sub">${t('res.count', { n: list.length, max: ft.residents })}</div>
    <div class="residents-list">${rows}</div>`;

  box.querySelectorAll('.resident').forEach(b => b.onclick = () => openResident(Number(b.dataset.rid)));
}


// =====================================================
//  КАРТОЧКА МАГАЗИНА: товары, склад, поставки
// =====================================================

let shopModalFloor = null;

function openShop(num) {
  shopModalFloor = num;
  document.getElementById('shop').hidden = false;
  refreshShopModal();
}

function closeShop() {
  shopModalFloor = null;
  document.getElementById('shop').hidden = true;
}

// Перерисовать карточку целиком (после продажи, заказа, приезда поставки)
function refreshShopModal() {
  const num = shopModalFloor;
  if (num === null) return;
  const f = getFloor(num);
  const ft = floorInfo(f.type);
  const size = stockCap();
  const body = document.getElementById('shop-body');

  // --- Люкс: VIP, аренда, касса, улучшение «VIP-зона» ---
  if (kindOf(f) === 'lux') {
    const L = CONFIG.lux;
    const vips = f.vips.map(b => avatarHTML(b, 'mini')).join('') || `<span class="muted">${t('lux.none')}</span>`;
    const coins = Math.floor(f.cash);
    const fish = Math.floor(f.fishCash);
    body.innerHTML = `
      <div class="modal-title">${ft.icon} ${ft.name} · ${num}</div>
      <div class="modal-sub">VIP: ${f.vips.length}/${ft.residents}</div>
      <div class="vip-row">${vips}</div>
      <p class="hint">${t('lux.pays', { coins: Math.round(luxCoins(f)), min: L.coinsEveryMinutes, h: L.fishEveryHours, cap: L.cashHours })}</p>
      <div class="lux-cash">${t('lux.cash')} ${COIN}${fmtNum(coins)} ${FISH}${fish}
        <button class="up-btn" id="lux-collect" ${coins || fish ? '' : 'disabled'}>${t('lux.collect')}</button></div>
      <div class="up-list">${upRowHTML('vip', f)}</div>`;
    body.querySelector('#lux-collect').onclick = () => { collectCash(num); refreshShopModal(); };
    bindUpgradeButtons(body, f);
    return;
  }

  const rows = productsOf(f).map((p, i) => {
    const w = workerOf(num, i);
    const who = w
      ? `${avatarHTML(w.breed, 'mini')}<span>${w.name}${isDreamJob(w) ? ' ❤️' : ''}</span>`
      : `<span class="muted">${t('shop.noWorker')}</span>`;

    let action;
    if (!w)                   action = `<span class="muted">${t('shop.notSold')}</span>`;
    else if (f.deliveryAt[i]) action = `<span class="dl"><img class="ico" src="assets/items/truck.png" alt=""> <span class="dl-time" data-slot="${i}">${fmtTime((f.deliveryAt[i] - Date.now()) / 1000)}</span></span>
      <button class="fish-btn now" data-slot="${i}" data-fish="${CONFIG.fish.delivery}" ${state.fish < CONFIG.fish.delivery ? 'disabled' : ''}>⚡ ${FISH}${CONFIG.fish.delivery}</button>`;
    else if (f.stock[i] === 0) {
      const cost = orderPrice(f, i);
      const price = cost ? `${COIN}${fmtNum(cost)}` : t('shop.credit');
      action = `<button class="order" data-slot="${i}" data-cost="${cost}" ${state.coins < cost ? 'disabled' : ''}>
        <img class="ico" src="assets/items/truck.png" alt=""> ${price} · ${fmtTime(deliverySeconds(num, i))}</button>`;
    }
    else if (f.stock[i] < size) {
      // Дозаказ: товар ещё есть, но можно заранее пополнить до полной полки
      const cost = restockCost(f, i);
      action = `<span class="ok">${t('shop.onSale')}</span>
        <button class="order topup" data-slot="${i}" data-cost="${cost}" ${state.coins < cost ? 'disabled' : ''}>${t('shop.topup')} ${COIN}${fmtNum(cost)}</button>`;
    }
    else                      action = `<span class="ok">${t('shop.onSale')}</span>`;

    return `
      <div class="product${w ? '' : ' off'}">
        <img class="product-icon" src="assets/items/${p.icon}.png" alt="">
        <div class="product-main">
          <div class="product-name">${p.name} <span class="price">${COIN}${priceOf(f, i)}</span></div>
          <div class="stock-bar"><span style="width:${Math.min(100, f.stock[i] / size * 100)}%"></span></div>
          <div class="product-who">${who}</div>
        </div>
        <div class="product-side">
          <div class="stock-num">${f.stock[i]}/${size}</div>
          ${action}
        </div>
      </div>`;
  }).join('');

  body.innerHTML = `
    <div class="modal-title">${ft.icon} ${ft.name} · ${num}</div>
    <div class="modal-sub">${t('shop.workers', { n: workersIn(num), max: CONFIG.work.slots })}</div>
    ${eventBannerHTML(num)}
    <div class="up-list">${upRowHTML('price', f)}</div>
    <div class="products">${rows}</div>
    <p class="hint">${t('shop.hint')}</p>`;

  body.querySelectorAll('.order').forEach(b =>
    b.onclick = () => orderDelivery(num, Number(b.dataset.slot)));
  body.querySelectorAll('.fish-btn.now').forEach(b =>
    b.onclick = () => instantDelivery(num, Number(b.dataset.slot)));
  bindUpgradeButtons(body, f);
}

// Каждый тик: только таймеры поставок, чтобы кнопки не перерисовывались под пальцем
function updateShopTimersView() {
  if (shopModalFloor === null) return;
  const f = getFloor(shopModalFloor);
  document.querySelectorAll('#shop-body .dl-time').forEach(el => {
    const at = f.deliveryAt[Number(el.dataset.slot)];
    if (at) el.textContent = fmtTime((at - Date.now()) / 1000);
  });
}


// =====================================================
//  УЛУЧШЕНИЯ и РОБОТ-ЛИФТЁР
// =====================================================

// Что даёт улучшение на уровне lvl — для строки «сейчас → после»
function upEffect(id, lvl, floor) {
  const k = Math.pow(CONFIG.timeFactor, lvl);
  switch (id) {
    case 'lift':     return t('up.secPerFloor', { s: fmtDec(CONFIG.lift.secondsPerFloor * k, 2) });
    case 'build':    return lvl ? t('up.buildFaster', { p: Math.round((1 - k) * 100) }) : t('up.buildNormal');
    case 'delivery': return t('up.delivery', { t: fmtTime(Math.round(CONFIG.work.deliverySeconds * k)) });
    case 'storage':  return t('up.storage', { n: CONFIG.work.stockSize + CONFIG.upgrades.storage.step * lvl });
    case 'price':    return lvl ? t('up.prices', { p: Math.round(CONFIG.upgrades.price.step * lvl * 100) }) : t('up.pricesNormal');
    case 'vip':      return t('up.vip', { coins: Math.round(CONFIG.lux.coins * (1 + CONFIG.upgrades.vip.step * lvl)), min: CONFIG.lux.coinsEveryMinutes });
  }
}

// Строка одного улучшения: название, уровень, «сейчас → после», кнопка с ценой
function upRowHTML(id, floor) {
  const u = CONFIG.upgrades[id];
  const lvl = upLevel(id, floor);
  const cost = upCost(id, floor);
  const next = cost === null ? '' : ` → <b>${upEffect(id, lvl + 1, floor)}</b>`;
  const btn = cost === null
    ? `<button class="up-btn" disabled>${t('up.max')}</button>`
    : `<button class="up-btn" data-up="${id}" data-cost="${cost}" ${state.coins < cost ? 'disabled' : ''}>⬆️ ${COIN}${fmtNum(cost)}</button>`;
  return `
    <div class="up-row">
      <div class="up-icon">${u.img ? `<img src="assets/ui/${u.img}" alt="">` : u.icon}</div>
      <div class="up-main">
        <div class="up-name">${u.name} <span class="up-lvl">${t('up.lvl', { lvl, max: u.max })}</span></div>
        <div class="up-eff">${upEffect(id, lvl, floor)}${next}</div>
      </div>
      ${btn}
    </div>`;
}

function bindUpgradeButtons(root, floor) {
  root.querySelectorAll('.up-btn[data-up]').forEach(b => b.onclick = () => buyUpgrade(b.dataset.up, floor));
}

// Каждый тик: кнопки с ценой включаются, как только хватает монет
function updateUpgradeButtonsView() {
  document.querySelectorAll('.modal:not([hidden]) .up-btn[data-cost], .modal:not([hidden]) .order[data-cost]').forEach(b => {
    b.disabled = state.coins < Number(b.dataset.cost);
  });
  document.querySelectorAll('.modal:not([hidden]) [data-fish]').forEach(b => {
    b.disabled = state.fish < Number(b.dataset.fish);
  });
}

let upgradesOpen = false;

function openUpgrades() {
  upgradesOpen = true;
  document.getElementById('upgrades').hidden = false;
  refreshUpgradesModal();
}

function closeUpgrades() {
  upgradesOpen = false;
  document.getElementById('upgrades').hidden = true;
}

function refreshUpgradesModal() {
  if (!upgradesOpen) return;
  const body = document.getElementById('upgrades-body');
  const cost = autoLiftCost();
  const active = autoLiftActive();
  body.innerHTML = `
    <div class="modal-title">${t('up.title')}</div>
    <div class="modal-sub">${t('up.sub')}</div>
    <div class="up-list">${['lift', 'build', 'delivery', 'storage'].map(id => upRowHTML(id)).join('')}</div>

    <div class="robot">
      <div class="up-icon">🤖</div>
      <div class="up-main">
        <div class="up-name">${t('robot.name')}</div>
        <div class="up-eff">${t('robot.desc', { min: CONFIG.autoLift.minutes })}
          <span id="robot-left">${active ? t('robot.left', { t: fmtTime((state.autoLiftUntil - Date.now()) / 1000) }) : ''}</span></div>
      </div>
      <div class="robot-btns">
        <button class="up-btn" id="robot-buy" data-cost="${cost}" ${state.coins < cost ? 'disabled' : ''}>
          ${active ? t('robot.more') : t('robot.hire')} · ${COIN}${fmtNum(cost)}</button>
        <button class="up-btn fish" id="robot-fish" data-fish="${CONFIG.fish.autoLift}" ${state.fish < CONFIG.fish.autoLift ? 'disabled' : ''}>
          ${t('robot.orFish')} ${FISH}${CONFIG.fish.autoLift}</button>
      </div>
    </div>

    <p class="hint">${t('up.hint')}</p>`;
  bindUpgradeButtons(body);
  body.querySelector('#robot-buy').onclick = () => buyAutoLift(false);
  body.querySelector('#robot-fish').onclick = () => buyAutoLift(true);
}

// Значок робота на шахте лифта и таймер в окошке
function updateAutoLiftView() {
  const badge = document.getElementById('robot-badge');
  const active = autoLiftActive();
  badge.hidden = !active;
  if (active) setHTML(badge, '🤖 ' + fmtTime((state.autoLiftUntil - Date.now()) / 1000));
  const left = document.getElementById('robot-left');
  if (left) left.textContent = active ? t('robot.left', { t: fmtTime((state.autoLiftUntil - Date.now()) / 1000) }) : '';
  updateUpgradeButtonsView();
}


// =====================================================
//  «С ВОЗВРАЩЕНИЕМ!» и НАСТРОЙКИ
// =====================================================

// 8100 секунд → «2 ч 15 мин»
function fmtAway(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h) return m ? t('away.hm', { h, m }) : t('away.h', { h });
  if (m) return t('away.m', { m });
  return t('away.less');
}

function showWelcomeBack(rep) {
  const lines = [];
  if (rep.deliveries > 0) lines.push(t('welcome.deliveries', { n: rep.deliveries }));
  if (rep.migrated > 0) lines.push(t('welcome.migrated', { coins: fmtNum(rep.migrated) }));
  if (rep.luxCoins > 0 || rep.luxFish > 0) {
    lines.push(t('welcome.lux', { coins: fmtNum(rep.luxCoins) }) + (rep.luxFish > 0 ? t('welcome.luxFish', { fish: rep.luxFish }) : ''));
  }
  if (rep.built) lines.push(t('welcome.built', { n: rep.built }));
  if (rep.away < 60 || !lines.length) return;   // ничего интересного — не мешаем

  document.getElementById('welcome-body').innerHTML = `
    <div class="modal-title">${t('welcome.title')}</div>
    <div class="modal-sub">${t('welcome.away', { t: fmtAway(rep.away) })}</div>
    <div class="welcome-lines">${lines.map(l => `<div>${l}</div>`).join('')}</div>
    <p class="hint">${t('welcome.hint')}</p>
    ${rep.full ? `<p class="hint warn">${t('welcome.full')}</p>` : ''}
    <button class="btn-ok" onclick="closeModal('welcome')">${t('welcome.ok')}</button>`;
  document.getElementById('welcome').hidden = false;
}

function closeModal(id) {
  document.getElementById(id).hidden = true;
}

// Настройки: пока только «Начать заново» с подтверждением
function openSettings() {
  renderSettings(false);
  document.getElementById('settings').hidden = false;
}

function renderSettings(confirming) {
  const body = document.getElementById('settings-body');
  if (!confirming) {
    body.innerHTML = `
      <div class="modal-title">${t('set.title')}</div>
      <div class="set-row lang-row"><span>🌍 ${t('set.lang')}</span>
        <span class="lang-btns">${Object.entries(LANGS).map(([id, name]) =>
          `<button class="lang-btn${lang() === id ? ' on' : ''}" data-lang="${id}">${name}</button>`).join('')}</span>
      </div>
      <button class="set-row" id="btn-sound">
        <span>${state.settings.sound ? '🔊' : '🔇'} ${t('set.sound')}</span>
        <span class="switch ${state.settings.sound ? 'on' : ''}"><i></i></span>
      </button>
      <button class="set-row" id="btn-music">
        <span>${state.settings.music ? '🎵' : '🔇'} ${t('set.music')}</span>
        <span class="switch ${state.settings.music ? 'on' : ''}"><i></i></span>
      </button>
      <button class="set-row" id="btn-tutorial"><span>${t('set.tutorial')}</span><span>›</span></button>
      <p class="hint">${t('set.saved')}</p>
      <button class="fire" id="btn-reset">${t('set.reset')}</button>`;
    body.querySelectorAll('.lang-btn').forEach(b => b.onclick = () => setLanguage(b.dataset.lang));
    body.querySelector('#btn-reset').onclick = () => renderSettings(true);
    body.querySelector('#btn-sound').onclick = () => { toggleSound(); renderSettings(false); };
    body.querySelector('#btn-music').onclick = () => { toggleMusic(); renderSettings(false); };
    body.querySelector('#btn-tutorial').onclick = restartTutorial;
  } else {
    body.innerHTML = `
      <div class="modal-title">${t('set.sure')}</div>
      <p class="hint warn">${t('set.lose')}</p>
      <div class="confirm-row">
        <button class="btn-ok" id="btn-cancel">${t('set.cancel')}</button>
        <button class="fire" id="btn-yes">${t('set.yes')}</button>
      </div>`;
    body.querySelector('#btn-cancel').onclick = () => renderSettings(false);
    body.querySelector('#btn-yes').onclick = resetGame;
  }
}


// =====================================================
//  ОКОШКО «КАКИМ БУДЕТ ЭТАЖ?»
// =====================================================

function showChooser(num) {
  const grid = document.getElementById('chooser-grid');
  grid.innerHTML = '';

  const kindText = { living: t('kind.living'), work: t('kind.work'), lux: t('kind.lux') };

  Object.entries(CONFIG.floorTypes).forEach(([id, ft]) => {
    if (ft.buildable === false) return;
    const lock = lockReason(id, num);   // ещё рано — с замочком

    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.disabled = Boolean(lock);
    btn.innerHTML = `
      <img src="assets/floors/${ft.image}" alt="">
      <span class="choice-name">${ft.icon} ${ft.name}</span>
      <span class="choice-kind">${lock || kindText[ft.kind]}</span>`;
    btn.addEventListener('click', () => chooseFloorType(num, id));
    grid.appendChild(btn);
  });

  document.getElementById('chooser').hidden = false;
}

function hideChooser() {
  document.getElementById('chooser').hidden = true;
}


// =====================================================
//  ПАНЕЛИ: монеты, рыбки и кнопка стройки
// =====================================================

function updateHud() {
  setHTML(document.getElementById('coins'), fmtNum(state.coins));
  setHTML(document.getElementById('fish'), fmtNum(state.fish));

  const btn   = document.getElementById('btn-build');
  const title = btn.querySelector('.btn-title');
  const price = btn.querySelector('.btn-price');
  const top   = topFloor();

  if (top.status === 'building') {
    setHTML(title, t('build.building'));
    setHTML(price, `<span class="btn-time">⏱ ${fmtTime((top.endsAt - Date.now()) / 1000)}</span>`);
    btn.disabled = true;
  } else if (top.status === 'choose') {
    setHTML(title, t('build.choose'));
    setHTML(price, '<span class="btn-cost">✨</span>');
    if (btn.disabled) { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
    btn.disabled = false;
  } else {
    const nb = nextBuild();
    const cost = nb.cost
      ? `<span class="btn-cost"><img src="assets/ui/coin.png" alt=""> ${fmtNum(nb.cost)}</span>`
      : `<span class="btn-cost">${t('build.free')}</span>`;
    setHTML(title, t('build.build'));
    setHTML(price, cost + `<span class="btn-time">⏱ ${fmtTime(nb.seconds)}</span>`);
    const can = state.coins >= nb.cost;
    if (can && btn.disabled) { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
    btn.disabled = !can;
  }
}


// =====================================================
//  КОТЫ
// =====================================================

// Нарисовать кота (без поведения) — нужно и живым котам, и гостям в лобби
function makeCatEl(breed) {
  const cat = document.createElement('div');
  cat.className = 'cat';
  cat.innerHTML =
    '<div class="cat-sprite"></div>' +
    '<div class="zzz"><span>z</span><span>z</span><span>Z</span></div>';
  cat.querySelector('.cat-sprite').style.backgroundImage =
    `url(assets/cats/cat_${breed}.png)`;
  return cat;
}

// Живой кот на этаже.
// opts.x — где появиться (%), opts.vip — с короной, opts.heart — ❤️ (работа мечты),
// opts.rid — номер жильца, opts.leaveAfter — уйти через N секунд, opts.badge — значок особого гостя
function createCat(breed, floorEl, opts = {}) {
  const cat = makeCatEl(breed);
  const placed = opts.x !== undefined && opts.x !== null;

  cat.style.left = (placed ? opts.x : rand(CONFIG.cat.minX, CONFIG.cat.maxX)) + '%';
  cat.dataset.pose = 'sit';
  cat.dataset.dir = placed ? 'right' : (Math.random() < 0.5 ? 'left' : 'right');
  if (opts.rid) cat.dataset.rid = opts.rid;
  if (opts.vip) cat.insertAdjacentHTML('beforeend', '<div class="crown">👑</div>');
  if (opts.heart) cat.insertAdjacentHTML('beforeend', '<div class="crown heart">❤️</div>');
  if (opts.badge) cat.insertAdjacentHTML('beforeend', `<div class="crown special">${opts.badge}</div>`);   // особый гость

  floorEl.appendChild(cat);
  setTimeout(() => nextAction(cat), placed ? 300 : rand(500, 2500));

  if (opts.leaveAfter) {
    setTimeout(() => {
      // плавно исчезает (прогулку на месте замораживаем)
      cat.dataset.leaving = '1';
      cat.style.left = getComputedStyle(cat).left;
      cat.style.transition = 'opacity 1s';
      cat.style.opacity = '0';
      setTimeout(() => cat.remove(), 1000);
    }, opts.leaveAfter * 1000);
  }
}

// Кот «бросает кубик»: гулять, сидеть или спать
function nextAction(cat) {
  if (!cat.isConnected || cat.dataset.leaving) return;   // кот ушёл — стоп
  const c = CONFIG.cat;
  const roll = Math.random();
  if (roll < c.chanceWalk) {
    walk(cat);
  } else if (roll < c.chanceWalk + c.chanceSit) {
    rest(cat, 'sit', rand(c.sitSeconds[0], c.sitSeconds[1]));
  } else {
    rest(cat, 'sleep', rand(c.sleepSeconds[0], c.sleepSeconds[1]));
  }
}

function walk(cat) {
  const c = CONFIG.cat;
  const from = parseFloat(cat.style.left);
  let to = rand(c.minX, c.maxX);
  if (Math.abs(to - from) < 15) {
    to = from < 50 ? from + 25 : from - 25;
  }
  const seconds = Math.abs(to - from) / c.speed;

  cat.dataset.dir = to < from ? 'left' : 'right';
  cat.dataset.pose = 'walk';
  cat.style.transition = `left ${seconds}s linear`;
  cat.style.left = to + '%';
  setTimeout(() => nextAction(cat), seconds * 1000);
}

function rest(cat, pose, seconds) {
  cat.dataset.pose = pose;
  if (pose === 'sit' && cat.querySelector('.heart') && Math.random() < 0.5) {
    cat.classList.remove('hop'); void cat.offsetWidth; cat.classList.add('hop');
  }
  setTimeout(() => nextAction(cat), seconds * 1000);
}

function startCats() {
  CONFIG.startCats.forEach(({ breed, floor }) => {
    const el = floorEl(floor);
    if (el) {
      createCat(breed, el);
    } else {
      console.warn(`Этаж ${floor} не найден — проверь startCats в config.js`);
    }
  });
}
