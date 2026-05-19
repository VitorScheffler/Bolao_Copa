# Bolão Copa do Mundo 2026 ⚽

Sistema de palpites para a fase de grupos e chaveamento da Copa do Mundo 2026.

---

## Como rodar

### Requisito: PHP instalado
```
php --version
```
Se não tiver: https://www.php.net/downloads

### Iniciando o servidor
```bash
cd bolao/
php -S 0.0.0.0:8080
```

Acesse em: **http://localhost:8080**

Amigos na mesma rede acessam pelo seu IP:
- Windows: `ipconfig` → "Endereço IPv4"
- Mac/Linux: `ifconfig` ou `ip addr`
- Exemplo: `http://192.168.1.10:8080`

---

## Estrutura do projeto

```
bolao/
├── index.html              → página principal
│
├── css/
│   └── style.css           → estilos (único arquivo, sem duplicatas)
│
├── js/
│   ├── data.js             → dados estáticos (GROUPS, FLAGS, CHAVEAMENTO_TEMPLATE)
│   ├── calc.js             → cálculos puros (standings, bracket, winners)
│   ├── state.js            → estado global (currentUser, allUsers, bracketState)
│   ├── utils.js            → utilitários (escHtml, toast, tema, navegação)
│   ├── api.js              → comunicação com servidor PHP (load/save)
│   ├── auth.js             → login, logout, modal de contagem
│   └── views/
│       ├── groups.js       → view "Minha Classificação"
│       ├── compare.js      → view "Comparar"
│       ├── official.js     → view "Classificação Oficial"
│       └── bracket.js      → view "Chaveamento" (layout + propagação)
│
├── api/
│   ├── load.php            → lê data/bolao.json
│   └── save.php            → salva dados do usuário (com file lock)
│
├── data/
│   └── bolao.json          → banco de dados (criado automaticamente)
│
└── README.md
```

### Ordem de carregamento dos scripts
```
data.js → calc.js → state.js → utils.js → api.js → auth.js
→ views/groups.js → views/compare.js → views/official.js → views/bracket.js
→ app.js
```

Cada camada depende apenas das anteriores. Nenhuma dependência circular.

---

## Funcionalidades

- Cadastro de participantes por nome
- 12 grupos (A–L) com 4 seleções cada
- 6 jogos por grupo = 72 jogos no total
- Tabela de classificação em tempo real (Pts, J, V, E, D, GM, GS, SG)
- Critérios de desempate: Pontos → Saldo → Gols marcados
- **Chaveamento** com 5 fases: 16 Avos → Oitavas → Quartas → Semis → Final
  - Propagação automática de vencedores entre fases
  - Layout bilateral (esquerdo/direito) com troféu no centro
  - Conectores SVG entre colunas
- Aba **Comparar**: classificação de todos os participantes lado a lado
- **Classificação Oficial** editável pelo admin (senha: COPA2026)
- Dados salvos no servidor (PHP) com fallback em localStorage
- Modo escuro / claro

---

## Acesso admin (usuário OFICIAL)

O usuário **OFICIAL** tem poderes especiais:
- Editar os resultados reais na aba "Classificação Oficial"
- Editar o chaveamento (inclusive definir os 3ºs classificados)
- Senha: `COPA2026` (altere em `js/auth.js`, variável `ADMIN_PASSWORD`)

---

## Dúvidas comuns

**Os dados somem ao recarregar?**
Você está abrindo o `index.html` diretamente no browser sem servidor.
Use `php -S 0.0.0.0:8080`.

**Amigos não conseguem acessar pela rede?**
Verifique se o firewall está bloqueando a porta 8080.
Tente: `php -S 0.0.0.0:3000`
