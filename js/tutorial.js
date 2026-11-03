// =====================================================
//  tutorial.js — ОБУЧЕНИЕ от кота-консьержа в шляпе
//  Шаги идут по порядку. «Действие» засчитывается само, когда игрок его сделал.
//  «Понятно» — для шагов-объяснений. Тексты можно менять прямо тут.
// =====================================================

const TUTORIAL = [
  {
    text: 'Мяу! Я консьерж этой башни 🎩 Давай построим первый этаж — это бесплатно!',
    target: () => document.getElementById('btn-build'),
    done: () => state.floors.length >= 2
  },
  {
    text: 'Стройка идёт! Когда закончится — тапни новый этаж (или кнопку внизу) и выбери КОМНАТУ СНА: тут будут жить коты.',
    target: () => document.querySelector('#chooser:not([hidden]) .choice') || floorEl(topFloor().num),
    done: () => state.floors.some(f => isBuilt(f, 'living'))
  },
  {
    text: 'Гости приходят в лобби и сами садятся в лифт. Посмотри в облачко, куда ему надо, и тапни этот номер в шахте лифта.',
    target: () => document.getElementById('shaft'),
    done: () => state.residents.length > 0
  },
  {
    text: 'Ура, первый жилец! Теперь построй магазин — кафе, игрушки, спа или молочный бар. Когда стройка закончится, тапни этаж и выбери.',
    target: () => document.querySelector('#chooser:not([hidden]) .choice:not(:disabled):not(:first-child)') || document.getElementById('btn-build'),
    done: () => state.floors.some(f => isBuilt(f, 'work'))
  },
  {
    text: 'Магазин закрыт, пока там никто не работает. Тапни КОМНАТУ СНА, выбери кота и устрой его на работу. ❤️ — его работа мечты!',
    target: () => {
      const home = state.floors.find(f => isBuilt(f, 'living'));
      return document.querySelector('#residents:not([hidden]) .resident, #residents:not([hidden]) .job:not(:disabled)') || (home && floorEl(home.num));
    },
    done: () => state.residents.some(r => r.job !== null)
  },
  {
    text: 'Гость с лифта покупает 1 товар — так ты зарабатываешь. Кончился товар — на этаже появится 📦. Тапни этаж и закажи поставку (она стоит денег).',
    target: () => floorEl((state.floors.find(f => isBuilt(f, 'work')) || {}).num),
    button: 'Понятно'
  },
  {
    text: '⭐ Это рейтинг башни. Чем он выше, тем чаще приходят гости. Его поднимают коты на работе мечты и полные полки, а безработные — опускают. Тапни, чтобы увидеть почему.',
    target: () => document.getElementById('btn-rating'),
    button: 'Понятно'
  },
  {
    text: '💬 А это Мур-чат. Тут коты жалуются, радуются и предупреждают, что съедут. Тапни по сообщению — перейдёшь к коту или на его этаж.',
    target: () => document.getElementById('btn-chat'),
    button: 'Понятно'
  },
  {
    text: 'Дальше — сама! Я буду подсказывать, когда появится что-то новое: улучшения, люкс, рыбки. Удачи, хозяйка! 😺',
    target: () => document.getElementById('btn-upgrades'),
    button: 'Готово!'
  }
];

// ---------- Подсказки к моменту: появляются один раз, когда до них дошла игра ----------
const TIPS = [
  {
    id: 'upgrades',
    when: () => state.floors.length >= 3 &&
      state.coins >= Math.min(...['lift', 'build', 'delivery', 'storage'].map(id => upCost(id) ?? Infinity)),
    text: '🔨 Монет хватает на улучшение! Тут ускоряются лифт, стройка и доставка, растёт объём склада, а робот-лифтёр сам развозит гостей. Цены товаров повышаются в карточке магазина.',
    target: () => document.getElementById('btn-upgrades')
  },
  {
    id: 'lux6',
    when: () => topFloor().num >= 6 && topFloor().status !== 'built' && !state.floors.some(f => isBuilt(f, 'lux')),
    text: '6 этаж — особенный! Тут можно построить 👑 ЭЛИТНЫЙ ЛЮКС. VIP-гости платят аренду даже когда тебя нет, оставляют чаевые и дают рыбки 🐟. Каждый 5-й гость будет VIP.',
    target: () => document.querySelector('#chooser:not([hidden]) .choice:nth-child(2)') || floorEl(topFloor().num)
  },
  {
    id: 'luxBuilt',
    when: () => state.floors.some(f => isBuilt(f, 'lux')),
    text: 'Люкс готов! Жди в лобби гостя с короной 👑 и отвези его наверх. Аренду собирай тапом по значку на этаже, а в карточке люкса прокачивай VIP-зону.',
    target: () => floorEl((state.floors.find(f => isBuilt(f, 'lux')) || {}).num)
  },
  {
    id: 'events',
    when: () => Boolean(state.event),
    text: '✨ Событие! Иногда коты просят особые заказы, поставщики устраивают распродажи, а инспектор приходит с проверкой. Тапни значок с таймером наверху — там подробности.',
    target: () => document.getElementById('btn-event')
  },
  {
    id: 'fish',
    when: () => state.fish > 0,
    text: '🐟 Первые рыбки! Ими можно мгновенно достроить этаж (кнопка ⚡ на стройке), сразу получить поставку или нанять робота-лифтёра.',
    target: () => document.getElementById('fish').closest('.pill')
  }
];

let tutTarget = null;
let currentTip = null;

// Каждый тик: сначала основное обучение, потом подсказки к моменту
function tutorialTick() {
  const t = state.tutorial;
  if (!t) return hideTutorial();
  if (t.done) return tipsTick();

  // Шаги-действия, которые уже сделаны, засчитываются сами
  while (t.step < TUTORIAL.length && TUTORIAL[t.step].done && TUTORIAL[t.step].done()) t.step++;
  if (t.step >= TUTORIAL.length) { t.done = true; return hideTutorial(); }

  showTutorial(TUTORIAL[t.step]);
}

function showTutorial(s, badge) {
  const box = document.getElementById('tut');
  box.hidden = false;
  setHTML(box.querySelector('.tut-text'), s.text);
  const next = box.querySelector('.tut-next');
  next.hidden = !s.button;
  if (s.button) setHTML(next, s.button);
  setHTML(box.querySelector('.tut-count'), badge || `${state.tutorial.step + 1}/${TUTORIAL.length}`);
  box.querySelector('.tut-skip').hidden = Boolean(badge);   // подсказку не «пропускают», а читают

  // Подсветка: на что смотреть
  const el = s.target && s.target();
  if (el !== tutTarget) {
    if (tutTarget) tutTarget.classList.remove('tut-target');
    tutTarget = el || null;
    if (tutTarget) tutTarget.classList.add('tut-target');
  }
}

function hideTutorial() {
  document.getElementById('tut').hidden = true;
  if (tutTarget) { tutTarget.classList.remove('tut-target'); tutTarget = null; }
}

function tutorialNext() {
  if (state.tutorial.done && currentTip) {           // подсказка к моменту прочитана
    (state.tutorial.tips = state.tutorial.tips || []).push(currentTip.id);
    currentTip = null;
  } else {
    state.tutorial.step++;
  }
  tutorialTick();
}

function tipsTick() {
  const seen = state.tutorial.tips || [];
  // Пока открыто окошко (кроме выбора этажа) — не мешаем
  const busy = [...document.querySelectorAll('.modal')].some(m => !m.hidden && m.id !== 'chooser');
  const tip = busy ? null : TIPS.find(x => !seen.includes(x.id) && x.when());
  currentTip = tip || null;
  if (!tip) return hideTutorial();
  showTutorial({ ...tip, button: t('tut.ok') }, '💡');
}

function skipTutorial() {
  state.tutorial.done = true;
  hideTutorial();
}

function restartTutorial() {
  state.tutorial = { step: 0, done: false, tips: [] };
  closeModal('settings');
  tutorialTick();
}
