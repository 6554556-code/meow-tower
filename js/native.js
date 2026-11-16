// =====================================================
//  native.js — КОГДА ИГРА РАБОТАЕТ КАК ПРИЛОЖЕНИЕ (iOS / Android через Capacitor)
//
//  Зачем: в приложении iOS может сам почистить localStorage, если на телефоне
//  мало места, — и котики пропадут. Поэтому в приложении сохранение
//  дублируется в надёжное хранилище телефона (плагин Preferences).
//  При запуске: если localStorage пустой, а в хранилище есть сохранение — возвращаем его.
//
//  В браузере и в Telegram этот файл ничего не делает.
// =====================================================

const IS_APP = Boolean(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

function nativePrefs() {
  return IS_APP && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences;
}

// До старта игры: подхватить сохранение из надёжного хранилища
async function nativeInit() {
  const prefs = nativePrefs();
  if (!prefs) return;
  try {
    const { value } = await prefs.get({ key: SAVE_KEY });
    if (!value) return;
    let local = null;
    try { local = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { /* нет */ }
    const saved = JSON.parse(value);
    if (!local || saved.savedAt > local.savedAt) localStorage.setItem(SAVE_KEY, value);   // берём более свежее
  } catch (e) {
    console.warn('Хранилище приложения недоступно:', e);
  }
}

// Из saveGame(): записать копию (не ждём — запись идёт в фоне)
function nativeSave(json) {
  const prefs = nativePrefs();
  if (prefs) prefs.set({ key: SAVE_KEY, value: json }).catch(() => { /* не страшно, есть localStorage */ });
}

// «Начать заново»
async function nativeReset() {
  const prefs = nativePrefs();
  if (prefs) try { await prefs.remove({ key: SAVE_KEY }); } catch (e) { /* ничего */ }
}
