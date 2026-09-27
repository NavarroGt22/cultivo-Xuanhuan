# Interface e jornada — análise e atualização

## Base analisada

Repositório `NavarroGt22/cultivo-Xuanhuan`, a partir do commit `29cb239`.
Aplicação principal: `cultivo-rpg/`. A pasta `assents/xuanhuan-rpg/` contém uma segunda cópia e não foi alterada.
Foram consultados o GDD, o sistema de vida e o progresso da implementação anexados; dois dos quatro anexos têm o mesmo conteúdo de progresso.

## Diagnóstico

- A lógica de jogo está separada em módulos e já inclui cultivo, seitas, ofícios, comércio, heranças e relações. Aproveitar esses sistemas traz mais valor imediato do que reescrever o projeto em outro framework.
- A navegação ficava concentrada em onze botões na parte inferior; era difícil identificar os próximos passos e acompanhar a campanha.
- A narrativa, os recursos e as ações tinham pouca diferenciação visual. O layout fixo também dificultava janelas menores.
- O jogador não tinha uma linha do tempo consultável nem um guia integrado das regras existentes.
- O README descrevia um estágio anterior do jogo. Não havia um comando `npm test`.

## Implementado

1. Identidade visual em jade e dourado, tipografia de leitura, ícones SVG e paisagem em CSS, sem downloads de fontes ou imagens durante o jogo.
2. Menu inicial com resumo da vida salva e confirmação antes de substituir o save ao criar outra vida.
3. Navegação lateral por grupos; adaptações para telas estreitas.
4. Painel de próximo objetivo com recompensa, energia disponível e orientação contextual; acesso direto aos painéis existentes.
5. Diário pesquisável com filtros de história, marcos e atividades. Registra escolhas de eventos, atividades, mudanças de estágio, cidade, afiliação, quantidade de técnicas e objetivos resgatados.
6. Guia consultável com fundamentos, os 13 reinos e as cinco regiões. Reinos e regiões vêm dos módulos do jogo, evitando duplicar seus dados.
7. Preferências locais de fonte ampliada, alto contraste e redução de movimento.
8. Modais com nome acessível, Esc, ciclo de Tab e retorno de foco. A tela atrás do modal fica inativa.
9. Salvamento com feedback não bloqueante e aviso quando a gravação falha.
10. Cinco testes de regressão do diário e compatibilidade de saves, executáveis por `npm test`.

## Compatibilidade e limites

- A versão do save permanece 12: os novos campos são opcionais e compatíveis com saves existentes. A gravação continua usando `save.json` na pasta de execução.
- O diário começa no momento da atualização, mantém os 300 registros mais recentes e acompanha a vida atual. Não reconstrói o passado nem mantém um arquivo de diários dos ancestrais.
- O guia descreve as mecânicas atuais; não implementa os sistemas ainda pendentes no GDD.
- A simulação, a criação, o combate e os painéis existentes continuam usando as mesmas regras de jogo.
- Não foi incluída música, geração de retratos, novos slots de save ou uma nova mecânica de cultivo nesta atualização.

## Verificação realizada

- `npm test`: compilação TypeScript e cinco testes aprovados.
- `node scripts/simular.js 5`: cinco vidas simuladas, execução concluída sem erro.
- Renderer compilado executado em Chromium com Playwright: criação de personagem, distribuição de atributos, escolhas de história, diário e filtros, busca sem acentos, 13 reinos, preferências e persistência após recarregar, oito painéis existentes, retorno de foco, sucesso e falha de salvamento.
- Layout conferido em 1440, 1100, 760 e 390 pixels; nenhuma rolagem horizontal de página nas larguras verificadas.
- O teste gráfico usou um adaptador temporário de `fs`/`path` com save em memória persistida pelo navegador. O Electron nativo não pôde ser validado neste ambiente por limitações de sockets/processos gráficos. A gravação real em disco e a janela nativa devem ser conferidas no computador do usuário com `npm start`.
- `git diff --check`: sem erros de whitespace.

## Próximas entregas sugeridas

> Atualização de 26/09/2026: itens 1, 2, 3 e 5 abaixo foram entregues na expansão descrita ao final. O item 4 continua pendente.

1. Múltiplos slots e exportação/importação de saves, com escrita atômica e recuperação de backup.
2. Mestres pessoais e relações Shifu-discípulo, aproveitando seitas e relações já existentes.
3. Campos espirituais com plantio e colheita, integrados às ervas, ao patrimônio e à alquimia.
4. Separar a navegação do renderer principal e reduzir estilos antigos sobrepostos conforme os painéis forem evoluindo.
5. Arquivo de linhagem para consultar as crônicas das gerações anteriores.

## Expansão de 26/09/2026 — centralização e continuidade

- Interface centralizada em uma estrutura de até 1560 px, com conteúdo de até 1180 px e coluna de leitura limitada. Mantidos o tema jade/dourado, os menus e as preferências existentes.
- **Jornadas salvas:** três slots (`save.json`, `save-2.json`, `save-3.json`), acessíveis no menu e na navegação. Exportação JSON, importação validada e confirmação de substituição. A importação abre a vida importada para impedir que o estado antigo a sobrescreva no próximo autosave.
- Gravação em `.tmp` seguida de renomeação; a versão anterior válida fica em `.bak`. Se o principal estiver ilegível, o backup é carregado. Uma nova gravação preserva o backup válido mesmo quando o principal está corrompido.
- **Mestre pessoal:** em Relações, a partir de 12 anos, um discípulo pode escolher um ancião de reino superior por 50 de contribuição. Uma orientação por capítulo custa 1 energia, rende 6–10 pontos de cultivo, reduz 2 de toxina e aumenta o vínculo. O vínculo fica inativo se o jogador deixa a seita, supera o mestre ou o ancião deixa o elenco. Pode ser encerrado explicitamente. O mestre errante da narrativa continua independente.
- **Campos espirituais:** até três lotes, custando 150/300/450 pedras, compráveis aos 12 anos. Os campos são automáticos: a colheita vai para a bolsa e o campo replanta sozinho (semente fixada ou a melhor permitida pelo reino, sem gastar mais da metade das pedras); plantar não custa energia. Ervas básicas amadurecem em 6 meses; ervas de 500/1000 anos usam formações aceleradas de 24/48 meses e exigem reinos 3/5. A colheita vai para os itens existentes de alquimia, sem duplicação por cliques repetidos. Não há manutenção adicional. Campos e plantações passam ao herdeiro.
- **Arquivo da linhagem:** cada transição para um herdeiro preserva o resumo e os até 300 registros disponíveis do antepassado. O seletor Vida consultada no Diário permite pesquisar e filtrar cada geração. Não reconstrói vidas encerradas antes desta atualização.
- Novos campos opcionais mantêm compatibilidade com saves versão 12. O save do jogador não foi utilizado nos testes.

### Validação desta expansão

- `npm test`: 11 testes aprovados, incluindo isolamento dos slots, restauração do backup, importação inválida, plantio/colheita, avanço de tempo, mestre e herança.
- `node scripts/simular.js 5`: cinco vidas concluídas sem erro.
- `scripts/testar-layout.cjs`, com Playwright e Edge: renderer real compilado com adaptador de arquivos em memória; layouts de 390, 760, 1100, 1440 e 1920 px sem transbordamento horizontal; margens simétricas em 1920 px. Conferidos campos, mestre, diário ancestral, slots, fonte ampliada e fechamento por Esc. Capturas inspecionadas visualmente.
- O ensaio nativo `scripts/testar-interface.cjs` não abriu: o processo Electron encerrou com código 1 antes de executar o teste, sem diagnóstico. A janela Electron nativa permanece não verificada neste ambiente; o teste de navegador não substitui essa verificação.

### Ainda pendente

Esta entrega cobre os quatro recursos priorizados e a centralização, não todas as dezenas de ideias do GDD. Continuam pendentes a separação completa da navegação, áudio/retratos, demais ocupações, mundos perdidos completos, guerras entre facções, técnicas elementais e outros itens não marcados em `progresso.md`.

> Atualização posterior: as guerras entre facções foram entregues (Mundo → Guerra de Clãs). Veja a seção seguinte.

## Ajustes de leitura e navegação (26/09/2026)

- **Rolagem:** todo modal guarda a rolagem do painel e o foco no mesmo botão quando se redesenha (em `criarOverlay`, `ui/dom.ts`), então nenhum clique em painel volta ao topo. A criação de personagem usa `redesenharMantendoPosicao` para a página e a janela de atributos.
- **História no centro:** a cada escolha, `centralizarHistoria` (`renderer.ts`) centraliza o evento na área central ou, se ele for mais alto que a tela, alinha o começo do texto no topo. As escolhas ficam num bloco `position: sticky` no rodapé (até 42% da altura), sempre visíveis enquanto o texto rola; para isso o painel da narrativa usa `overflow: clip` em vez de `hidden`. Banner e barra do topo ficaram mais baixos.
- **Criação:** botão "Aleatorizar tudo" e traço aleatório; a caixa "O Destino decide o resto" mostra as chances de raiz de grau 4+/6+ e de nascer em clã ou seita para a Sorte escolhida (estimadas por sorteio e guardadas por valor de Sorte).
- **Novos painéis e abas:** Bestiário (barra lateral, junto do Guia); Rankings com as cinco regiões e a aba Seitas e Clãs; Mundo → Guerra de Clãs; cartão do noivado e do mestre em Relações; traços da vida, feitos, método de cultivo e alma desperta na ficha do Inventário.
- **Verificação:** renderer compilado aberto num navegador com adaptador de arquivos em memória: rolagem da janela de atributos (mantida em 219 px após um clique), posição do evento após escolhas, escolhas visíveis numa tela de ~420 px de altura, rolagem mantida ao abrir uma pasta em Atividades e o aleatorizador. A janela nativa do Electron não foi aberta neste ambiente.
