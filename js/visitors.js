// =====================================================
//  visitors.js — СЛУЧАЙНЫЕ ПОСЕТИТЕЛИ
//
//  С 5 этажа иногда покупатель оказывается особым (шансы — в config.js):
//   🤑 щедрый гость — покупает и оставляет чаевые (иногда ещё и рыбку)
//   🦹 воришка      — ничего не покупает, тащит часть монет из кошелька
//   🐷 обжора       — съедает несколько товаров с полок и не платит
//  Едут как обычные гости (и с роботом-лифтёром тоже), сюрприз — на этаже.
//  Воришка и обжора сначала 10 секунд крутятся у входа в лобби, консьерж
//  поднимает тревогу. Заметила и тапнула по ним, пока они в лобби, — прогнала.
//  Все цифры — в config.js → guests.special
// =====================================================

const SPECIAL_KINDS = ['tipper', 'thief', 'glutton'];

function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

// Особый ли этот покупатель? Вернёт 'tipper' / 'thief' / 'glutton' или null
function rollSpecial() {
  const s = CONFIG.guests.special;
  if (topFloor().num < s.fromFloor) return null;
  let roll = Math.random();                       // один бросок: у каждого вида свой кусочек шансов
  return SPECIAL_KINDS.find(k => (roll -= s[k].chance) < 0) || null;
}

// Значок над головой (в лобби, в кабинке и на этаже)
function specialIcon(guest) {
  return guest && guest.special ? CONFIG.guests.special[guest.special].icon : '';
}

// Особый гость вышел на своём этаже
function specialVisit(guest, num) {
  const s = CONFIG.guests.special[guest.special];
  const who = { name: `${s.icon} ${t('vis.' + guest.special)}`, breed: guest.breed };
  const go = { floor: num };

  if (guest.special === 'tipper') {
    shopperBuys(num);                                         // покупает как все
    const coins = roundNice(randInt(s.coins[0], s.coins[1]), 10);
    const fish = Math.random() < s.fishChance ? 1 : 0;
    state.coins += coins;
    state.fish += fish;
    showCollectView(num, coins, fish);
    flyCoinsView(floorEl(num), 5);
    sfx('coin');
    chatSay(fish ? 'visTipperFish' : 'visTipper', who, { coins: fmtNum(coins) }, go);
  }

  else if (guest.special === 'thief') {
    const share = s.share[0] + Math.random() * (s.share[1] - s.share[0]);
    const coins = Math.min(state.coins, Math.max(10, roundNice(state.coins * share, 10)));
    if (coins > 0) {
      state.coins -= coins;
      showLossView(num, `−${fmtNum(coins)} ${COIN}`);
      sfx('alarm');
      chatSay('visThief', who, { coins: fmtNum(coins) }, go);
    } else {
      chatSay('visThiefEmpty', who, {}, go);                 // в кошельке пусто — нечего красть
    }
  }

  else if (guest.special === 'glutton') {
    const f = getFloor(num);
    let left = randInt(s.eats[0], s.eats[1]);
    const eaten = {};                                         // какой товар — сколько штук
    while (left > 0) {
      const slots = [];
      for (let i = 0; i < CONFIG.work.slots; i++) if (isSelling(f, i)) slots.push(i);
      if (!slots.length) break;
      const slot = randomItem(slots);
      f.stock[slot]--;
      left--;
      eaten[slot] = (eaten[slot] || 0) + 1;
      if (f.stock[slot] === 0) {
        chatSay('outOfStock', workerOf(num, slot), { shop: shopName(f.type), item: productsOf(f)[slot].name }, go);
      }
    }
    const list = Object.entries(eaten).map(([slot, n]) => `«${productsOf(f)[slot].name}» ×${n}`).join(', ');
    if (list) {
      showLossView(num, `−${Object.values(eaten).reduce((a, b) => a + b, 0)} 📦`);
      sfx('alarm');
      chatSay('visGlutton', who, { items: list }, go);
    } else {
      chatSay('visGluttonEmpty', who, {}, go);               // пока ехал, всё раскупили
    }
    refreshShopModal();
  }

  updateHud();
}

// «−120 🪙» красным над этажом
function showLossView(num, text) { showFloorPopView(num, text, 'loss'); }

function showFloorPopView(num, text, cls) {
  const pop = document.createElement('div');
  pop.className = 'collect-pop ' + cls;
  pop.innerHTML = text;
  floorEl(num).appendChild(pop);
  setTimeout(() => pop.remove(), 1300);
}


// ---------- Недоброжелатели у входа ----------

// Воришка или обжора (их можно прогнать)
function isSneaky(guest) {
  return Boolean(guest && guest.special && CONFIG.guests.special[guest.special].sneaky);
}

// Ещё крутится у входа — в лифт пока не садится
function isSneaking(guest) {
  return Boolean(guest.sneakUntil) && Date.now() < guest.sneakUntil;
}

// Новый гость: если недоброжелатель — сначала погуляет у входа
function prepareSpecial(guest) {
  guest.sneakUntil = isSneaky(guest) ? Date.now() + CONFIG.guests.special.sneakSeconds * 1000 : null;
}

// Консьерж поднимает тревогу (в чат и всплывашкой; тап по ней — к лобби)
function warnIntruder(guest) {
  sfx('siren');
  chatSay('visIntruder', { name: t('vis.concierge'), breed: 'concierge' }, { icon: specialIcon(guest) }, { floor: 1 });
}

// Каждый тик: у кого время вышло — встаёт в очередь к лифту
function sneakTick() {
  state.guests.waiting.forEach(guest => {
    if (guest.sneakUntil && !isSneaking(guest)) {
      guest.sneakUntil = null;
      sneakEndView(guest);
    }
  });
}

// Тапнули по недоброжелателю в лобби — прогнали
function shooGuest(guest) {
  const g = state.guests;
  if (!isSneaky(guest) || !g.waiting.includes(guest)) return;   // уже в кабинке или ушёл
  g.waiting = g.waiting.filter(x => x !== guest);
  shooView(guest);
  sfx('whoosh');
  showFloorPopView(1, t('vis.shooed'), 'good');
  const s = CONFIG.guests.special[guest.special];
  chatSay(guest.special === 'thief' ? 'visShooedThief' : 'visShooedGlutton',
          { name: `${s.icon} ${t('vis.' + guest.special)}`, breed: guest.breed });
  updateCabReadyView();
}


// ---------- Как это выглядит ----------

// Крутится у входа: ходит туда-сюда возле дверей
function sneakWalkView(el) {
  if (!el.isConnected || !el.classList.contains('sneaking')) return;
  const from = parseFloat(el.style.left) || 50;
  const to = 38 + Math.random() * 24;                       // двери — посередине лобби
  el.dataset.pose = 'walk';
  el.dataset.dir = to < from ? 'left' : 'right';
  el.style.transition = 'left 1.6s linear';
  el.style.left = to + '%';
  setTimeout(() => sneakWalkView(el), 1700);
}

// Время вышло: встаёт в очередь к лифту
function sneakEndView(guest) {
  const el = lobbyEl().querySelector(`.guest[data-guest="${guest.id}"]`);
  if (!el) return;
  el.classList.remove('sneaking');
  el.style.transition = '';
  el.dataset.pose = 'sit';
  el.dataset.dir = 'left';
  layoutQueue();
}

// Прогнали: убегает к дверям и тает
function shooView(guest) {
  const el = lobbyEl().querySelector(`.guest[data-guest="${guest.id}"]`);
  if (!el) return;
  el.classList.remove('sneaking', 'shooable');
  const b = el.querySelector('.bubble');
  if (b) b.textContent = '💨';
  el.dataset.pose = 'walk';
  el.dataset.dir = 'right';
  el.style.transition = 'left 0.8s ease-in, opacity 0.8s';
  el.style.left = '62%';
  el.style.opacity = '0';
  setTimeout(() => { el.remove(); layoutQueue(); }, 800);
}
