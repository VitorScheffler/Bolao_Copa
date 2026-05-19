// ── VIEW ROUTER (CORRIGIDO) ────────────────────────────────────────────────

function renderSelecoes() {
  const container = document.getElementById("teams-container");

  if (!container) {
    console.warn("Container teams-container não encontrado");
    return;
  }

  if (!window.selecoes || !Array.isArray(window.selecoes)) {
    console.warn("window.selecoes não carregado");
    return;
  }

  container.innerHTML = window.selecoes.map(sel => `
    <div class="palpite-card" onclick="setView('minha-classificacao', this)">
      <div class="palpite-icon">
        <img src="${sel.img}" alt="${sel.nome}">
      </div>
      <div class="palpite-content">
        <h3>${sel.nome}</h3>
      </div>
      <div class="palpite-arrow">→</div>
    </div>
  `).join("");
}

window.setView = window.setView || function(viewName, el = null) {

  document.querySelectorAll('.view')
    .forEach(v => v.classList.remove('active'));

  const viewEl = document.getElementById(`view-${viewName}`);
  if (viewEl) viewEl.classList.add('active');

  // render específico
  if (viewName === 'jogos') {
    renderSelecoes();
  }

  setCurrentView(viewName);
};

window.selecoes = [
    { nome: "África do Sul", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/EGwD4_SUlmwZWbnHhcmTPA_48x48.png" },
    { nome: "Alemanha", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/h1FhPLmDg9AHXzhygqvVPg_48x48.png" },
    { nome: "Arábia Saudita", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/QoAJxO46fHid3_T-7nRZ0Q_48x48.png" },
    { nome: "Argélia", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/-zzT3_3TWS1ZrjuUr-qs5A_48x48.png" },
    { nome: "Argentina", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/1xBWyjjkA6vEWopPK3lIPA_48x48.png" },
    { nome: "Austrália", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/QYCU22ymggIHGp6LW4EQVg_48x48.png" },
    { nome: "Austria", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/HwYB-wsdd6M2WmLXSkd6Sg_48x48.png" },
    { nome: "Belgica", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/6SF7yEoB60bU5knw-M7R5Q_48x48.png" },
    { nome: "Bosnia e Herzegovina", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/em3xOvyKQEgz1IIYI8GO9w_48x48.png" },
    { nome: "Brasil", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/zKLzoJVYz0bb6oAnPUdwWQ_48x48.png" },
    { nome: "Cabo Verde", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/VHI7nuXNqeMELbBEsPkvjQ_48x48.png" },
    { nome: "Canada", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/H23oIEP6qK-zNc3O8abnIA_48x48.png" },
    { nome: "Catar", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/h0FNA5YxLzWChHS5K0o4gw_48x48.png" },
    { nome: "Colombia", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/tXHnA_tDylayacdjWQCJvw_48x48.png" },
    { nome: "Costa do Marfim", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/WzV0s6me4JPkCNeSsTyptQ_48x48.png" },
    { nome: "Croacia", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/9toerdOg8xW4CRhDaZxsyw_48x48.png" },
    { nome: "Curacau", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/LDXafv-GmI3Hew89wC6GXg_48x48.png" },
    { nome: "Egito", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/lYah1Uqw37XdicC6C4HNqg_48x48.png" },
    { nome: "Equador", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/AKqvkBpIyr-iLOK7Ig7-yQ_48x48.png" },
    { nome: "Escocia", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/KNmWgtzC7DeN0X-OJEDsMA_48x48.png" },
    { nome: "Espanha", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/5hLkf7KFHhmpaiOJQv8LmA_48x48.png" },
    { nome: "EUA", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/wj9uZvn_vZrelLFGH8fnPA_48x48.png" },
    { nome: "Franca", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/z3JEQB3coEAGLCJBEUzQ2A_48x48.png" },
    { nome: "Gana", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/VJQ1emg0TOubjGnap4vWuw_48x48.png" },
    { nome: "Haiti", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/AkMdqELoXN2wfYDvtMIQBQ_48x48.png" },
    { nome: "Holanda", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/8GEqzfLegwFFpe6X2BODTg_48x48.png" },
    { nome: "Inglaterra", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/DTqIL8Ba3KIuxGkpXw5ayA_48x48.png" },
    { nome: "Iraque", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/S5ivsscrfCG1mgqceKMPlQ_48x48.png" },
    { nome: "Japao", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/by4OltvtZz7taxuQtkiP3A_48x48.png" },
    { nome: "Jordania", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/9swSmw5NICcCYIQ8FERjhw_48x48.png" },
    { nome: "Marrocos", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/I3gt2Ew39ux3GGdZ-4JE3g_48x48.png" },
    { nome: "Mexico", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/yJF9xqmUGenD8108FJbg9A_48x48.png" },
    { nome: "Noruega", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/lLDKax72TPgU_Hcj0W-DOg_48x48.png" },
    { nome: "Nova Zelandia", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/U4GV26FjF1W9Aphi7SELhw_48x48.png" },
    { nome: "Panama", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/JIn8OwxL6KFFiYrKGnL2RQ_48x48.png" },
    { nome: "Paraguai", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/-FN-y84Al3dbth0hW1t5Qg_48x48.png" },
    { nome: "Portugal", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/HJ3_2c4w791nZJj7n-Lj3Q_48x48.png" },
    { nome: "RD do Congo", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/B0wsGHH3HXHsV_5dvmnPuQ_48x48.png" },
    { nome: "Coreia", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/Uu5pwNmMHGd5bCooKrS3Lw_48x48.png" },
    { nome: "RI do Ira", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/1oq8Fy7ETpBpZNaCA22ArQ_48x48.png" },
    { nome: "Senegal", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/zw3ac5sIbH4DS6zP5auOkQ_48x48.png" },
    { nome: "Suecia", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/OkFlRvRsKMWb8Hk20L9Trw_48x48.png" },
    { nome: "Suica", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/1hy9ek4dOIffYULM6k1fqg_48x48.png" },
    { nome: "Tchequia", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/8AluO-WxpcHtC0KKHmFgvg_48x48.png" },
    { nome: "Tunisia", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/Xs33c9XVUJBX0IkeFn_bIw_48x48.png" },
    { nome: "Turquia", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/hYrtTF982kN3GcYNdSPL9g_48x48.png" },
    { nome: "Uruguai", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/KnSUdQWiGRoy89q4x85IgA_48x48.png" },
    { nome: "Uzbequistao", img: "//ssl.gstatic.com/onebox/media/sports/logos/optimized/4UvchPY7qJwQhQjWMgHTqQ_48x48.png" }
];