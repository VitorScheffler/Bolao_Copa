# atualizar_estatisticas.py
# -*- coding: utf-8 -*-

import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from pathlib import Path

# ─────────────────────────────────────────────────────────────
# CAMINHOS
# ─────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent.parent

DATA_DIR = ROOT_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

ARQUIVO = DATA_DIR / "estatisticas.json"
LOG_FILE = DATA_DIR / "atualizar_estatisticas.log"

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────

def log(msg):
    agora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    linha = f"[{agora}] {msg}"

    print(linha)

    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(linha + "\n")
    except Exception as e:
        print(f"Erro ao salvar log: {e}")


def salvar_json(data):
    with open(ARQUIVO, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ─────────────────────────────────────────────────────────────
# FONTE 1 — WORLDCUPJSON.NET
# ─────────────────────────────────────────────────────────────

def carregar_worldcupjson():
    """
    Busca estatísticas via openfootball/worldcupjson
    """

    log("Tentando fonte: worldcupjson/openfootball...")

    url = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json"

    try:

        r = requests.get(url, headers=HEADERS, timeout=20)

        if r.status_code != 200:
            log(f"❌ Erro HTTP {r.status_code} ao acessar {url}")
            return None

        data = r.json()

        matches = data.get("matches", [])

        artilharia = {}
        amarelos = {}
        vermelhos = {}

        for jogo in matches:

            # GOLS TIME 1
            for g in jogo.get("goals1", []):
                nome = g.get("name")

                if nome:
                    artilharia[nome] = artilharia.get(nome, 0) + 1

            # GOLS TIME 2
            for g in jogo.get("goals2", []):
                nome = g.get("name")

                if nome:
                    artilharia[nome] = artilharia.get(nome, 0) + 1

            # EVENTOS
            for e in jogo.get("events", []):

                tipo = str(e.get("type", "")).lower()
                nome = e.get("player")

                if not nome:
                    continue

                if "yellow" in tipo:
                    amarelos[nome] = amarelos.get(nome, 0) + 1

                if "red" in tipo:
                    vermelhos[nome] = vermelhos.get(nome, 0) + 1

        resultado = {
            "fonte": "worldcupjson",
            "ultimaAtualizacao": datetime.now().isoformat(),

            "artilharia": sorted(
                [
                    {
                        "nome": k,
                        "gols": v
                    }
                    for k, v in artilharia.items()
                ],
                key=lambda x: x["gols"],
                reverse=True
            )[:20],

            "cartoesAmarelos": sorted(
                [
                    {
                        "nome": k,
                        "cartoes": v
                    }
                    for k, v in amarelos.items()
                ],
                key=lambda x: x["cartoes"],
                reverse=True
            )[:20],

            "cartoesVermelhos": sorted(
                [
                    {
                        "nome": k,
                        "cartoes": v
                    }
                    for k, v in vermelhos.items()
                ],
                key=lambda x: x["cartoes"],
                reverse=True
            )[:20]
        }

        log("✔ Estatísticas carregadas via worldcupjson")

        return resultado

    except Exception as e:
        log(f"❌ Erro worldcupjson: {e}")
        return None

# ─────────────────────────────────────────────────────────────
# FONTE 2 — PLACAR DE FUTEBOL
# ─────────────────────────────────────────────────────────────

def carregar_placar_futebol():

    log("Tentando fonte: placardefutebol.com.br...")

    url = "https://www.placardefutebol.com.br/copa-do-mundo"

    try:

        r = requests.get(url, headers=HEADERS, timeout=20)

        if r.status_code != 200:
            log(f"❌ Erro HTTP {r.status_code} ao acessar {url}")
            return None

        soup = BeautifulSoup(r.text, "html.parser")

        # Placeholder
        resultado = {
            "fonte": "placardefutebol",
            "ultimaAtualizacao": datetime.now().isoformat(),
            "artilharia": [],
            "cartoesAmarelos": [],
            "cartoesVermelhos": []
        }

        log("✔ Scraping realizado com sucesso")

        return resultado

    except Exception as e:
        log(f"❌ Erro scraping: {e}")
        return None

# ─────────────────────────────────────────────────────────────
# FONTE 3 — FOOTBALL-DATA.ORG
# ─────────────────────────────────────────────────────────────

def carregar_football_data(api_key=None):

    if not api_key:
        return None

    log("Tentando fonte: football-data.org...")

    url = "https://api.football-data.org/v4/competitions/WC/scorers"

    headers = {
        "X-Auth-Token": api_key
    }

    try:

        r = requests.get(url, headers=headers, timeout=20)

        if r.status_code != 200:
            log(f"❌ Erro HTTP {r.status_code} ao acessar {url}")
            return None

        data = r.json()

        artilharia = []

        for item in data.get("scorers", []):

            jogador = item.get("player", {}).get("name")
            gols = item.get("goals", 0)

            if jogador:
                artilharia.append({
                    "nome": jogador,
                    "gols": gols
                })

        resultado = {
            "fonte": "football-data.org",
            "ultimaAtualizacao": datetime.now().isoformat(),
            "artilharia": artilharia,
            "cartoesAmarelos": [],
            "cartoesVermelhos": []
        }

        log("✔ Estatísticas carregadas via football-data")

        return resultado

    except Exception as e:
        log(f"❌ Erro football-data: {e}")
        return None

# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():

    log("════════════════════════════════════════════════════════════")
    log("Iniciando atualização das estatísticas...")

    resultado = None

    # PRIORIDADE 1
    resultado = carregar_worldcupjson()

    # PRIORIDADE 2
    if not resultado:
        resultado = carregar_placar_futebol()

    # PRIORIDADE 3
    if not resultado:
        API_KEY = None
        resultado = carregar_football_data(API_KEY)

    if not resultado:
        log("❌ Nenhuma fonte retornou dados.")
        return

    salvar_json(resultado)

    log(f"✔ Estatísticas salvas em: {ARQUIVO}")
    log("Concluído.")

# ─────────────────────────────────────────────────────────────
# EXECUÇÃO
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    main()