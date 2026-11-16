// =====================================================
//  i18n.js — ЯЗЫКИ: русский и английский
//  t('ключ', { переменные }) — текст на текущем языке.
//  Новый язык = ещё один словарь ниже + строка в LANGS.
//  Названия этажей, товаров, улучшений, фразы котов, обучение и имена
//  для английского подменяются при запуске (applyLanguage).
// =====================================================

const LANGS = { ru: '🇷🇺 Русский', en: '🇬🇧 English' };

const I18N = {
  ru: {
    // --- Башня и этажи
    'roof.alt': 'Сад на крыше',
    'alt.coins': 'Монеты', 'alt.fish': 'Рыбки', 'alt.lift': 'Лифт',
    'sign.alt': 'Мяу Башня',
    'floor.building': '🚧 СТРОЙКА',
    'floor.ready': '✨ ГОТОВО! Тапни, чтобы выбрать тип',
    'floor.choose': '✨ ВЫБЕРИ ТИП',
    'floor.closedNoWorkers': 'ЗАКРЫТО · нужны работники',
    'floor.closedNoStock': 'НЕТ ТОВАРА · закажи поставку',
    'lock.floor': '🔒 с {n} этажа',
    'lock.home': '🔒 сначала комната сна',
    'kind.living': 'жилой', 'kind.work': 'работа', 'kind.lux': 'люкс · VIP',
    'chooser.title': 'КАКИМ БУДЕТ ЭТАЖ?',
    'chooser.sub': 'Можно закрыть и подумать — этаж подождёт',

    // --- Кнопка стройки
    'build.building': 'СТРОИТСЯ…',
    'build.choose': 'ВЫБРАТЬ ТИП ЭТАЖА',
    'build.free': 'БЕСПЛАТНО',
    'build.build': 'ПОСТРОИТЬ ЭТАЖ',

    // --- Жильцы
    'res.noJob': '😴 без работы',
    'res.here': '✔ здесь',
    'res.full': 'мест нет',
    'res.nowhere': 'Пока негде работать. Построй кафе, магазин игрушек, спа или молочный бар.',
    'res.back': '← назад',
    'res.now': 'Сейчас: {job}',
    'res.dream': '❤️ Мечтает: {dream}',
    'res.dreamHint': 'На работе мечты поставка его товара приходит быстрее',
    'res.assign': 'Устроить на работу:',
    'res.fire': 'Уволить',
    'res.empty': 'Пока никто не живёт. Привези на лифте гостя с облачком 🏠',
    'res.count': 'Жильцы: {n}/{max}',

    // --- Люкс
    'lux.none': 'пока никого — VIP приедут на лифте',
    'lux.vips': 'VIP: {n}/{max}',
    'lux.pays': 'Каждый VIP платит {coins} {COIN} за {min} мин и 1 {FISH} за {h} ч. Касса копит до {cap} ч.',
    'lux.cash': 'В кассе:',
    'lux.collect': 'Собрать',

    // --- Магазин
    'shop.noWorker': 'нет работника',
    'shop.notSold': 'не продаётся',
    'shop.credit': 'в долг',
    'shop.onSale': 'в продаже',
    'shop.topup': '+ дозаказ',
    'shop.workers': 'Работники: {n}/{max} · 1 кот = 1 товар',
    'shop.hint': 'Гость с лифта покупает 1 штуку. Закупка — половина цены товара, платишь только за недостающие штуки. Работников назначают в комнате сна.',

    // --- Улучшения
    'up.secPerFloor': '{s} с/этаж',
    'up.buildFaster': 'стройка −{p}%',
    'up.buildNormal': 'обычная скорость',
    'up.delivery': 'поставка {t}',
    'up.storage': '{n} шт. на полке',
    'up.prices': 'цены +{p}%',
    'up.pricesNormal': 'обычные цены',
    'up.vip': '{coins} {COIN} / {min} мин',
    'up.max': 'МАКС',
    'up.lvl': 'ур. {lvl}/{max}',
    'up.title': '🔨 УЛУЧШЕНИЯ',
    'up.sub': 'Для всей башни',
    'robot.name': 'Робот-лифтёр',
    'robot.desc': 'Сам развозит гостей {min} мин.',
    'robot.left': 'Работает ещё {t}',
    'robot.more': '+10 мин',
    'robot.hire': 'Нанять',
    'robot.orFish': 'или',
    'up.hint': '💰 Цены товаров улучшаются в карточке магазина, 👑 VIP-зона — в карточке люкса.',

    // --- С возвращением
    'away.hm': '{h} ч {m} мин', 'away.h': '{h} ч', 'away.m': '{m} мин', 'away.less': 'меньше минуты',
    'welcome.deliveries': '🚚 Приехало поставок: {n}',
    'welcome.migrated': '🛍️ Остаток старой кассы магазинов: {coins} {COIN}',
    'welcome.lux': '👑 Люкс: {coins} {COIN}',
    'welcome.luxFish': ' и {fish} {FISH}',
    'welcome.built': '🏗️ Стройка {n} этажа завершена!',
    'welcome.title': 'С возвращением! 😺',
    'welcome.away': 'Тебя не было {t}',
    'welcome.hint': 'Не забудь заказать товар там, где он кончился (значок 📦 на этаже).',
    'welcome.full': 'Касса люкса полная: пока не заберёшь, она не копит.',
    'welcome.ok': 'УРА!',

    // --- Настройки
    'set.title': '⚙️ НАСТРОЙКИ',
    'set.sound': 'Звук',
    'set.music': 'Музыка',
    'set.lang': 'Язык',
    'set.tutorial': '🎓 Пройти обучение заново',
    'set.saved': 'Игра сохраняется сама, каждые 5 секунд, в этом браузере.',
    'set.reset': 'Начать заново',
    'set.sure': 'Точно?',
    'set.lose': 'Башня, коты, монеты и рыбки пропадут навсегда.',
    'set.cancel': 'Отмена',
    'set.yes': 'Да, сбросить',

    // --- Рейтинг
    'rate.dream': 'Коты на работе мечты: {n} из {all}',
    'rate.idle': 'Без работы: {n}',
    'rate.stock': 'Товары в наличии: {n} из {all}',
    'rate.empty': 'Пустые полки без заказа: {n}',
    'rate.left': 'Съехали недавно: {n}',
    'rate.mod': '{text} (ещё {m} мин)',
    'rate.calm': 'Пока всё спокойно. Заселяй котов и открывай магазины.',
    'rate.title': '⭐ РЕЙТИНГ {r}',
    'rate.guests': 'Гости приходят примерно раз в {s} с',
    'rate.base': 'Начальный рейтинг',
    'rate.hint': 'Рейтинг меняется плавно. Чем он выше, тем чаще приходят гости.',

    // --- Чат
    'chat.guest': 'Гость',
    'chat.vipGuest': 'VIP-гость',
    'vis.tipper': 'Щедрый гость',
    'vis.thief': 'Воришка',
    'vis.glutton': 'Обжора',
    'chat.now': 'только что',
    'chat.min': '{m} мин назад',
    'chat.h': '{h} ч назад',
    'chat.quiet': 'Тут пока тихо. Заселяй котов — они разговорчивые.',
    'chat.title': '💬 МУР-ЧАТ',
    'chat.sub': 'Тап по сообщению — к коту или на его этаж',

    // --- Подарок дня
    'daily.day': 'День {n}',
    'daily.title': '🎁 ПОДАРОК ДНЯ',
    'daily.sub': 'Заходи каждый день — подарки растут. Пропустишь день — серия сначала.',
    'daily.take': 'ЗАБРАТЬ',

    // --- Обучение
    'tut.skip': 'Пропустить',
    'tut.ok': 'Понятно',
    'tut.done': 'Готово!'
  },

  en: {
    'roof.alt': 'Roof garden',
    'alt.coins': 'Coins', 'alt.fish': 'Fish', 'alt.lift': 'Elevator',
    'sign.alt': 'Meow Tower',
    'floor.building': '🚧 BUILDING',
    'floor.ready': '✨ READY! Tap to choose the type',
    'floor.choose': '✨ CHOOSE TYPE',
    'floor.closedNoWorkers': 'CLOSED · needs workers',
    'floor.closedNoStock': 'SOLD OUT · order a delivery',
    'lock.floor': '🔒 from floor {n}',
    'lock.home': '🔒 build a bedroom first',
    'kind.living': 'home', 'kind.work': 'shop', 'kind.lux': 'luxury · VIP',
    'chooser.title': 'WHAT WILL THIS FLOOR BE?',
    'chooser.sub': 'You can close this and think — the floor will wait',

    'build.building': 'BUILDING…',
    'build.choose': 'CHOOSE FLOOR TYPE',
    'build.free': 'FREE',
    'build.build': 'BUILD A FLOOR',

    'res.noJob': '😴 unemployed',
    'res.here': '✔ here',
    'res.full': 'full',
    'res.nowhere': 'Nowhere to work yet. Build a cafe, toy shop, spa or milk bar.',
    'res.back': '← back',
    'res.now': 'Now: {job}',
    'res.dream': '❤️ Dreams of: {dream}',
    'res.dreamHint': 'At their dream job, deliveries of their item arrive faster',
    'res.assign': 'Give a job:',
    'res.fire': 'Fire',
    'res.empty': 'Nobody lives here yet. Bring a guest with a 🏠 bubble by elevator',
    'res.count': 'Residents: {n}/{max}',

    'lux.none': 'nobody yet — VIPs arrive by elevator',
    'lux.vips': 'VIPs: {n}/{max}',
    'lux.pays': 'Each VIP pays {coins} {COIN} every {min} min and 1 {FISH} every {h} h. The till holds up to {cap} h.',
    'lux.cash': 'In the till:',
    'lux.collect': 'Collect',

    'shop.noWorker': 'no worker',
    'shop.notSold': 'not on sale',
    'shop.credit': 'credit',
    'shop.onSale': 'on sale',
    'shop.topup': '+ restock',
    'shop.workers': 'Workers: {n}/{max} · 1 cat = 1 item',
    'shop.hint': 'A guest from the elevator buys 1 item. Restocking costs half the price, and you only pay for missing items. Assign workers in the bedroom.',

    'up.secPerFloor': '{s} s/floor',
    'up.buildFaster': 'building −{p}%',
    'up.buildNormal': 'normal speed',
    'up.delivery': 'delivery {t}',
    'up.storage': '{n} per shelf',
    'up.prices': 'prices +{p}%',
    'up.pricesNormal': 'normal prices',
    'up.vip': '{coins} {COIN} / {min} min',
    'up.max': 'MAX',
    'up.lvl': 'lv. {lvl}/{max}',
    'up.title': '🔨 UPGRADES',
    'up.sub': 'For the whole tower',
    'robot.name': 'Robot Liftcat',
    'robot.desc': 'Delivers guests for you for {min} min.',
    'robot.left': '{t} left',
    'robot.more': '+10 min',
    'robot.hire': 'Hire',
    'robot.orFish': 'or',
    'up.hint': '💰 Item prices are upgraded in the shop card, 👑 VIP zone — in the luxury card.',

    'away.hm': '{h} h {m} min', 'away.h': '{h} h', 'away.m': '{m} min', 'away.less': 'less than a minute',
    'welcome.deliveries': '🚚 Deliveries arrived: {n}',
    'welcome.migrated': '🛍️ Left in old shop tills: {coins} {COIN}',
    'welcome.lux': '👑 Luxury: {coins} {COIN}',
    'welcome.luxFish': ' and {fish} {FISH}',
    'welcome.built': '🏗️ Floor {n} is built!',
    'welcome.title': 'Welcome back! 😺',
    'welcome.away': 'You were away for {t}',
    'welcome.hint': "Don't forget to restock where items ran out (📦 on the floor).",
    'welcome.full': "The luxury till is full: it won't fill up until you collect.",
    'welcome.ok': 'YAY!',

    'set.title': '⚙️ SETTINGS',
    'set.sound': 'Sound',
    'set.music': 'Music',
    'set.lang': 'Language',
    'set.tutorial': '🎓 Replay the tutorial',
    'set.saved': 'The game saves itself every 5 seconds, in this browser.',
    'set.reset': 'Start over',
    'set.sure': 'Are you sure?',
    'set.lose': 'The tower, cats, coins and fish will be gone forever.',
    'set.cancel': 'Cancel',
    'set.yes': 'Yes, reset',

    'rate.dream': 'Cats at their dream job: {n} of {all}',
    'rate.idle': 'Unemployed: {n}',
    'rate.stock': 'Items in stock: {n} of {all}',
    'rate.empty': 'Empty shelves, not ordered: {n}',
    'rate.left': 'Moved out recently: {n}',
    'rate.mod': '{text} ({m} min left)',
    'rate.calm': 'All quiet for now. Move cats in and open shops.',
    'rate.title': '⭐ RATING {r}',
    'rate.guests': 'Guests arrive about every {s} s',
    'rate.base': 'Base rating',
    'rate.hint': 'The rating changes smoothly. The higher it is, the more often guests come.',

    'chat.guest': 'Guest',
    'chat.vipGuest': 'VIP guest',
    'vis.tipper': 'Generous guest',
    'vis.thief': 'Pickpocket',
    'vis.glutton': 'Glutton',
    'chat.now': 'just now',
    'chat.min': '{m} min ago',
    'chat.h': '{h} h ago',
    'chat.quiet': "It's quiet here. Move cats in — they love to chat.",
    'chat.title': '💬 MEOW CHAT',
    'chat.sub': "Tap a message to go to the cat or its floor",

    'daily.day': 'Day {n}',
    'daily.title': '🎁 DAILY GIFT',
    'daily.sub': 'Come back every day — gifts grow. Miss a day and the streak restarts.',
    'daily.take': 'CLAIM',

    'tut.skip': 'Skip',
    'tut.ok': 'Got it',
    'tut.done': 'Done!'
  }
};

// ---------- Английские названия: этажи, товары, улучшения ----------
const EN_NAMES = {
  floors: {
    lobby: 'LOBBY', sleep: 'BEDROOM', elite: 'LUXURY SUITE', cafe: 'FISH CAFE',
    toyshop: 'TOY SHOP', spa: 'SPA', milkbar: 'MILK BAR'
  },
  products: {
    cafe: ['Sushi roll', 'Fish soup', 'Shrimp'],
    toyshop: ['Mouse toy', 'Yarn ball', 'Teaser wand'],
    spa: ['Face mask', 'Brush', 'Candle'],
    milkbar: ['Milk', 'Milkshake', 'Ice cream']
  },
  upgrades: {
    lift: 'Elevator speed', build: 'Building speed', delivery: 'Delivery speed',
    storage: 'Storage size', price: 'Item prices', vip: 'VIP zone'
  }
};

// Английские фразы котов (те же ключи, что в CHAT_LINES)
const CHAT_LINES_EN = {
  hello: [
    "Meow, everyone! I'm {name}, and I dream of working at the {dream} 😺",
    'Hi, neighbours! {name} just moved in. Who can show me where the food bowl is?',
    "Mrrr! New here. They say the {dream} is really cool…"
  ],
  dreamJob: ["Yay! I work at the {shop} — my dream job! 💖", "I'm at the {shop}! Purring with joy 😻", 'Best day ever: hired at the {shop}! 🎉'],
  job: [
    'Fine, the {shop} it is… But I really want the {dream} 😿',
    "Started at the {shop}. Not my dream, but the bowl won't fill itself",
    'Working at the {shop}. Hope someday they move me to the {dream}…'
  ],
  fired: ['I got FIRED?! 😾', "Fine. I'll go nap. But I'll remember this 😼"],
  outOfStock: [
    'The {shop} is out of {item}! Order a delivery 📦',
    'Customers keep asking for {item}, and we have none 😿',
    "The {item} shelf is empty. I'm just standing here…"
  ],
  arrived: ['{item} delivered, back in business! 🚚', 'Delivery is here! {item} is on sale again 😺'],
  visTipper: ['What a lovely tower! Here are {coins} coins as a tip 🤑', 'Purr-fect service! Take {coins} coins 💰'],
  visTipperFish: ['Such service! {coins} coins and a fish on top 🐟'],
  visThief: ["Heh-heh, {coins} coins are mine now! Catch me if you can 😼", "Oops, whose wallet is this? Was yours, now it's mine. Minus {coins} coins 🦹"],
  visThiefEmpty: ['I sneaked into the wallet and it was empty… What a tower 🙄'],
  visGlutton: ["Nom-nom! {items} — delicious, and I'm not paying 🐷", 'Just had a little snack: {items}. Put it on my neighbour\'s tab 😋'],
  visGluttonEmpty: ['I came for a snack and the shelves are empty… So sad 🐷'],
  vip: ["Hmm, not a bad suite. I'm staying 👑", 'Champagne… I mean, cream to my room, please 👑'],
  bored: ["I'm bored… Find me a job 🥺", 'Been lying around for an hour. Does anyone need me?'],
  warn: ["If nobody finds me a job, I'm moving out 😠", 'Final warning: no job, no me!'],
  leave: ["That's it, I'm moving out. Goodbye 😾", "Off to another tower. At least they have jobs there 😤"],
  eventOrder: ["It's my birthday! I need {n} × {item} from the {shop}. Can you help? 🎂", "I'm throwing a party: {n} × {item}. Can you make it? 🥳"],
  eventOrderDeclined: ["Oh well… I'll manage 😿", 'Too bad. Maybe next time.'],
  eventOrderOk: ['Yay, the order is ready! Here are {coins} coins, thanks! 💖', 'Best tower ever! Take {coins} coins 😻'],
  eventOrderFail: ['Nobody filled my order… Party ruined 😾', "I waited and waited… Won't ask again 😿"],
  eventSale: ['Sale! Restocking at the {shop} is half price for 3 minutes! 🏷️'],
  eventSaleEnd: ['The sale is over. Come again!'],
  eventInspection: ["In 3 minutes I'll inspect the {shop} on floor {num}. Everyone at their post, shelves full! 🕵️"],
  eventInspectionOk: ['The {shop} is in great shape. Bonus: {coins} coins 🏅'],
  eventInspectionFail: ['{shop}: empty shelves or missing workers! Fine: {coins} coins 📝'],
  guestLeft: ["How long do I have to wait for the elevator?! I'm leaving 😾", "I didn't come here to stand in the lobby. Bye!", "I'll go to another tower, their elevator is faster 😤"],
  grumble: ['The {shop} again… I want the {dream} 😿', 'Could someone move me to the {dream}, please?', 'I bet the {dream} is so nice right now…'],
  happy: ['I love my job at the {shop} 💖', 'Great day at the {shop} today!', 'Purr. All is well.'],
  smalltalk: [
    'Has anyone seen my yarn ball?',
    'The elevator is fast today, I like it',
    'Did you know the cat in the hat in the lobby is our concierge? 🎩',
    'Something smells fishy… is that the cafe?',
    'Who took my spot on the windowsill again?'
  ],
  sad: ['Our tower has become kind of sad…', 'Fewer and fewer guests. Maybe we should tidy up?']
};

// Обучение и подсказки по-английски (по порядку шагов и по id подсказок)
const TUTORIAL_EN = [
  "Meow! I'm the concierge of this tower 🎩 Let's build the first floor — it's free!",
  "Construction is underway! When it's done, tap the new floor (or the button below) and choose BEDROOM: cats will live there.",
  'Guests arrive in the lobby and get into the elevator by themselves. Look at their bubble to see where they need to go, and tap that number in the elevator shaft.',
  'Yay, your first resident! Now build a shop — a cafe, toys, spa or milk bar. When construction is done, tap the floor and choose.',
  "A shop stays closed until someone works there. Tap the BEDROOM, pick a cat and give them a job. ❤️ means their dream job!",
  "A guest from the elevator buys 1 item — that's how you earn. When an item runs out, a 📦 appears on the floor. Tap the floor and order a delivery (it costs money).",
  "⭐ This is the tower rating. The higher it is, the more often guests come. Cats at their dream job and full shelves raise it, unemployed cats lower it. Tap it to see why.",
  '💬 And this is Meow Chat. Cats complain, celebrate and warn you before moving out. Tap a message to jump to the cat or its floor.',
  "You're on your own now! I'll pop up when something new appears: upgrades, luxury, fish. Good luck, boss! 😺"
];

const TIPS_EN = {
  upgrades: "🔨 You can afford an upgrade! Speed up the elevator, building and deliveries, grow your storage, or hire the robot liftcat. Item prices are upgraded in the shop card.",
  lux6: "Floor 6 is special! You can build a 👑 LUXURY SUITE here. VIP guests pay rent even when you're away, leave tips and give fish 🐟. Every 5th guest will be a VIP.",
  luxBuilt: 'The suite is ready! Wait for a guest with a crown 👑 in the lobby and take them up. Collect rent by tapping the badge on the floor, and upgrade the VIP zone in the luxury card.',
  events: '✨ An event! Sometimes cats ask for special orders, suppliers hold sales, and an inspector drops by. Tap the timer badge at the top for details.',
  fish: '🐟 Your first fish! Use them to finish a floor instantly (the ⚡ button on construction), get a delivery right away, or hire the robot liftcat.'
};


// =====================================================
//  ДВИЖОК
// =====================================================

// Язык при первом запуске — по языку браузера
function detectLang() {
  const tgLang = typeof telegramLang === 'function' && telegramLang();     // в Telegram — язык его интерфейса
  const l = (tgLang || navigator.language || 'en').toLowerCase();
  return /^(ru|uk|be|kk)/.test(l) ? 'ru' : 'en';
}

function lang() {
  return (state.settings && state.settings.lang) || detectLang();
}

// Текст по ключу. {COIN} и {FISH} — иконки монеты и рыбки
function t(key, vars = {}) {
  let s = (I18N[lang()] && I18N[lang()][key]) ?? I18N.ru[key] ?? key;
  const all = { COIN: typeof COIN !== 'undefined' ? COIN : '', FISH: typeof FISH !== 'undefined' ? FISH : '', ...vars };
  Object.entries(all).forEach(([k, v]) => { s = s.split(`{${k}}`).join(v); });
  return s;
}

// Дробное число по правилам языка: 0,45 / 0.45
function fmtDec(x, digits) {
  const s = x.toFixed(digits);
  return lang() === 'ru' ? s.replace('.', ',') : s;
}

// Подменить названия и тексты на выбранный язык (вызывается один раз при запуске)
function applyLanguage() {
  if (!state.settings.lang) state.settings.lang = detectLang();
  const L = lang();
  document.documentElement.lang = L;

  if (L === 'en') {
    Object.entries(EN_NAMES.floors).forEach(([id, n]) => { CONFIG.floorTypes[id].name = n; });
    Object.entries(EN_NAMES.products).forEach(([id, list]) => list.forEach((n, i) => { CONFIG.products[id][i].name = n; }));
    Object.entries(EN_NAMES.upgrades).forEach(([id, n]) => { CONFIG.upgrades[id].name = n; });
    Object.assign(CHAT_LINES, CHAT_LINES_EN);
    TUTORIAL.forEach((s, i) => { if (TUTORIAL_EN[i]) s.text = TUTORIAL_EN[i]; });
    TIPS.forEach(x => { if (TIPS_EN[x.id]) x.text = TIPS_EN[x.id]; });
    CAT_NAMES.length = 0;
    CAT_NAMES.push(...CAT_NAME_PAIRS.map(p => p[1]));   // английские имена из names.js
    document.getElementById('sign').src = 'assets/bg/sign_en.png';
    document.title = 'Meow Tower';
  }
  localizeCatNames();   // жильцы — на выбранном языке (Пельмень ↔ Dumpling)

  // Подписи в обучении («Понятно» / «Готово!»)
  TUTORIAL.forEach(s => { if (s.button) s.button = s.button === 'Готово!' ? t('tut.done') : t('tut.ok'); });

  // Статичные тексты в index.html: <… data-i18n="ключ">
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-alt]').forEach(el => { el.alt = t(el.dataset.i18nAlt); });
}

// Сменить язык: сохраняем игру и перезагружаем страницу
function setLanguage(l) {
  if (l === lang()) return;
  state.settings.lang = l;
  saveGame(true);
  location.reload();
}
