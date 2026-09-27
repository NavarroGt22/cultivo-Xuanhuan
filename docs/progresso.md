# Progresso da Implementação — Xuanhuan RPG

Status do que já está no jogo (`cultivo-rpg/`) em relação ao `GDD.md`, ao `ocupacoes.md` e ao `Sistema-de-vida.md`.

Legenda: **[x]** feito · **[~]** parcial · **[ ]** não feito

---

## Base técnica

- [x] Electron + TypeScript, interface em HTML/CSS/TS puro
- [x] Save/load em `save.json` com versão
- [x] Salvamento automático a cada escolha + botão **Continuar** no menu
- [x] Simulador de vidas para testar equilíbrio (`npm run simular -- 30`)
- [x] **Migração de saves antigos**: saves de versões anteriores são atualizados automaticamente (campos novos recebem valores padrão) em vez de descartados
- [x] Três slots de save, exportação/importação JSON, escrita por temporário e recuperação de backup
- [x] Opções de leitura: fonte ampliada, alto contraste e redução de movimento (não inclui áudio)
- [x] Suporte a **retratos e ilustrações** (opcionais): retrato do protagonista escolhido na criação, caixa de diálogo com retrato de quem fala, ilustração por evento (`assets/cenas/<evento>.png`) — ver `assets/LEIA-ME.txt`
- [ ] Criar/gerar as imagens em si (a pasta `assets/` ainda não tem nenhuma)
- [ ] Som e música

## Criação de personagem

- [x] Nome (com gerador), gênero, traço (17 traços: Olhos de Falcão, Alma Antiga, Brutamontes, Gênio de Corpo Frágil, Sangue de Mercador, Compassivo, Vingativo, Nascido na Tempestade e os 9 originais)
- [x] Botão **Aleatorizar tudo** (nome, gênero, retrato, traço e atributos) e traço aleatório; chances de nascimento para a Sorte escolhida (raiz grau 4+/6+, nascer em clã ou seita)
- [x] **Método de cultivo**: família comum e órfãos não têm cultivo passivo e meditam a 20% até conseguirem um método (seita/clã, mestre, manual de Método de Cultivo — vendido em Educação e Lazer —, facção própria ou memórias de vida passada); aviso no painel da jornada e na ficha
- [x] **Autodidatas**: Inteligência 10 → Alquimia; Inteligência 12 → Inscrição; Espírito 10 → Divinação, sem mestre (atividades com teste)
- [x] **Despertar da Alma** (traços Alma Antiga e Herança Escondida): entre 16 e 100 anos, quase sempre após uma quase-morte (~60% das vidas), desperta uma identidade antiga — Deus da Alquimia e das Pílulas, Soberano do Céu e da Terra, Demônio Supremo, Santo da Espada, Senhor das Mil Bestas, Grão-Mestre dos Talismãs ou Oráculo do Destino — com recompensas próprias, e a raiz é rolada de novo (mínimo grau 3, nunca piora); dá para conter as memórias e ficar só com a raiz
- [x] **Traços da vida**: surgem pelos feitos ou ao acaso, cada um com vantagem e desvantagem (ficha do Inventário e Diário)
  - Feitos contados: pessoas mortas, bestas abatidas, boas ações e crueldades (escolhas que mexem no alinhamento), vitórias, derrotas, quase-mortes, pílulas refinadas
  - Pelos feitos: Mãos Manchadas de Sangue (30 mortes), **Psicopata** (100 mortes com mais crueldade que bondade), Coração de Pedra, **Coração Bondoso**, **Santo Vivo**, Caçador de Feras, Veterano de Mil Batalhas, Sobrevivente, Espírito Quebrado, Nariz de Alquimista
  - Ao acaso (até 3 por vida): Insônia, Olhar de Águia, Tocado pela Sorte, Azarado, Memória Fotográfica, Carismático, Temperamento Explosivo, Saúde Frágil, Intuição Espiritual
  - Efeitos: atributos, cultivo passivo, relações, chance de emboscadas e de vingadores, dificuldade para domar bestas, alinhamento que escorre com o tempo (Psicopata)
- [x] Distribuição de atributos com limite (14 pontos, cada atributo de 3 a 15, sem sobras)
- [x] Explicação de como cada atributo influencia o jogo
- [x] Nascimento sorteado fora da criação (região, família/clã/seita, ramo, raiz, corpo especial), com a Sorte melhorando as chances
- [x] **Rolagem de Herança no nascimento** (Ouro Negro/Lendário: pingente selado ou Constituição Especial)
- [x] Estilo marcial removido da criação — o primeiro estilo vem da escolha de infância

## Histórias (`GDD_Historias_Xuanhuan.docx`)

- [x] Opção **História** na criação: **História do Pequeno Herói** (o jogo aberto de sempre) ou **Renascimento do Demônio Celestial** (HIS-001, campanha roteirizada)
- [x] Motor narrativo (`src/game/narrative.ts`): capítulos, cenas, escolhas com o id do GDD, variáveis (Humanidade, Fúria, Vontade, Verdade, Reputação, Vínculo com Mo, Dívida Demoníaca e as do Ato 1) e flags; cada escolha registrada com cena e idade; requisitos mostrados com o motivo ("Exige Pulso da Vida…"); cenas do mesmo dia não passam estação nem renovam energia; eventos aleatórios suspensos durante a campanha
- [x] HIS-001 começa aos 8 anos na Aldeia do Campo Sereno (Leste), família camponesa, **Raiz do Vazio** lida como raiz inútil, sem pedras
- [x] **Ato 1 — Cinzas da vida mortal** (`src/game/his001.ts`): Capítulo 1 *A Criança de Raiz Inútil* · Capítulo 2 *Quatro Colheitas* (8→12 anos) · Capítulo 3 *Mantos Brancos sobre o Campo* (as quatro rotas: Resistência, Evacuação, Evidência e Família) · Capítulo 4 *O Único Sobrevivente* (sete dias com Fome, Frio, Ferimento e Rastro)
- [x] Painel da jornada mostra o capítulo e o que o personagem carrega (Memória Nítida, competência, Âncora Familiar, objeto da família, promessa, provas); os números ficam ocultos, como pede o GDD
- [x] Ao fim do que está escrito, a campanha **pausa** num aviso; quando novos capítulos entrarem, o save continua sozinho de onde parou
- [ ] Capítulos 5 a 24 (Mo Wutian, provações da herança, Nascente Cinzenta, Aurora, fragmentos, Guerra dos Nove Céus), organização, nove finais e epílogos; HIS-002

## Qi, Técnicas e Pílulas (`GDD_Qi_Tecnicas_Pilulas_Xuanhuan.docx`)

- [x] **Fase 1 — Perfil de Qi** (`src/game/qiNature.ts`): natureza **Yin** ou **Yang** sorteada no nascimento (corpo feminino 70% Yin, masculino 30%; parâmetros configuráveis; RNG injetável); Qi Demoníaco nunca é sorteado para humanos; Chakra/Star continuam o recurso (a natureza é o tipo de energia)
- [x] As 25 técnicas classificadas pela tabela de migração (Universal, Yin, Yang, Demoníaca Yin/Yang) sem mudar números de combate; o Sangue Fervente é Yang proibida humana, não demoníaca
- [x] Ficha e manuais mostram a compatibilidade na linguagem do GDD (Seguro, Adaptável, Perigoso, Demoníaco, Desconhecido); humanos leem manuais demoníacos mas não completam a circulação ("Somente demônios podem completar este ciclo") e o manual não é gasto
- [x] Saves antigos ficam com a natureza **pendente** (sem sorteio silencioso): a ficha oferece Yin, Yang ou "deixar o corpo decidir"; migração idempotente
- [ ] Fases 2–8: execução e adaptação de técnicas opostas, circulação (capacidade, vazão, pureza, controle, estabilidade), pílulas por natureza (tolerância e conflitos), demonização (estados, fome, âncora), novos catálogos, facções e missões

## Interface

- [x] A história fica no centro: a cada escolha a tela centraliza o evento (ou alinha o começo do texto, se ele for maior que a tela), e as **escolhas grudam no rodapé** enquanto o texto rola; banner e barra do topo mais baixos
- [x] Nenhum painel volta ao topo ao clicar: todos os modais guardam a rolagem e o foco quando se redesenham
- [x] Resultados de lutas e testes (Atividades, Missões, Mundo, Relações) abrem numa janela própria por cima do painel; mensagens curtas (compras, conversas, refino, ocupação, campos) aparecem num aviso flutuante pequeno no canto superior direito — o painel de baixo não se mexe
- [x] Confirmações dentro do jogo no lugar do `confirm()` nativo (romper com o mestre, nova vida, substituir slot)
- [x] "Terminar / romper": com parceiro(a) vira Ex; com amigos, conhecidos e ex corta os laços (a pessoa sai de Relações)
- [x] HUD: nome, idade/expectativa de vida, reino e estágio, afiliação, local, ocupação, influência da família e pessoal
- [x] HUD: barras de vida e progresso de cultivo, barra de alinhamento (Demoníaco ↔ Ortodoxo), pedras espirituais, atributos
- [x] Painéis: Atividades, Missões, **Mundo** (Torre, Torneio, Comércio), Rankings, Relações, Seita e Ocupação, Ofícios, Inventário
- [x] Atividades e Ocupação organizadas em **pastas**
- [x] **Lutas reproduzidas devagar**: arena com barras de vida (sua, do inimigo, da besta), escudo e sincronia animadas, ação por ação, com velocidade 1×/2×/4× (lembrada entre sessões) e botão "Pular luta"
- [x] Registro completo da luta disponível depois (recolhido)
- [x] Tela de fim de vida com linhagem e escolha de herdeiro
- [x] Diário pesquisável e crônicas das gerações anteriores, arquivadas ao continuar como herdeiro
- [x] Layout centralizado com largura máxima e painéis responsivos

---

## GDD

### 1. Reinos de Cultivo
- [x] 13 ranks com estágios e expectativa de vida
- [x] Transição Chakra → Star no Rank 2
- [x] Tribulação Celestial a cada rank (pode adiar; falha fere; 1 natural mata)
- [x] Progresso mais lento a cada rank (×1,7 por rank); nos reinos altos o talento pesa mais: cada grau de raiz acima do 3º dá +4% de cultivo por reino acima do 1º (raiz 5 no 5º reino: +32%)
- [x] Poder de combate multiplicado pelo reino
- [~] Desvio de qi: no cultivo intensivo e ao repetir cultivo demais na estação; ainda não é um estado persistente
- [ ] Compressão de rank (vencer quem está acima) como mecânica explícita

### 2. Famílias e Clãs
- [x] Tipos de origem (órfão, família comum, clã menor/médio/grande, super clã, clã ancestral, seita local, Seita Suprema)
- [x] Ramo principal × colateral (recursos, estipêndio, texto)
- [x] Raiz espiritual independente da família (o sorteio não olha a origem)
- [x] Casamento de aliança e intrigas de clã
- [x] Influência da família (rua → distrito → cidade → região → reino → continental) e influência pessoal
- [x] Famílias de Domadores de Bestas (ver seção 12)
- [~] Influência afeta recrutamento de seitas e recursos de anciões; ainda não afeta preços nem reação de NPCs
- [ ] Anciões, Anciões Venerandos (sangue × forasteiros contratados, que podem trair), Patriarca em Reclusão
- [ ] Clãs de alquimistas / inscricionistas como arquétipos de família
- [ ] Super clãs tentando recrutar/raptar gênios de famílias fracas

### 3. Artes Marciais
- [x] **Estilos marciais aprendidos ao longo da vida**, com maestria própria (Iniciante → Grão-Mestre): Punho, Espada, Sombra Veloz, Leque, Lança
- [x] Arte da seita (cada seita ensina um estilo)
- [x] **Técnicas com Grau** (Amarelo → Divino) e nível (Baixo/Médio/Alto), uma por categoria + 3 de herança
- [x] **Grau Divino**: Sutra e Punho do Imperador Estelar (só por herança)
- [x] Chakra gasto em combate; Compreensão (INT) decide o aprendizado
- [x] Estudo de manuais: cada tentativa que falha deixa a próxima 2 pontos mais fácil; manuais de herança têm −10 de dificuldade (o eco do dono guia); a chance aparece no próprio manual; cópias repetidas são vendidas a um sebo
- [x] Acesso por afiliação (pavilhões, bibliotecas de clã, sebos), mercadores, ruínas, Pavilhão de Contribuição
- [ ] Mais técnicas por categoria; técnicas elementais; técnicas incompletas (fragmentos)
- [ ] Criar/fundir técnicas próprias com Compreensão alta (Six Zodiac+)
- [ ] Inimigos com técnicas próprias

### 4. Alquimia e Pílulas
- [x] Profissão com os 11 títulos do GDD, limitada pelo rank
- [x] **Pílulas da 1ª à 10ª Ordem** (18 no total): Fundação Firme, Mil Pássaros, Cura Maior, Rompe-Barreira, Explosão de Origem, Purificação Celestial, Osso de Jade, Alma Cristalina, Renascimento de Órgãos, Medula Celestial, Primavera Eterna (rejuvenesce), Transformação da Raiz (+1 grau de raiz), Imperial da Troca de Ossos Celestiais (rompe um reino) e a **Pílula Divina**
- [x] Toxina de pílula (reduz o cultivo; cai mais rápido em ranks altos)
- [x] **Pureza (anéis do núcleo)**: Bronze (1 anel) → Lendário (5 anéis); multiplica o efeito (×1 a ×3), reduz a toxina (−15% por grau) e o preço de venda
- [x] Dificuldade dispara a cada Ordem; pílulas de 9ª e 10ª Ordem rendem fama histórica
- [x] Emprego na Guilda de Alquimistas; aba de Ofícios para refinar e vender
- [x] Ervas por idade (100/500/1000 anos) como ingredientes das Ordens altas (compra no Mercado)
- [x] Campos espirituais: compra de até três lotes, plantio, maturação por meses, colheita para alquimia e herança
- [x] **Ordem mínima da fornalha**: fornalhas da 3ª à 10ª Ordem no Mercado (a básica é de 2ª)
- [x] Leilões com pílulas de Ordem alta e pureza sorteada
- [ ] Leilões como evento social/político (rivais disputando lances)
- [x] **Torneio de Alquimia** (painel **Mundo**): a cada 6 estações, 3 rodadas de refino contra alquimistas do ranking (Inteligência + nível × 3 + d20); prêmios, experiência e títulos de campeão

### 5. Artefatos
- [x] Equipamentos de 1º e 2º grau com bônus de atributo, 4 espaços; venda de artefatos
- [x] Novas armas e armaduras de 3º e 4º grau (Lança do Trovão, Cajado da Lua, Adagas da Sombra, Armadura de Escamas de Dragão, Anel do Sol, Espada do Sábio)
- [x] Peças de 4º e 5º grau no Pavilhão de Tesouros do Mercado (Machado Parte-Montanhas, Arco da Pena de Fênix, Manto das Mil Estrelas, Coroa de Jade Imperial, Lâmina dos Nove Dragões, Armadura do Kirin Celestial), vendidas só a quem tem reputação
- [ ] Graus altos (5º–9º, Meio Divino, Divino…)
- [x] **Mestre Refinador (forja)** como profissão (Aprendiz de Forja → Refinador Celestial), ensinada pelo Mestre Ferreiro (evento) ou pela Herança da Forja Celestial
  - Aba **Forja** em Ofícios: 11 receitas (armas, armaduras, acessórios) com materiais das Rotas Comerciais e núcleos de besta; 1 de energia
  - Teste: média de Força e Inteligência + 2 por nível contra a dificuldade; a sobra define a **qualidade** Bronze ×1 → Prata ×1,2 → Ouro ×1,5 → Ouro Negro ×2 → Lendário ×3 (multiplica os bônus e o preço de venda)
- [ ] Impressão de alma, artefatos com consciência

### 6. Mundos Perdidos
- [~] Evento "Ruína da Era Dourada" e Túmulo Ancestral
- [ ] Selo temporal, prova de qualificação, tempo distorcido, colapso, disputa entre seitas

### 7. Talismãs e Inscrições
- [x] Profissão com os 7 títulos do GDD, limitada pelo rank
- [x] Talismãs de Combate e de Escudo usados automaticamente na próxima luta
- [x] Emprego no Pavilhão de Inscrições; aba de Ofícios para gravar e vender
- [~] Qualidade Bronze → Prata → Ouro na gravação (falta Ouro Negro e Lendário)
- [ ] Encantar equipamentos, arrays/formações, selamentos de alma

### 8. Raízes Espirituais
- [x] Grau 1–9 com as frequências do GDD (deslocadas pela Sorte)
- [x] Tipos: Atributo Único, Múltiplos, Mista Caótica, Sem Atributo; elementos básicos e superiores
- [x] 6 Corpos Especiais com sinal no nascimento (incluindo **Corpo de Dragão Ancestral**)
- [x] Despertar tardio (mais provável depois de quase morrer)
- [x] **Ciclo elemental Wu Xing no combate**: Fogo > Metal > Madeira > Terra > Água > Fogo. Quem domina causa +25% de dano; quem é dominado, −20%. Seu elemento vem da raiz; inimigos e NPCs têm elemento fixo. Aparece antes da luta ("seu Água domina o Fogo dele!") e no registro
- [ ] Elementos superiores (Raio, Vento, Luz, Trevas, Espaço, Tempo) com regras próprias; técnicas elementais

### 9. O Mundo
- [x] 5 regiões com força diferente (escalam inimigos, recompensas e salários); viagem entre regiões
- [x] 9 Seitas Supremas (nomes propostos), recrutamento "sem direito a recusa"
- [~] Torneio do Dragão Duplo só como boato
- [x] Ranking de seitas e clãs por região (Seitas Supremas incluídas), com líder, membros e poder
- [ ] Torneio do Dragão Duplo jogável
- [~] Tributação: só a facção fundada paga tributo anual às Supremas (ver 15.1)
- [ ] Rixas históricas entre regiões

### 10. Bestas e Raças
- [x] Bestas espirituais da fauna regional, com faixa e cultivo visíveis; núcleos de besta
- [x] Besta companheira com cultivo próprio, vínculo, idade e evolução de faixa (Espiritual → Demoníaca → Divina → Ancestral)
- [x] **Domador de Bestas** como profissão (Aprendiz → Mestre das Mil Bestas); domar e trocar de companheira
- [x] **Bestiário** (barra lateral): 28 espécies em 5 linhagens (Comum, Espiritual, Demoníaca, Divina, Ancestral), com região, elemento, reinos dos adultos e idade adulta
- [x] O reino da besta vem da espécie, não do domador: filhotes nascem no reino da linhagem (1º a 4º); adultas selvagens ficam na faixa da espécie; encontros escolhem espécies do reino de quem as encontra
- [x] **Fases de vida**: Filhote (não rompe reinos, 40% da força) → Jovem (75%) → Adulta (100%, até o teto da espécie) → Anciã (110%, pode passar do teto); linhagens nobres cultivam mais rápido
- [x] Bestas de famílias domadoras crescem e viram adultas junto com o personagem; a Evolução Conjunta sobe com você só até o teto da fase
- [x] **Bestiário Profundo — Fase 1** (`GDD_Bestiario_Profundo_Xuanhuan.docx`, dados em `src/game/bestiaryDeep.ts`): as 28 espécies ganharam ficha de identidade (nicho e habitat, comportamento, técnica de assinatura, fraqueza e leitura, materiais, vínculo, variante e gancho, papel ecológico e grau de ameaça I–VI); as 5 pilotos (Coelho de Jade, Lobo de Presas de Gelo, Pantera da Névoa, Carpa do Portão do Dragão, Camelo de Duas Almas) também têm habitats, dieta, atividade, estrutura social, temperamento, inteligência, habilidades com sinal/efeito/resposta, resistências, fraquezas e materiais com origem e renovabilidade
- [x] **Bestiário Profundo — Fase 2: conhecimento** (`src/game/beastKnowledge.ts`)
  - Cada espécie tem um nível de 0 a 5: **Desconhecida** (só silhueta e codinome, como "Predadora das águas", e a região) → **Reconhecida** (nome, aparência, reinos, ameaça) → **Estudada** (nicho, comportamento, habitat, dieta, atividade) → **Compreendida** (assinatura, fraqueza, habilidades com sinal e resposta) → **Dominada** (materiais, vínculo, temperamento) → **Lendária** (variantes, lendas, impacto no mundo); campos acima do nível aparecem como perguntas trancadas
  - Como avançar: rumor ou aparecer na história (1); "Seguir rastros" no Bestiário, teste de Inteligência mais difícil para linhagens nobres, ou 3 encontros (2); vencer a besta 2 vezes ou concluir o estudo dos rastros (3); domar (4); companheira adulta com vínculo 90+ (5)
  - **Rumores de caçadores** (1 de energia, 3 pedras): verdadeiros, exagerados ou falsos, marcados como "relato provável/duvidoso"; ao compreender a espécie, viram "confirmado" ou "desmentido" (riscado, sem apagar o histórico) e cada correção dá reputação
  - **Conhecimento tem valor em combate**: a partir de "Compreendida", a besta luta com 10% menos força e o jogo diz qual fraqueza você explorou
  - Nível efetivo = o maior entre o registrado e o deduzido do save (Codex, doma, companheira): saves antigos migram sem escrita e recarregar não duplica pistas nem rumores; o herdeiro herda os cadernos da família
  - [ ] Fases 3–5: novo painel com abas; encontros contextuais (bioma, hora, clima, intenção, rastros); habilidades, sinais, fraquezas e moral no combate; soluções não letais
  - [ ] Fases 6–8: necessidades, estados emocionais e memória da companheira; materiais por método de coleta; população regional e consequências de facção; missões-modelo (O Corredor Branco, A Pena Ausente…); estruturar as 23 espécies restantes
- [ ] Raça Demoníaca, Meio-Bestas, Espíritos Elementais, Cultivadores de Alma

### 11. Linha do Tempo
- [~] Citada em textos (Era Dourada, Cataclismo, Reconstrução)
- [ ] Causa do Cataclismo e papel da Raça Demoníaca (em aberto no próprio GDD)

### 12. Heranças Lendárias, Sorte e Vínculo Hereditário com Bestas
- [x] **Rolagem de Herança** (Sorte contra Bronze → Prata → Ouro → Ouro Negro → Lendário); Lendário nunca tem chance zero
  - Bronze: ervas/pílulas · Prata: manual Xuan/Terra · Ouro: manual Céu ou fragmento de artefato · Ouro Negro: herança de um Imperador/Sábio · Lendário: despertar de Constituição Especial ou manual Divino
- [x] Gatilhos da rolagem: nascimento, explorar (evento "Um Golpe de Sorte"), sobreviver a quase-morte
- [x] Túmulo Ancestral com eco de memória (provas de Coração, Força e Sabedoria) e pingente selado no berço
- [x] 12 heranças lendárias: Imperador Estelar, Rainha Fênix, Deus da Alquimia, Mestre das Mil Bestas, **Sábio da Espada**, **Dragão Ancestral**, **Rei Demoníaco**, **Nove Sóis**, **Forja Celestial** e as demoníacas **Imperatriz de Sangue**, **Vale dos Mil Cadáveres** e **Senhor das Sombras Infernais**
- [x] **Herança por alinhamento**: demoníaco (≤ −40) só recebe legados demoníacos (ou neutros, se já herdou todos), nunca justos; alinhamento positivo nunca recebe demoníacos
- [x] O ovo do Mestre das Mil Bestas choca um filhote de linhagem Divina ou Ancestral, já no 3º/4º reino, com Vínculo de Nascença
- [x] Heranças se **acumulam** (nenhuma apaga a outra); em combate vale a técnica mais forte de cada categoria, e as passivas de corpo/movimento usam a melhor que você conhece
- [x] 12 novas técnicas (Punho da Montanha, Lâmina do Vento, Lótus Carmesim, Pele de Ferro, Orvalho Celestial, Passo Relâmpago, Ossos de Jade, Sutra do Lótus Azul + 4 de herança)
- [x] **Domadores Hereditários**: família de domadores dá uma besta desde a infância — **Vínculo de Nascença**
- [x] **Evolução Conjunta** (a besta acompanha o seu rank) × **Evolução Independente** (cultiva no próprio ritmo, pode te ultrapassar ou ficar para trás, e às vezes acha tesouros sozinha) — escolha por besta no Bestiário
- [x] **Combate em Conjunto**: barra de **Sincronia** sobe a cada rodada; **Ataque Combinado** (técnica humana + besta) e **Técnica de Fusão** (teto de sincronia, só com Vínculo de Nascença ou vínculo perfeito)
- [ ] Rolagem de Herança própria da besta (hoje ela só encontra frutos espirituais)
- [ ] Mais heranças (uma por elemento/profissão), heranças incompletas, rivais disputando o mesmo túmulo

### 13. Prestígio Familiar, Fama por Profissão e Duelo Demoníaco
- [x] **Prestígio Familiar dinâmico**: a influência da família sobe com a sua fama (1 patamar a cada 80 pontos de influência pessoal)
- [x] **Fama por Profissão**: subir de nível em Alquimia (+8/nível), Inscrição (+7/nível) e Domador (+4/nível) rende reputação
- [x] Carreira **Letras e Crônicas** (copista → escriba → poeta → cronista → Lenda das Letras): pouco poder, fama de longo alcance a cada estação
- [x] **Duelo Demoníaco — Destruição de Núcleo**: contra o rival, duelos do quadro e desafios na seita (exige vantagem de cultivo)
  - A vítima vira mortal para sempre (NPC perde o cultivo); você perde alinhamento (−25) e se fere (fica exposto)
  - Gera um **Inimigo Jurado** (o clã/seita da vítima), que manda vingadores (evento "Rixa de Sangue")
  - Seitas ortodoxas expulsam quem faz isso (tabu)
- [x] **Fim da rixa de sangue** (Mundo → Rixas de Sangue e Vassalos). Cada rixa tem um Patriarca 2 reinos acima da vítima:
  - **Exterminar a família/clã**: 3 lutas seguidas (portões, salão dos anciões, câmara do Patriarca); vitória encerra a rixa, rende o tesouro do clã e muita fama, mas −30 de alinhamento
  - **Intimidação**: 2 reinos acima do Patriarca (ou influência "Mito continental"), eles não ousam mais mandar vingadores
  - **Impor submissão**: acima do Patriarca (ou "Lenda do reino"), a família vira **Vassala** e paga tributo por estação
  - Rixas e vassalos passam para o herdeiro
- [x] **Prestígio murchando**: o herdeiro recebe fama herdada (60% da fama do pai), que eleva a influência da família e perde 2% por estação se a nova geração não fizer o próprio nome
- [ ] Fama de escribas/poetas "recontada por gerações" (obras que persistem após a morte)

### 14. Sistemas Adicionais
- [x] **14.1 Torres de Prova** (painel **Mundo**): uma torre por região — Torre das Mil Provas na Planície Central (60 andares, até rank 7) e 4 torres menores (20–30 andares)
  - Andares alternam Prova de Combate, Prova de Compreensão (INT), Prova da Alma (ESP) e um Guardião a cada 10 andares
  - Recompensa por andar alcançado (pedras; pílulas a cada 5; manual + reputação a cada 10); na Torre das Mil Provas, andares altos rendem fama continental
  - 1 de energia por tentativa; o progresso em cada torre fica salvo
- [x] **14.2 Cicatrizes**: luta quase fatal (vida ≤ 12%) pode deixar uma cicatriz permanente — malefício + característica única (4 tipos, máx. 3)
- [x] **14.2 Sequelas**: "Meridianos Danificados" cobra 1 Pílula de Cura (ou 3 pedras) por estação; sem tratamento, o cultivo cai 20%
- [x] **14.2 Núcleo Rachado**: sobreviver a um vingador que tenta destruir seu núcleo pode rachá-lo (cultivo −40%) até achar uma **Pílula da Medula Celestial** (leilões, achados Ouro)
- [x] **14.3 Reencarnação**: origem sorteada no nascimento (mais provável com Sorte); sonhos de outra vida no prólogo
  - Memórias despertam aos 12, 20 e 30 anos: nome e título da vida passada, atributos, cultivo, manuais (o último pode ser de Grau Divino)
  - **Caçadores de Ecos**: seitas antigas reconhecem o eco e vêm atrás de você
- [x] **14.4 Rotas Comerciais** (painel **Mundo**): cada região exporta um produto (Minério Estelar do Norte, Elixir Refinado do Centro, Erva de Jade do Sul, Bambu Espiritual do Leste, Pigmento Dourado do Oeste)
  - Compre na origem, venda longe por ~2,3× — com **imposto** diferente em cada região (5% a 20%)
  - **Contrabando**: não paga imposto, mas teste de Destreza; falhar = carga confiscada
  - **Escolta de caravana** no quadro de Missões (luta contra salteadores, paga em pedras e mercadoria)
- [x] **14.5 Torneios Regionais** (painel **Mundo**): a cada 8 estações, 3 rodadas (quartas, semifinal, final) contra cultivadores do ranking, lutas encadeadas na arena; prêmios por rodada alcançada e títulos de campeão
- [x] **14.6 Divinação**: profissão Divinação (Leitor de Sinais → Adivinho → Vidente → Oráculo), aprendida com o Adivinho Cego; carreira de Divinação nas ocupações
  - **Vislumbre do Destino**: ler o próprio destino ou pagar um adivinho; profecias vagas, que podem estar **erradas** (precisão sobe com o nível)
  - Profecia verdadeira torna o evento previsto muito mais provável nos 2 anos seguintes; ao se cumprir (ou expirar), o jogo avisa
- [ ] Torneios de nível acima (continental) e o Torneio do Dragão Duplo jogável
- [ ] Profecias maiores sobre o destino do personagem (arco de campanha próprio)

### 15. Sistemas Adicionais II
- [x] **15.1 Reputação por facção** com cada uma das 9 Seitas Supremas (−100 a 100: Hostil → Desconfiada → Neutra → Favorável → Aliada), em Mundo → Seitas Supremas
  - Atos justos agradam as ortodoxas da região e irritam a demoníaca (e vice-versa); recrutamento, aliciamento e os eventos "Um Pedido da Seita Suprema" (caçar uma besta para as ortodoxas; silenciar uma testemunha para as demoníacas — ajudar uma irrita as rivais) mexem na reputação; discípulos de uma Suprema ganham a confiança dela aos poucos
  - Aliada recruta você mesmo sem raiz excepcional; Hostil nunca recruta, manda discípulos atrás de você (lutar, fugir ou pagar "desculpas") e, se for a Suprema que organiza a Torre de Prova e o Torneio Regional, proíbe a entrada
  - Preços do Mercado na região: de −6% (Aliada) a +20% (Hostil)
  - A facção fundada paga tributo anual às Supremas da região (meia pedra por membro); sem pedras, a reputação cai
  - O herdeiro herda metade da reputação
- [x] **15.2 Estações e clima espiritual**: calendário do mundo (continua com o herdeiro) mostrado no HUD
  - Primavera → Madeira, Verão → Fogo, Outono → Metal, Inverno → Água: +15% de cultivo passivo se o elemento da estação está na sua raiz (Terra, a transição, +5% o ano todo)
  - A cada estação, um clima espiritual: Céu calmo, **Maré de Qi** (+20% de cultivo) ou **Seca Espiritual** (−15%)
  - Janelas que só abrem numa época: Chuva de Orvalho (primavera), Flor do Sol Poente (verão), Feira da Colheita (outono), Lótus de Gelo e o **Selo Enfraquecido** de uma ruína da Era Dourada (no pico do inverno)
  - [ ] Estação afetando técnicas elementais em combate
- [x] **15.3 Companheiros de jornada** (Relações → Companheiros de jornada): até 2 (3 com influência "Lenda do reino")
  - Convide um amigo (relação 50+) ou aceite um viajante na estrada; cada um tem um papel — Guerreiro (+2 FOR/+2 CON), Batedor (+2 DES, −30% emboscadas), Curandeiro (+2 ESP, +15% de vida por estação), Erudito (+2 INT, +5% de cultivo) — e um caminho (ortodoxo ou demoníaco)
  - **Lealdade** própria: cai aos poucos, sobe ao dividir espólios e atender aos pedidos do companheiro (defender uma vila; assaltar uma caravana), reage aos seus atos conforme o caminho dele; caminhos opostos brigam
  - Lealdade 90+: **Irmão de Armas** (bônus em dobro); abaixo de 25, aviso; abaixo de 15, pode trair e fugir com 10% das pedras
  - Continuam sendo pessoas: podem virar namorados, cônjuges ou Companheiros(as) de Dao sem sair do grupo
- [x] **15.4 Karma**: separado do alinhamento, calculado pelos feitos (crueldades ×3 e mortes ×0,5 pesam; boas ações ×1,5 aliviam). Seis níveis, de Abençoado pelo Céu (−3 na dificuldade da Tribulação Celestial) a Amaldiçoado pelo Céu (+10); a tribulação avisa quando o karma pesa. Aparece na ficha do Inventário
- [x] **15.5 Codex** (barra lateral): registra sozinho, lendo os textos de cada evento, as regiões, Seitas Supremas, seitas e clãs, técnicas, bestas e heranças que você encontra (mais as pessoas de Relações), com busca e abas; avisa as novidades; o conhecimento fica no mundo e passa ao herdeiro

### 16. Sistemas Adicionais III
- [x] Método de cultivo, Mestre e Discípulo, Autodidatas, Traços da Vida, Alma Antiga e Herança Escondida, Noivado Arranjado, Guerra de Clãs, Rankings por Região e Bestiário (detalhes nas seções acima e abaixo)
- [x] Discípulos do jogador, provocar guerra, Grandes Grupos Mercadores e Seitas Supremas roubando discípulos (ver "Mundo vivo" e "Atividades")

---

## Vida de Discípulo de Seita

- [x] Discípulos não precisam trabalhar: estipêndio + deveres automáticos (+5 de contribuição por estação)
- [x] Pontos de Contribuição: missões da seita, tarefas extras, desafios
- [x] Postos: Externo → Interno → Núcleo → Ancião Aprendiz; estipêndio ×1, ×2, ×4, ×7
- [x] Pavilhão de Contribuição (pílulas, pedras, manuais até o grau do posto) e Sala de Cultivo
- [x] Hierarquia completa da seita (Líder, Anciões, discípulos) com cultivo, idade e raiz; Bestas Guardiãs
- [x] Desafiar discípulos do seu posto ou do posto acima para **tomar a vaga**
- [x] Seita ortodoxa expulsa quem trabalha no Submundo ou destrói núcleos
- [x] Discípulo pessoal de ancião: vínculo próprio, orientação por capítulo, custo de contribuição e encerramento do vínculo
- [x] O velho de roupas gastas vira um mestre de verdade (lições por capítulo, sem precisar de seita)
- [x] **Um único mestre**: quem é discípulo não pode ter outro; formar-se (alcançar o reino do mestre) é honroso; romper antes é desonra (reputação −15, alinhamento −10, ~5 anos sem que outro mestre aceite)
- [ ] Mudar de seita, trair a seita
- [ ] Clãs com sistema equivalente (hoje só estipêndio e intrigas)

## Fundar Clã ou Seita

- [x] Painel **Ocupação → Fundar Clã ou Seita**: clã exige 3º reino, 300 pedras e reputação 40; seita exige 4º reino, 600 pedras e reputação 80; você escolhe o nome
- [x] Fundador deixa a afiliação antiga (Patriarca Fundador / Mestre da Seita), não é mais discípulo e vive da **renda dos membros** (seita rende 1,5× por membro; +30% por membro a cada reino do fundador acima do 1º) e das **ofertas pela sua fama** (1 pedra a cada 15 de reputação, por estação)
- [x] Cônjuges, Companheiros(as) de Dao e filhos entram sozinhos na facção e contam como membros (aparece "membro da …" em Relações); quem deixa de ser família sai da contagem
- [x] Recrutar membros (custo cresce com o tamanho); a fama atrai membros sozinha
- [x] 3 instalações até o nível 3 (com manutenção): Sala de Cultivo (+8% de cultivo passivo), Biblioteca (−2 na dificuldade de estudar manuais), Muralhas (−25% de ataques de vingadores e bandidos)
- [x] O tamanho da facção eleva a influência da família; herdeiros nascem dentro dela e a herdam
- [x] **Guerra de Clãs** (também entre seitas): rivais da região declaram guerra à sua facção ou à seita/clã a que você pertence
  - Painel Mundo → Guerra: liderar ataques (luta contra um talento inimigo), desafiar o líder inimigo (força real), sabotar depósitos, propor trégua
  - Placar de −5 a +5; a cada estação a guerra pende para o lado mais forte (as muralhas da sua facção seguram ataques); 12 estações = armistício
  - Vitória: o inimigo vira Vassalo e paga tributo, espólios e reputação; derrota: pedras, reputação, membros e uma instalação
  - Seitas e clãs do mundo também guerreiam entre si e mudam de força no ranking
- [ ] Anciões e discípulos próprios com nomes, território

## Ocupações

- [x] Salário por estação, avaliação de desempenho, promoção, demissão, requisitos por cargo, riscos
- [x] Painel em **pastas por carreira**, com a escada de cargos de cada uma
- [x] Trabalhar tem custo: com emprego, o cultivo passivo cai de 30% para 15%
- [x] Trabalho Mundano (9 empregos) · Guilda de Alquimistas · Pavilhão de Inscrições
- [x] Arena de Combate · Guarda da Cidade · Submundo · **Letras e Crônicas**
- [x] Eventos próprios de cada carreira (plantão, noite de arena, golpe, encomenda)
- [ ] Comércio e Leilões · Administração de Clã · Cura e Medicina Espiritual · Lei da Seita
- [ ] Ensino de Cultivo · Forja e Formações · Música · Ópera Marcial
- [ ] Política Regional e Imperial · Militar · Voo e Rotas Aéreas · Exploração de Mundos Perdidos · Empreendedorismo
- [ ] Reescrever o `ocupacoes.md` em listas (itens emendados e duplicatas)

## Mundo vivo, Rankings e Missões

- [x] NPCs persistentes por região que envelhecem e cultivam com o tempo
- [x] Rankings de **qualquer uma das 5 regiões**: mais fortes, maiores talentos, melhores alquimistas e **Seitas e Clãs**; você aparece no ranking da região onde está; cultivadores e facções de todas as regiões visitadas avançam com o tempo
- [x] Quadro de missões: caçadas e duelos (com opção de Duelo Demoníaco)
- [x] Campanha: Arco 1 (O Dragão Adormecido), Arco 2 (Ascensão Regional), Arco 3 (O Coração do Mundo)
- [ ] Arco 4 em diante; missões com escolhas narrativas próprias
- [x] Rankings de outras regiões (as cinco), com abas separadas de **Seitas**, **Clãs** e **Grupos Mercadores**; clãs têm líderes mais fracos e menos membros (só os raros clãs ancestrais rivalizam com uma seita), e o patriarca carrega o sobrenome da casa
- [x] **Notícias do mundo das facções**: guerras e roubos de discípulos entre facções
- [x] **Seitas Supremas roubam discípulos**: tiram membros das seitas menores da região e da sua própria facção (a influência protege), e podem tentar aliciar você (aceitar, recusar ou espionar)
- [x] **Provocar guerra** (Mundo → Guerra de Clãs): escolha um rival do mesmo tipo (mais fraco, parelho ou mais forte); vencer faz seu clã/seita crescer (+35% de membros) e dá prestígio familiar
- [x] Rixas de sangue e vassalos em Mundo → Rixas de Sangue e Vassalos
- [x] **Grandes Grupos Mercadores** (Mercado → Grandes Grupos Mercadores): 4 casas comerciais pelas regiões, com cotas que pagam dividendos por estação, contratos (teste de atributo) e reputação que dá 5/10/15% de desconto em todo o Mercado
- [ ] Ranking continental; NPCs que reagem à sua influência

## Atividades

- [x] Pastas; energia por estação (5); repetir mais de 3 vezes não rende ou causa desvio de qi/lesão
- [x] Estilos, Corpo e Cultivo, Seita, Trabalho, Educação e Lazer, Social, Finanças, Crime, Bestas e Espiritualidade, Viagem
- [x] Conhecer pessoas; treinar a besta sozinha, cultivar junto com ela, domar bestas selvagens
- [x] **Aceitar discípulos** (Relações → Seus Discípulos): a partir do 3º reino e com reputação 20; 1 discípulo no 3º reino, +1 por reino (até 5); ensinar custa 1 de energia; eles cultivam sozinhos, nunca passam do seu reino e cada reino que rompem dá reputação; pode expulsar
- [x] **Campos espirituais automáticos**: colheita vai para a bolsa e o campo replanta sozinho (a semente fixada ou a melhor que o reino permite, sem gastar mais da metade das pedras)
- [x] **Mais 12 eventos aleatórios** na história: mendigo misterioso, caravana atacada, festival das lanternas, fruto espiritual, jovem mestre arrogante, criança perdida, tempestade espiritual, batedor de carteira, vendedor de manuais, partida de Go, eclipse de sangue e vila doente
- [ ] Romper aliança
- [x] Comprar montaria, espada ou barco voador e moradia (painel Mercado)
- [x] Aprender Alquimia, Inscrição e Divinação sozinho (autodidata) e comprar um manual de Método de Cultivo
- [ ] Comprar território, abrir loja
- [ ] Fama: demonstração pública, publicar manual; mais crimes (assaltar caravana, fraudar leilão, quebrar selo)

## Sistema de Vida (`Sistema-de-vida.md`)

- [x] Relacionamentos: pais, tutor, mestre, rival, cônjuge, besta companheira, seita inteira, **Inimigos Jurados**
- [x] O painel **Relações** mostra só os laços pessoais (família, noivado, mestre, discípulos, parceiros e pessoas conhecidas); a besta companheira foi para o **Bestiário**, rixas e vassalos para o **Mundo** e a hierarquia da seita para **Ocupação**
- [x] Pessoas com atributos (idade, cultivo, aparência, inteligência, compatibilidade elemental, relação)
- [x] Interações: conversar, presentear, namorar, casar, ter filhos, discutir, terminar
- [x] **Noivado arranjado**: clãs e seitas de prestígio prometem a criança no berço a um talento de outra família poderosa, que cultiva com o tempo
  - A partir dos 16 anos, com menos de 70% da força dela: rompimento público (aceitar, marcar o **duelo de três anos**, lutar ali mesmo ou rasgar a carta primeiro)
  - Famílias orgulhosas ou demoníacas podem mandar um **assassino**; vencer e expor abre uma rixa de sangue
  - Com 80% da força dela aos 18: **casamento** e dote (vira Cônjuge em Relações); quem humilhou você pode voltar arrependida quando você for muito mais forte
- [x] Companheiro(a) de Dao (compatibilidade ≥ 70) dá +10% de cultivo passivo (acumula até +30%)
- [x] **Harém**: vários parceiros(as) ao mesmo tempo; o limite cresce com a influência pessoal (1 → 5). Cada novo membro deixa os outros com ciúmes; ciúmes surgem ao longo do tempo; "Banquete para o harém" melhora todos; quem fica abandonado demais vai embora
- [x] Filhos nascem com raiz espiritual sorteada (pela Sorte)
- [x] **Jogar com o herdeiro depois da morte**: na tela de fim de vida, escolha um dos filhos para continuar
  - Herda metade das pedras, todos os artefatos e itens, os manuais das técnicas do pai (biblioteca da família), a arte marcial principal da família (Iniciante), a besta companheira e 30% de chance de herdar o corpo especial
  - Começa com a raiz espiritual do filho, aos 12 anos (ou na idade atual dele), na mesma região; irmãos e o outro genitor viram relações
  - O mundo continua (NPCs, rankings, seitas); a campanha, as torres e o quadro de missões recomeçam para a nova geração
  - Linhagem registrada (Pai → Filho → Neto…) e mostrada no legado e no fim de vida
- [ ] Filhos cultivando e agindo por conta própria enquanto o pai vive
- [x] Sistema de qualidade universal (Bronze ×1 → Lendário ×3) em peças forjadas, pílulas e na raridade de moradias e montarias (falta pets)
- [x] **Mercado** (botão na barra inferior), em pastas:
  - **Moradias** (10, do Quarto de Estalagem à Torre Celestial): densidade espiritual soma ao cultivo passivo, segurança reduz vingadores, prestígio dá reputação, manutenção por estação (sem pedras, a casa é penhorada); eventos de formação rompida e de oferta de compra
  - **Montarias, Espadas e Barcos Voadores** (13, da Mula ao Barco Estelar): viagens mais baratas; as voadoras quase não sofrem emboscadas; barcos vendem melhor nas Rotas Comerciais
  - **Armas e Armaduras**, **Fornalhas Alquímicas** e **Ervas, Pílulas e Talismãs**
  - Trocar de casa ou montaria revende a atual por metade do preço; herdeiros herdam casa, montaria e fornalha
- [ ] Animais de estimação com saúde, felicidade, obediência e custo mensal

---

## Próximos passos sugeridos

1. Mundos Perdidos de verdade (selo temporal, colapso, disputa entre seitas) e **Torneio do Dragão Duplo** jogável
2. Anciões com nome para a facção fundada, Patriarca em Reclusão e Anciões Convidados (que podem trair); território disputado nas guerras de clãs
3. Técnicas elementais e elementos superiores (Raio, Vento, Luz, Trevas, Espaço, Tempo) — e a estação favorecendo-as em combate
4. Filhos que cultivam e agem por conta própria enquanto o pai vive; missões para discípulos
5. Demais categorias de ocupação e o `ocupacoes.md` reescrito em listas
6. Imagens (retratos e cenas) e som
