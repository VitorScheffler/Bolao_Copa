// ─────────────────────────────────────────────
// CALENDÁRIO ESTILO OUTLOOK
// ─────────────────────────────────────────────

let todosJogos = [];

let currentMonth = 5; // junho
let currentYear = 2026;

// ─────────────────────────────────────────────
// CARREGAR
// ─────────────────────────────────────────────

async function carregarCalendario() {

  try {

    const response = await fetch(
      "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json"
    );

    const data = await response.json();

    todosJogos = data.matches || [];

    renderCalendar();

  } catch (err) {

    console.error(err);

  }

}

// ─────────────────────────────────────────────
// RENDER CALENDÁRIO
// ─────────────────────────────────────────────

function renderCalendar() {

  const grid = document.getElementById("calendar-grid");

  if (!grid) return;

  grid.innerHTML = "";

  const monthNames = [
    "Janeiro","Fevereiro","Março","Abril",
    "Maio","Junho","Julho","Agosto",
    "Setembro","Outubro","Novembro","Dezembro"
  ];

  document.getElementById("calendar-month").innerText =
    `${monthNames[currentMonth]} ${currentYear}`;

  const firstDay =
    new Date(currentYear, currentMonth, 1);

  const lastDay =
    new Date(currentYear, currentMonth + 1, 0);

  const startWeekDay = firstDay.getDay();

  const totalDays = lastDay.getDate();

  // CABEÇALHO

  const weekdays = [
    "Dom","Seg","Ter","Qua","Qui","Sex","Sáb"
  ];

  weekdays.forEach(day => {

    const el = document.createElement("div");

    el.className = "calendar-weekday";

    el.innerText = day;

    grid.appendChild(el);

  });

  // ESPAÇOS INICIAIS

  for (let i = 0; i < startWeekDay; i++) {

    const empty = document.createElement("div");

    empty.className = "calendar-cell empty";

    grid.appendChild(empty);

  }

  // DIAS

  for (let day = 1; day <= totalDays; day++) {

    const cell = document.createElement("div");

    cell.className = "calendar-cell";

    const dateStr =
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const jogosDia = todosJogos.filter(jogo =>
      jogo.date === dateStr
    );

    cell.innerHTML = `
        <div class="calendar-day-number">${day}</div>
        <div class="calendar-events"></div>
    `;

    jogosDia.forEach(jogo => {

      const event = document.createElement("div");

      event.className = "calendar-event";

      event.innerHTML = `
        <div class="event-time">
          ${jogo.time || ""}
        </div>

        <div class="event-match">
          ${jogo.team1} x ${jogo.team2}
        </div>
      `;

      cell.appendChild(event);

    });

    grid.appendChild(cell);

  }

}

// ─────────────────────────────────────────────
// NAVEGAÇÃO
// ─────────────────────────────────────────────

function proximoMes() {

  currentMonth++;

  if (currentMonth > 11) {

    currentMonth = 0;

    currentYear++;

  }

  renderCalendar();

}

function mesAnterior() {

  currentMonth--;

  if (currentMonth < 0) {

    currentMonth = 11;

    currentYear--;

  }

  renderCalendar();

}

// ─────────────────────────────────────────────
// VIEW
// ─────────────────────────────────────────────

async function renderCalendario() {

  if (!todosJogos.length) {

    await carregarCalendario();

  } else {

    renderCalendar();

  }

}

// GLOBAL

window.proximoMes = proximoMes;
window.mesAnterior = mesAnterior;