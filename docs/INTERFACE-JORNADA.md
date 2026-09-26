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

1. Múltiplos slots e exportação/importação de saves, com escrita atômica e recuperação de backup.
2. Mestres pessoais e relações Shifu-discípulo, aproveitando seitas e relações já existentes.
3. Campos espirituais com plantio e colheita, integrados às ervas, ao patrimônio e à alquimia.
4. Separar a navegação do renderer principal e reduzir estilos antigos sobrepostos conforme os painéis forem evoluindo.
5. Arquivo de linhagem para consultar as crônicas das gerações anteriores.
