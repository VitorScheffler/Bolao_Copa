# Bolão Copa do Mundo ⚽

Sistema de palpites da fase de grupos para jogar com os amigos.

---

## Como rodar no seu computador

### Com PHP (recomendado, dados compartilhados em rede)

**Requisito:** PHP instalado. Verifique com:
```
php --version
```

Se não tiver, baixe em: https://www.php.net/downloads  

**Rodando:**

1. Abra o terminal (ou Prompt de Comando) dentro da pasta `bolao/`
2. Execute:
```
php -S 0.0.0.0:8080
```
3. Acesse no seu navegador: http://localhost:8080
4. Seus amigos na mesma rede acessam pelo IP do seu computador:
   - Windows: descubra com `ipconfig` → use o "Endereço IPv4"
   - Mac/Linux: use `ifconfig` ou `ip addr`
   - Exemplo: http://192.168.1.10:8080

Os dados são salvos em `data/bolao.json` automaticamente.

---

## Estrutura do projeto

```
bolao/
├── index.html          → página principal
├── css/
│   └── style.css       → estilos
├── js/
│   ├── data.js         → dados dos grupos e funções de cálculo
│   └── app.js          → lógica da aplicação
├── api/
│   ├── load.php        → carrega dados do servidor
│   └── save.php        → salva dados no servidor
├── data/
│   └── bolao.json      → banco de dados (criado automaticamente)
└── README.md           → este arquivo
```

---

## Funcionalidades

- Cadastro de participantes por nome
- 12 grupos (A–L) com 4 seleções cada
- 6 jogos por grupo (todos contra todos) = 72 jogos no total
- Preenchimento de palpites com placares
- Tabela de classificação em tempo real (Pts, J, V, E, D, GM, GS, SG)
- Critérios de desempate: Pontos → Saldo de gols → Gols marcados
- Aba "Comparar": veja os palpites de todos lado a lado
- Dados salvos no servidor (PHP) ou navegador (localStorage)

---

## Dúvidas comuns

**Os dados somem ao recarregar?**  
Você está abrindo sem servidor PHP. Use `php -S 0.0.0.0:8080`.

**Meus amigos não conseguem acessar pela rede?**  
Verifique se o firewall do Windows está bloqueando a porta 8080.  
Tente liberar ou usar outra porta: `php -S 0.0.0.0:3000`
