"""
atualizar_oficial.py
====================
Busca os resultados da Copa do Mundo 2026 e atualiza automaticamente
o campo OFICIAL no arquivo data/bolao.json.

Fontes suportadas (tenta na ordem, usa a primeira que funcionar):
  1. placardefutebol.com.br  (scraping — requer navegador local)
  2. worldcupjson.net        (API JSON gratuita)
  3. football-data.org       (requer API key gratuita — opcional)

Como usar
---------
  pip install requests beautifulsoup4 lxml
  python atualizar_oficial.py            # roda uma vez
  python atualizar_oficial.py --watch    # fica rodando a cada 5 min

Coloque este arquivo na raiz do projeto (ao lado de index.html).
"""

import json
import os
import re
import sys
import time
import argparse
from datetime import datetime, timezone
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("❌  Instale as dependências: pip install requests beautifulsoup4 lxml")
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────
# CAMINHOS
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR  = Path(__file__).parent
BOLAO_FILE  = SCRIPT_DIR / "data" / "bolao.json"
LOG_FILE    = SCRIPT_DIR / "data" / "atualizar_oficial.log"

# ─────────────────────────────────────────────────────────────────────────────
# GRUPOS E JOGOS DO BOLÃO (espelho de js/data.js)
# Ordem dos jogos em cada grupo: todos contra todos, combinações (i,j) i<j
# ─────────────────────────────────────────────────────────────────────────────

GROUPS = {
    "A": ["México",        "África do Sul",     "Coreia do Sul",  "Rep. Tcheca"],
    "B": ["Canadá",        "Bósnia-Herzegovina","Catar",          "Suíça"],
    "C": ["Brasil",        "Marrocos",          "Haiti",          "Escócia"],
    "D": ["EUA",           "Paraguai",          "Austrália",      "Turquia"],
    "E": ["Alemanha",      "Curaçao",           "Costa do Marfim","Equador"],
    "F": ["Países Baixos", "Japão",             "Suécia",         "Tunísia"],
    "G": ["Bélgica",       "Egito",             "Irã",            "Nova Zelândia"],
    "H": ["Espanha",       "Cabo Verde",        "Arábia Saudita", "Uruguai"],
    "I": ["França",        "Senegal",           "Iraque",         "Noruega"],
    "J": ["Argentina",     "Argélia",           "Áustria",        "Jordânia"],
    "K": ["Portugal",      "R.D. Congo",        "Uzbequistão",    "Colômbia"],
    "L": ["Inglaterra",    "Croácia",           "Gana",           "Panamá"],
}

def generate_matches(teams):
    """Gera todos os jogos (todos contra todos) para um grupo."""
    matches = []
    for i in range(len(teams)):
        for j in range(i + 1, len(teams)):
            matches.append({
                "home":      teams[i],
                "away":      teams[j],
                "homeGoals": "",
                "awayGoals": "",
            })
    return matches

def build_empty_palpites():
    return {g: generate_matches(teams) for g, teams in GROUPS.items()}

# ─────────────────────────────────────────────────────────────────────────────
# MAPA DE NOMES: como cada seleção pode aparecer nas fontes externas
# Chave = variações possíveis (minúsculo, sem acento ok)
# Valor = nome canônico usado no bolão
# ─────────────────────────────────────────────────────────────────────────────

NAME_MAP = {
    # Grupo A
    "mexico":                   "México",
    "méxico":                   "México",
    "africa do sul":            "África do Sul",
    "africa-do-sul":            "África do Sul",
    "south africa":             "África do Sul",
    "coreia do sul":            "Coreia do Sul",
    "south korea":              "Coreia do Sul",
    "korea republic":           "Coreia do Sul",
    "rep. tcheca":              "Rep. Tcheca",
    "republica tcheca":         "Rep. Tcheca",
    "czech republic":           "Rep. Tcheca",
    "czechia":                  "Rep. Tcheca",

    # Grupo B
    "canada":                   "Canadá",
    "canadá":                   "Canadá",
    "bosnia-herzegovina":       "Bósnia-Herzegovina",
    "bósnia-herzegovina":       "Bósnia-Herzegovina",
    "bosnie-herzegovine":       "Bósnia-Herzegovina",
    "bosnia and herzegovina":   "Bósnia-Herzegovina",
    "catar":                    "Catar",
    "qatar":                    "Catar",
    "suica":                    "Suíça",
    "suíça":                    "Suíça",
    "switzerland":              "Suíça",

    # Grupo C
    "brasil":                   "Brasil",
    "brazil":                   "Brasil",
    "marrocos":                 "Marrocos",
    "morocco":                  "Marrocos",
    "haiti":                    "Haiti",
    "escocia":                  "Escócia",
    "escócia":                  "Escócia",
    "scotland":                 "Escócia",

    # Grupo D
    "eua":                      "EUA",
    "estados unidos":           "EUA",
    "usa":                      "EUA",
    "united states":            "EUA",
    "paraguai":                 "Paraguai",
    "paraguay":                 "Paraguai",
    "australia":                "Austrália",
    "austrália":                "Austrália",
    "turquia":                  "Turquia",
    "turkey":                   "Turquia",

    # Grupo E
    "alemanha":                 "Alemanha",
    "germany":                  "Alemanha",
    "curacao":                  "Curaçao",
    "curaçao":                  "Curaçao",
    "costa do marfim":          "Costa do Marfim",
    "cote d'ivoire":            "Costa do Marfim",
    "ivory coast":              "Costa do Marfim",
    "equador":                  "Equador",
    "ecuador":                  "Equador",

    # Grupo F
    "paises baixos":            "Países Baixos",
    "países baixos":            "Países Baixos",
    "netherlands":              "Países Baixos",
    "holland":                  "Países Baixos",
    "japao":                    "Japão",
    "japão":                    "Japão",
    "japan":                    "Japão",
    "suecia":                   "Suécia",
    "suécia":                   "Suécia",
    "sweden":                   "Suécia",
    "tunisia":                  "Tunísia",
    "tunísia":                  "Tunísia",

    # Grupo G
    "belgica":                  "Bélgica",
    "bélgica":                  "Bélgica",
    "belgium":                  "Bélgica",
    "egito":                    "Egito",
    "egypt":                    "Egito",
    "ira":                      "Irã",
    "irã":                      "Irã",
    "iran":                     "Irã",
    "nova zelandia":            "Nova Zelândia",
    "nova zelândia":            "Nova Zelândia",
    "new zealand":              "Nova Zelândia",

    # Grupo H
    "espanha":                  "Espanha",
    "spain":                    "Espanha",
    "cabo verde":               "Cabo Verde",
    "cape verde":               "Cabo Verde",
    "arabia saudita":           "Arábia Saudita",
    "arábia saudita":           "Arábia Saudita",
    "saudi arabia":             "Arábia Saudita",
    "uruguai":                  "Uruguai",
    "uruguay":                  "Uruguai",

    # Grupo I
    "franca":                   "França",
    "frança":                   "França",
    "france":                   "França",
    "senegal":                  "Senegal",
    "iraque":                   "Iraque",
    "iraq":                     "Iraque",
    "noruega":                  "Noruega",
    "norway":                   "Noruega",

    # Grupo J
    "argentina":                "Argentina",
    "argelia":                  "Argélia",
    "argélia":                  "Argélia",
    "algeria":                  "Argélia",
    "austria":                  "Áustria",
    "áustria":                  "Áustria",
    "jordania":                 "Jordânia",
    "jordânia":                 "Jordânia",
    "jordan":                   "Jordânia",

    # Grupo K
    "portugal":                 "Portugal",
    "rd congo":                 "R.D. Congo",
    "r.d. congo":               "R.D. Congo",
    "democratic republic of congo": "R.D. Congo",
    "dr congo":                 "R.D. Congo",
    "uzbequistao":              "Uzbequistão",
    "uzbequistão":              "Uzbequistão",
    "uzbekistan":               "Uzbequistão",
    "colombia":                 "Colômbia",
    "colômbia":                 "Colômbia",

    # Grupo L
    "inglaterra":               "Inglaterra",
    "england":                  "Inglaterra",
    "croacia":                  "Croácia",
    "croácia":                  "Croácia",
    "croatia":                  "Croácia",
    "gana":                     "Gana",
    "ghana":                    "Gana",
    "panama":                   "Panamá",
    "panamá":                   "Panamá",
}

def normalize_team(name: str) -> str | None:
    """Converte um nome de seleção para o nome canônico do bolão."""
    key = name.strip().lower()
    # remove acentos opcionais via transliteração simples
    key = key.replace("'", "").replace("-", " ").replace(".", " ")
    key = " ".join(key.split())   # normaliza espaços
    return NAME_MAP.get(key)

# ─────────────────────────────────────────────────────────────────────────────
# ÍNDICE: (home, away) → (grupo, índice_do_jogo)
# ─────────────────────────────────────────────────────────────────────────────

def build_match_index():
    """Cria um dicionário (home, away) -> (grupo, idx) para busca rápida."""
    idx = {}
    for g, teams in GROUPS.items():
        for i, t1 in enumerate(teams):
            for j in range(i + 1, len(teams)):
                t2 = teams[j]
                match_idx = sum(
                    len(teams) - 1 - k for k in range(i)
                ) + (j - i - 1)
                idx[(t1, t2)] = (g, match_idx)
                idx[(t2, t1)] = (g, match_idx)   # invertido também
    return idx

MATCH_INDEX = build_match_index()

# ─────────────────────────────────────────────────────────────────────────────
# FONTE 1: placardefutebol.com.br
# ─────────────────────────────────────────────────────────────────────────────

PLACAR_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "pt-BR,pt;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": "https://www.google.com.br/",
}

FINISHED_STATUSES = {"encerrado", "fim de jogo", "finalizado", "ft", "aet"}

def fetch_placardefutebol() -> list[dict]:
    """
    Faz scraping do placardefutebol.com.br e retorna lista de:
      { home, away, homeGoals, awayGoals, status }
    Só jogos ENCERRADOS.
    """
    r = requests.get(
        "https://www.placardefutebol.com.br/",
        headers=PLACAR_HEADERS,
        timeout=15,
    )
    r.raise_for_status()

    soup = BeautifulSoup(r.text, "lxml")
    leagues = soup.find_all("h3", class_="match-list_league-name")
    blocks  = soup.find_all("div", class_="container content")

    results = []

    for block_idx, block in enumerate(blocks):
        league = leagues[block_idx].text.strip() if block_idx < len(leagues) else ""
        matches = block.find_all("div", class_="row align-items-center content")

        for match in matches:
            status_el = match.find("span", class_="status-name")
            status    = status_el.text.strip().lower() if status_el else ""

            # Só processa jogos já encerrados
            if status not in FINISHED_STATUSES:
                continue

            teams  = match.find_all("div", class_="team-name")
            scores = match.find_all("span", class_="badge badge-default")

            if len(teams) < 2 or len(scores) < 2:
                continue

            home_name  = teams[0].text.strip()
            away_name  = teams[1].text.strip()
            home_goals = scores[0].text.strip()
            away_goals = scores[1].text.strip()

            results.append({
                "home":      home_name,
                "away":      away_name,
                "homeGoals": home_goals,
                "awayGoals": away_goals,
                "status":    status,
                "league":    league,
            })

    return results

# ─────────────────────────────────────────────────────────────────────────────
# FONTE 2: worldcupjson.net
# ─────────────────────────────────────────────────────────────────────────────

def fetch_worldcupjson() -> list[dict]:
    """
    API JSON gratuita: https://worldcupjson.net/matches
    Retorna todos os jogos com resultado.
    """
    r = requests.get(
        "https://worldcupjson.net/matches",
        timeout=15,
        headers={"User-Agent": "bolao-copa-2026/1.0"},
    )
    r.raise_for_status()
    data = r.json()

    results = []
    for m in data:
        if m.get("status") not in ("completed", "in progress"):
            continue
        home = m.get("home_team", {}).get("name", "")
        away = m.get("away_team", {}).get("name", "")
        home_goals = m.get("home_team", {}).get("goals")
        away_goals = m.get("away_team", {}).get("goals")

        if home_goals is None or away_goals is None:
            continue

        results.append({
            "home":      home,
            "away":      away,
            "homeGoals": str(home_goals),
            "awayGoals": str(away_goals),
            "status":    m.get("status", ""),
            "league":    "Copa do Mundo 2026",
        })

    return results

# ─────────────────────────────────────────────────────────────────────────────
# FONTE 3: football-data.org (requer API key gratuita)
# ─────────────────────────────────────────────────────────────────────────────

def fetch_football_data(api_key: str) -> list[dict]:
    """
    https://www.football-data.org/  — plano gratuito inclui Copa do Mundo.
    Cadastre-se em https://www.football-data.org/client/register e obtenha sua chave.
    Passe como: python atualizar_oficial.py --api-key SUA_CHAVE
    """
    r = requests.get(
        "https://api.football-data.org/v4/competitions/WC/matches",
        headers={"X-Auth-Token": api_key},
        timeout=15,
    )
    r.raise_for_status()
    data = r.json()

    results = []
    for m in data.get("matches", []):
        if m.get("status") != "FINISHED":
            continue
        home = m["homeTeam"]["name"]
        away = m["awayTeam"]["name"]
        score = m.get("score", {}).get("fullTime", {})
        home_goals = score.get("home")
        away_goals = score.get("away")

        if home_goals is None or away_goals is None:
            continue

        results.append({
            "home":      home,
            "away":      away,
            "homeGoals": str(home_goals),
            "awayGoals": str(away_goals),
            "status":    "FINISHED",
            "league":    "FIFA World Cup",
        })

    return results

# ─────────────────────────────────────────────────────────────────────────────
# MOTOR PRINCIPAL: aplica resultados ao bolão
# ─────────────────────────────────────────────────────────────────────────────

def apply_results_to_bolao(raw_results: list[dict], current_palpites: dict) -> tuple[dict, int, list]:
    """
    Recebe lista de jogos com resultado e atualiza os palpites do OFICIAL.
    Retorna (palpites_atualizados, total_atualizados, erros).
    """
    palpites  = json.loads(json.dumps(current_palpites))  # cópia profunda
    updated   = 0
    not_found = []

    for raw in raw_results:
        home_raw = raw.get("home", "")
        away_raw = raw.get("away", "")

        home_canonical = normalize_team(home_raw)
        away_canonical = normalize_team(away_raw)

        if not home_canonical:
            not_found.append(f"Time não mapeado (home): '{home_raw}'")
            continue
        if not away_canonical:
            not_found.append(f"Time não mapeado (away): '{away_raw}'")
            continue

        # Procura o jogo no índice (qualquer ordem home/away)
        key = (home_canonical, away_canonical)
        if key not in MATCH_INDEX:
            not_found.append(
                f"Jogo não encontrado no bolão: {home_canonical} x {away_canonical}"
            )
            continue

        grupo, idx = MATCH_INDEX[key]
        jogo = palpites[grupo][idx]

        # Verifica ordem correta (home/away podem estar invertidos)
        if jogo["home"] == home_canonical:
            jogo["homeGoals"] = str(raw["homeGoals"])
            jogo["awayGoals"] = str(raw["awayGoals"])
        else:
            # invertido — troca os placares
            jogo["homeGoals"] = str(raw["awayGoals"])
            jogo["awayGoals"] = str(raw["homeGoals"])

        updated += 1

    return palpites, updated, not_found

# ─────────────────────────────────────────────────────────────────────────────
# LEITURA / ESCRITA DO bolao.json
# ─────────────────────────────────────────────────────────────────────────────

def load_bolao() -> dict:
    if not BOLAO_FILE.exists():
        return {"users": {}}
    with open(BOLAO_FILE, encoding="utf-8") as f:
        return json.load(f)

def save_bolao(data: dict):
    BOLAO_FILE.parent.mkdir(parents=True, exist_ok=True)
    # Escreve em arquivo temporário primeiro (atômico)
    tmp = BOLAO_FILE.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    tmp.replace(BOLAO_FILE)

# ─────────────────────────────────────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────────────────────────────────────

def log(msg: str):
    ts  = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    line = f"[{ts}] {msg}"
    print(line)
    try:
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass

# ─────────────────────────────────────────────────────────────────────────────
# EXECUÇÃO PRINCIPAL
# ─────────────────────────────────────────────────────────────────────────────

def run(api_key: str | None = None, source: str = "auto"):
    log("═" * 60)
    log("Iniciando atualização do OFICIAL…")

    # 1. Busca resultados
    raw_results = []
    errors      = []

    sources_to_try = (
        [source] if source != "auto"
        else ["placardefutebol", "worldcupjson"] + (["football-data"] if api_key else [])
    )

    for src in sources_to_try:
        try:
            if src == "placardefutebol":
                log("Tentando fonte: placardefutebol.com.br…")
                raw_results = fetch_placardefutebol()
            elif src == "worldcupjson":
                log("Tentando fonte: worldcupjson.net…")
                raw_results = fetch_worldcupjson()
            elif src == "football-data" and api_key:
                log("Tentando fonte: football-data.org…")
                raw_results = fetch_football_data(api_key)
            else:
                continue

            log(f"  ✔ {len(raw_results)} jogo(s) encontrado(s).")
            break

        except Exception as e:
            log(f"  ✘ Falha na fonte '{src}': {e}")
            errors.append(str(e))

    if not raw_results:
        log("⚠  Nenhuma fonte retornou resultados. Abortando.")
        return

    # 2. Carrega bolao.json
    bolao = load_bolao()

    # 3. Garante que OFICIAL existe
    if "OFICIAL" not in bolao["users"]:
        bolao["users"]["OFICIAL"] = {}
    if "palpites" not in bolao["users"]["OFICIAL"]:
        bolao["users"]["OFICIAL"]["palpites"] = build_empty_palpites()

    current = bolao["users"]["OFICIAL"]["palpites"]

    # 4. Aplica resultados
    updated_palpites, n_updated, not_found = apply_results_to_bolao(raw_results, current)

    bolao["users"]["OFICIAL"]["palpites"] = updated_palpites
    bolao["users"]["OFICIAL"]["lastUpdate"] = datetime.now(timezone.utc).isoformat()

    # 5. Salva
    save_bolao(bolao)

    log(f"✔ {n_updated} jogo(s) atualizado(s) em data/bolao.json")
    if not_found:
        log(f"⚠  {len(not_found)} jogo(s) não reconhecido(s):")
        for nf in not_found:
            log(f"   - {nf}")

    log("Concluído.")

# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Atualiza resultados do OFICIAL no bolao.json automaticamente."
    )
    parser.add_argument(
        "--watch", "-w",
        action="store_true",
        help="Fica rodando a cada --interval minutos (padrão: 5)",
    )
    parser.add_argument(
        "--interval", "-i",
        type=int,
        default=5,
        help="Intervalo em minutos para o modo --watch (padrão: 5)",
    )
    parser.add_argument(
        "--source", "-s",
        choices=["auto", "placardefutebol", "worldcupjson", "football-data"],
        default="auto",
        help="Fonte de dados a usar (padrão: auto — tenta todas)",
    )
    parser.add_argument(
        "--api-key", "-k",
        default=None,
        help="API key do football-data.org (opcional, só para essa fonte)",
    )

    args = parser.parse_args()

    if args.watch:
        log(f"Modo watch ativo — atualizando a cada {args.interval} minuto(s).")
        while True:
            try:
                run(api_key=args.api_key, source=args.source)
            except Exception as e:
                log(f"❌ Erro inesperado: {e}")
            time.sleep(args.interval * 60)
    else:
        run(api_key=args.api_key, source=args.source)
