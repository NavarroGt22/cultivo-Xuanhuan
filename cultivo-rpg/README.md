# Xuanhuan RPG

RPG narrativo de cultivo em **TypeScript + Electron**, com escolhas, evolução por reinos, seitas, relações, heranças, combate, comércio e profissões.

## Executar

Na pasta `cultivo-rpg`, com Node.js 18 ou superior:

```bash
npm install
npm start
```

`npm start` compila o projeto e abre a janela do Electron. O save fica em `save.json` na pasta de execução; conserve esse arquivo ao atualizar o código.

## A interface

- **Jornada:** evento atual, personagem, próximo objetivo e energia disponível.
- **Navegação lateral:** atividades, missões, mundo, rankings, relações, ocupação, ofícios disponíveis, mercado e inventário.
- **Diário:** escolhas, atividades e marcos, com pesquisa e filtros. Mantém os 300 registros mais recentes da vida atual; em saves anteriores, começa a partir desta atualização.
- **Guia do cultivador:** fundamentos, 13 reinos e cinco regiões, com pesquisa que ignora acentos.
- **Opções de leitura:** texto ampliado, alto contraste e redução de animações, lembrados no dispositivo.

O jogo salva ao atualizar o estado. Um aviso aparece se não for possível gravar. No menu, iniciar outra vida pede confirmação antes de substituir o save; cancelar a criação conserva a vida anterior.

## Comandos de verificação

```bash
npm run build
npm test
npm run simular -- 5
```

Os testes cobrem a compatibilidade do diário, escolhas bloqueadas, cliques duplicados, marcos e limite de registros.

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
