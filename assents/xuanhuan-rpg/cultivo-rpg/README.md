# Xuanhuan RPG — Protótipo

Esqueleto inicial de um RPG de texto/narrativo em **TypeScript + Node.js + Electron**: escolhas de texto, atributos, testes de dado, classes, equipamentos, alinhamento e múltiplos finais.

## Requisitos

- Node.js 18 ou superior instalado

## Como rodar

```bash
npm install
npm start
```

`npm start` compila o TypeScript e abre a janela do Electron.

## Estrutura

```
src/
  main/        processo principal do Electron (abre a janela do jogo)
  renderer/    interface — HTML/CSS/TS puro, sem framework por enquanto
  game/        toda a lógica de sistemas:
                 attributes.ts   → Força, Destreza, Inteligência etc.
                 dice.ts         → testes de atributo (d20 + atributo vs. dificuldade)
                 classes.ts      → classes de personagem
                 equipment.ts    → itens equipáveis e seus bônus
                 alignment.ts    → eixo de alinhamento (-100 a 100)
                 inventory.ts    → itens carregados
                 character.ts    → junta tudo isso num personagem
                 story.ts        → nós de história, escolhas, testes e finais
                 saveLoad.ts     → salva/carrega o progresso em save.json
  shared/      tipos usados em mais de um lugar (ex: formato do save)
assets/        ilustrações referenciadas pelos nós da história
```

## Próximos passos sugeridos

1. **Trocar o conteúdo de exemplo em `src/game/story.ts`** pelo conteúdo real do seu GDD — reinos de cultivo, seitas supremas, mundos perdidos, raças não-humanas etc.
2. **Adicionar mais classes/equipamentos** em `classes.ts` e `equipment.ts` conforme os sistemas do GDD (alquimista, inscricionista, domador de bestas...).
3. Se a narrativa crescer muito e ficar difícil de gerenciar como objeto TypeScript, considere migrar para **Ink** (`inkjs`) — uma linguagem feita pra roteiro ramificado, que separa a escrita da história do código do jogo.
4. Se quiser uma interface visual mais rica (animações, transições), dá pra adicionar **React + Vite** por cima do que já existe, sem precisar reescrever a lógica de `src/game/`.

## Nota de segurança

Este protótipo usa `nodeIntegration: true` e `contextIsolation: false` no Electron para simplificar o acesso a arquivos (save/load) sem precisar configurar um preload script com `contextBridge`. Isso é aceitável para um jogo local, single-player, que não carrega nenhum conteúdo remoto. Se algum dia o jogo passar a carregar conteúdo de fora (ex: mods baixados, um site), troque para o padrão mais seguro com preload script antes disso.
