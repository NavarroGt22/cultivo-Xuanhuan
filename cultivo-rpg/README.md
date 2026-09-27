# Xuanhuan RPG

RPG narrativo de cultivo em **TypeScript + Electron**, com escolhas, evolução por reinos, seitas, relações, heranças, combate, comércio e profissões.

## Executar

Na pasta `cultivo-rpg`, com Node.js 18 ou superior:

```bash
npm install
npm start
```

`npm start` compila o projeto e abre a janela do Electron. Os três slots ficam em `save.json`, `save-2.json` e `save-3.json` na pasta de execução, com cópias `.bak`; conserve esses arquivos ao atualizar. O slot 1 abre seu save original. Use **Jornadas salvas** para escolher slots, exportar ou importar JSON.

## A interface

- **Jornada:** evento atual, personagem, próximo objetivo e energia disponível. A história fica centralizada e as escolhas grudam no rodapé da tela enquanto o texto rola; nenhum painel volta ao topo ao clicar.
- **Criação:** botão para aleatorizar tudo (nome, gênero, retrato, traço, atributos), 17 traços e as chances que a Sorte dá no nascimento.
- **Layout centralizado:** largura limitada em monitores grandes, coluna de leitura e adaptação para janelas menores.
- **Campos espirituais:** compra e herança dos lotes; plantio e colheita automáticos (a semente pode ser fixada).
- **Relações:** só laços pessoais (família, noivado, mestre, discípulos, parceiros); a besta companheira fica no Bestiário, rixas e vassalos no Mundo, a hierarquia da seita em Ocupação.
- **Mundo → Seitas Supremas:** reputação com cada uma das 9 Supremas (recrutamento, preços, ataques, acesso à torre e ao torneio, tributo). O **karma** aparece na ficha do Inventário e pesa na Tribulação Celestial.
- **História na criação:** *História do Pequeno Herói* (jogo aberto) ou *Renascimento do Demônio Celestial* (campanha roteirizada; Ato 1, capítulos 1–4).
- **Natureza do Qi:** Yin ou Yang na ficha; técnicas e manuais mostram a compatibilidade (as demoníacas exigem ser demônio).
- **Estações:** calendário do mundo no HUD; a estação favorece um elemento e sorteia um clima espiritual (Maré de Qi, Seca Espiritual).
- **Relações → Companheiros de jornada:** até 2–3 companheiros com papel e lealdade própria (Irmãos de Armas ou traição).
- **Codex** (barra lateral): registro automático de regiões, Supremas, facções, técnicas, bestas, heranças e pessoas.
- **Mundo → Guerra de Clãs:** provocar guerra contra um rival para fazer seu clã ou seita crescer.
- **Mercado → Grandes Grupos Mercadores:** cotas, contratos e desconto por reputação.
- **Rankings:** abas de cultivadores, Seitas, Clãs e Grupos Mercadores, com notícias do mundo das facções.
- **Mestre pessoal:** ancião da seita ou o velho de roupas gastas; um único mestre por vez (formar-se com honra ou romper com desonra).
- **Navegação lateral:** atividades, missões, mundo (torres, torneios, comércio e guerra de clãs), rankings das cinco regiões (pessoas e seitas/clãs), relações (noivado arranjado, mestre, besta companheira), ocupação e facção própria, ofícios disponíveis, mercado, campos e inventário.
- **Bestiário:** todas as espécies de bestas, com linhagem, região, reinos dos adultos e fases de vida.
- **Diário:** escolhas, atividades e marcos com pesquisa, filtros e seletor de geração. Mantém os 300 registros mais recentes da vida atual e os arquiva quando você continua como herdeiro; o passado de saves anteriores não é reconstruído.
- **Guia do cultivador:** fundamentos, 13 reinos e cinco regiões, com pesquisa que ignora acentos.
- **Opções de leitura:** texto ampliado, alto contraste e redução de animações, lembrados no dispositivo.

O jogo salva ao atualizar o estado. Um aviso aparece se não for possível gravar. No menu, iniciar outra vida pede confirmação antes de substituir o save; cancelar a criação conserva a vida anterior.

## Comandos de verificação

```bash
npm run build
npm test
npm run simular -- 5
```

Os testes cobrem o diário (escolhas bloqueadas, cliques duplicados, marcos, limite de registros), slots de save e migração de saves antigos, campos, mestre pessoal, bestas e bestiário, heranças por alinhamento, noivado arranjado, guerra de clãs, rankings por região, traços da vida, método de cultivo e o Despertar da Alma. `npm run simular` roda vidas inteiras com escolhas aleatórias para conferir o balanceamento.

## Estrutura

- `src/main/`: janela do Electron.
- `src/game/`: regras, dados, narrativa, saves e diário.
- `src/renderer/`: navegação, telas e estilos.
- `src/renderer/ui/`: painéis, HUD, guia, preferências e funções de acessibilidade.
- `src/shared/`: formato compartilhado de saves.
- `scripts/`: build, testes e simulação.
- `assets/`: retratos e cenas opcionais.

A análise desta atualização e os limites da verificação estão em `../docs/INTERFACE-JORNADA.md`.

## Ambiente local

O Electron usa `nodeIntegration: true` e `contextIsolation: false` para acessar arquivos locais. Caso o projeto passe a carregar páginas remotas, esse acesso precisará ser isolado com preload e `contextBridge`.
