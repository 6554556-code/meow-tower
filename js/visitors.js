// =====================================================
//  visitors.js — СЛУЧАЙНЫЕ ПОСЕТИТЕЛИ
//
//  С 5 этажа иногда (1 из 50) покупатель оказывается особым:
//   🤑 щедрый гость — покупает и оставляет чаевые (иногда ещё и рыбку)
//   🦹 воришка      — ничего не покупает, тащит часть монет из кошелька
//   🐷 обжора       — съедает несколько товаров с полок и не платит
//  Едут как обычные гости (и с роботом-лифтёром тоже), сюрприз — на этаже.
//  Все цифры — в config.js → guests.special
// =====================================================

const SPECIAL_KINDS = ['tipper', 'thief', 'glutton'];

function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

// Особый ли этот покупатель? Вернёт 'tipper' / 'thief' / 'glutton' или null
function rollSpecial() {
  const s = CONFIG.guests.special;
  if (topFloor().num < s.fromFloor || Math.random() >= s.chance) return null;
  let roll = Math.random() * SPECIAL_KINDS.reduce((sum, k) => sum + s[k].weight, 0);
  return SPECIAL_KINDS.find(k => (roll -= s[k].weight) < 0) || 'tipper';
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
      sfx('sad');
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
      sfx('sad');
      chatSay('visGlutton', who, { items: list }, go);
    } else {
      chatSay('visGluttonEmpty', who, {}, go);               // пока ехал, всё раскупили
    }
    refreshShopModal();
  }

  updateHud();
}

// «−120 🪙» красным над этажом
function showLossView(num, text) {
  const pop = document.createElement('div');
  pop.className = 'collect-pop loss';
  pop.innerHTML = text;
  floorEl(num).appendChild(pop);
  setTimeout(() => pop.remove(), 1300);
}
