// ==UserScript==
// @name         Aurora Dex · Siempre modo oscuro
// @namespace    auroradex-siempre-oscuro
// @version      1.0.0
// @description  Mantiene Aurora Dex en modo oscuro aunque React vuelva a pintar la página o algo quite la clase «oscuro».
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  // Misma tabla que usa la web en su <head> para saber si un tema de color es de superficie clara u oscura
  const SUPERFICIE = {
    pergamino: 'clara', menta: 'clara', lavanda: 'clara', pizarra: 'clara', cereza: 'clara',
    bosque: 'oscura', oceano: 'oscura', atardecer: 'clara', cueva: 'oscura', ventisca: 'clara',
    consola: 'clara', pokebola: 'clara', rocket: 'oscura', boreal: 'oscura', volcan: 'oscura', oro: 'oscura',
  };

  const lsGet = k => { try { return localStorage.getItem(k); } catch { return null; } };

  // La web solo pone «oscuro» si aurora-tema vale «oscuro»: se deja fijado para las próximas cargas
  try { if (lsGet('aurora-tema') !== 'oscuro') localStorage.setItem('aurora-tema', 'oscuro'); } catch { /* sin storage */ }

  function aplicar() {
    const html = document.documentElement;
    if (!html) return;
    if (!html.classList.contains('oscuro')) html.classList.add('oscuro');
    const t = lsGet('aurora:tema-color');
    if (t && SUPERFICIE[t]) {
      if (html.getAttribute('data-tema') !== t) html.setAttribute('data-tema', t);
      if (html.getAttribute('data-superficie') !== SUPERFICIE[t]) html.setAttribute('data-superficie', SUPERFICIE[t]);
    }
  }

  // Vigila los atributos del <html> actual; si React lo sustituye por uno nuevo, se vuelve a enganchar
  let vigilado = null;
  const obsAttr = new MutationObserver(aplicar);
  function enganchar() {
    const html = document.documentElement;
    if (!html || html === vigilado) return;
    obsAttr.disconnect();
    obsAttr.observe(html, { attributes: true, attributeFilter: ['class', 'data-tema', 'data-superficie'] });
    vigilado = html;
    aplicar();
  }

  enganchar();
  new MutationObserver(enganchar).observe(document, { childList: true });
})();
