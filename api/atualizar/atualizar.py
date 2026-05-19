# atualizar.py
# -*- coding: utf-8 -*-

import subprocess
import sys
from datetime import datetime, UTC
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent


def log(msg):
    agora = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{agora}] {msg}")


def executar(script):

    caminho = BASE_DIR / script

    log(f"▶ Executando: {caminho.name}")

    try:

        resultado = subprocess.run(
            [sys.executable, str(caminho)],
            check=True
        )

        if resultado.returncode == 0:
            log(f"✔ Finalizado: {caminho.name}")

    except subprocess.CalledProcessError as e:
        log(f"❌ Erro ao executar {caminho.name}")
        log(str(e))


def main():

    log("════════════════════════════════════════════════════════════")
    log("INICIANDO ATUALIZAÇÃO COMPLETA")
    log("════════════════════════════════════════════════════════════")

    executar("atualizar_resultados.py")

    print()

    executar("atualizar_estatisticas.py")

    print()

    log("════════════════════════════════════════════════════════════")
    log("ATUALIZAÇÃO CONCLUÍDA")
    log("════════════════════════════════════════════════════════════")


if __name__ == "__main__":
    main()