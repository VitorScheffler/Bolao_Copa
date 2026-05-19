(function () {
  const TARGET = new Date('2026-06-11T16:00:00').getTime();

  let intervalStarted = false;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function tick() {
    const elDias = document.getElementById('cd-dias');
    const elHoras = document.getElementById('cd-horas');
    const elMin = document.getElementById('cd-min');
    const elSeg = document.getElementById('cd-seg');

    if (!elDias || !elHoras || !elMin || !elSeg) return;

    const diff = TARGET - Date.now();

    if (diff <= 0) {
      elDias.textContent = '0';
      elHoras.textContent = '00';
      elMin.textContent = '00';
      elSeg.textContent = '00';
      return;
    }

    const dias = Math.floor(diff / 86400000);
    const horas = Math.floor((diff % 86400000) / 3600000);
    const min = Math.floor((diff % 3600000) / 60000);
    const seg = Math.floor((diff % 60000) / 1000);

    elDias.textContent = dias;
    elHoras.textContent = pad(horas);
    elMin.textContent = pad(min);
    elSeg.textContent = pad(seg);
  }

  function start() {
    if (intervalStarted) return; // 🔥 impede duplicação
    intervalStarted = true;

    tick();
    setInterval(tick, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.getCupCountdown = function () {
  const TARGET = new Date('2026-06-11T16:00:00').getTime();
  const diff = TARGET - Date.now();

  if (diff <= 0) {
    return { dias: 0, horas: 0, min: 0, seg: 0 };
  }

  return {
    dias: Math.floor(diff / 86400000),
    horas: Math.floor((diff % 86400000) / 3600000),
    min: Math.floor((diff % 3600000) / 60000),
    seg: Math.floor((diff % 60000) / 1000)
  };
};
})();