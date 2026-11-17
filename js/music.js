// =====================================================
//  music.js — ФОНОВАЯ МУЗЫКА (assets/music/theme.mp3)
//
//  • Включена по умолчанию, переключатель — в ⚙️ Настройках.
//  • Начинает играть после первого тапа: браузеры и айфон не дают
//    приложениям включать звук самим.
//  • Замолкает, когда игру свернули, и продолжает, когда вернулись.
//  • Громкость «зашита» в сам файл (тихо, фоном): на айфоне громкость
//    музыки из кода не меняется. Нужно громче/тише — пересобираем файл.
// =====================================================

// Звук как у игр (айфон): уважает беззвучный режим и не глушит музыку из других приложений
if (navigator.audioSession) try { navigator.audioSession.type = 'ambient'; } catch (e) { /* старый браузер */ }

const music = new Audio('assets/music/theme.mp3');
music.loop = true;
music.preload = 'auto';

// Играть или молчать — решаем по настройке и по тому, видна ли игра
function updateMusic() {
  const wanted = state.settings && state.settings.music && !document.hidden;
  if (wanted) {
    const p = music.play();
    if (p) p.catch(() => { /* ещё не было тапа — включится на первом */ });
  } else {
    music.pause();
  }
}

function toggleMusic() {
  state.settings.music = !state.settings.music;
  updateMusic();
  saveGame();
}

// Вызывается один раз при старте игры
function initMusic() {
  document.addEventListener('pointerdown', updateMusic, { once: true });   // первый тап — «можно звук»
  document.addEventListener('visibilitychange', updateMusic);              // свернули / вернулись
  updateMusic();
}
