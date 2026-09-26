# Progresso da Implementação — Xuanhuan RPG

Status do que já está no jogo (`cultivo-rpg/`) em relação ao `GDD.md`, ao `ocupacoes.md` e ao `Sistema-de-vida.md`.

Legenda: **[x]** feito · **[~]** parcial · **[ ]** não feito

---

## Base técnica

- [x] Electron + TypeScript, interface em HTML/CSS/TS puro
- [x] Save/load em `save.json` com versão (saves de versões antigas são ignorados)
- [x] Salvamento automático a cada escolha + botão **Continuar** no menu
- [x] Simulador de vidas para testar equilíbrio (`npm run simular -- 30`)
- [x] **Migração de saves antigos**: saves de versões anteriores são atualizados automaticamente (campos novos recebem valores padrão) em vez de descartados
- [ ] Vários slots de save
- [ ] Tela de opções/configurações
- [x] Suporte a **retratos e ilustrações** (opcionais): retrato do protagonista escolhido na criação, caixa de diálogo com retrato de quem fala, ilustração por evento (`assets/cenas/<evento>.png`) — ver `assets/LEIA-ME.txt`
- [ ] Criar/gerar as imagens em si (a pasta `assets/` ainda não tem nenhuma)
- [ ] Som e música

## Criação de personagem

- [x] Nome (com gerador), gênero, traço (9 traços)
- [x] Distribuição de atributos com limite (14 pontos, cada atributo de 3 a 15, sem sobras)
- [x] Explicação de como cada atributo influencia o jogo
- [x] Nascimento sorteado fora da criação (região, família/clã/seita, ramo, raiz, corpo especial), com a Sorte melhorando as chances
- [x] **Rolagem de Herança no nascimento** (Ouro Negro/Lendário: pingente selado ou Constituição Especial)
- [x] Estilo marcial removido da criação — o primeiro estilo vem da escolha de infância

## Interface

- [x] HUD: nome, idade/expectativa de vida, reino e estágio, afiliação, local, ocupação, influência da família e pessoal
- [x] HUD: barras de vida e progresso de cultivo, barra de alinhamento (Demoníaco ↔ Ortodoxo), pedras espirituais, atributos
- [x] Painéis: Atividades, Missões, **Mundo** (Torre, Torneio, Comércio), Rankings, Relações, Seita e Ocupação, Ofícios, Inventário
- [x] Atividades e Ocupação organizadas em **pastas**
- [x] **Lutas reproduzidas devagar**: arena com barras de vida (sua, do inimigo, da besta), escudo e sincronia animadas, ação por ação, com velocidade 1×/2×/4× (lembrada entre sessões) e botão "Pular luta"
- [x] Registro completo da luta disponível depois (recolhido)
- [x] Tela de fim de vida com linhagem e escolha de herdeiro
- [ ] Resumo/linha do tempo dos feitos da vida

---

## GDD

### 1. Reinos de Cultivo
- [x] 13 ranks com estágios e expectativa de vida
- [x] Transição Chakra → Star no Rank 2
- [x] Tribulação Celestial a cada rank (pode adiar; falha fere; 1 natural mata)
- [x] Progresso mais lento a cada rank (×1,8 por rank)
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
- [ ] Campos espirituais como patrimônio (plantar ervas)
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
- [ ] Ranking das Seitas Supremas, torneio jogável
- [ ] Rixas históricas entre regiões, tributação

### 10. Bestas e Raças
- [x] Bestas espirituais da fauna regional, com faixa e cultivo visíveis; núcleos de besta
- [x] Besta companheira com cultivo próprio, vínculo, idade e evolução de faixa (Espiritual → Demoníaca → Divina → Ancestral)
- [x] **Domador de Bestas** como profissão (Aprendiz → Mestre das Mil Bestas); domar e trocar de companheira
- [ ] Raça Demoníaca, Meio-Bestas, Espíritos Elementais, Cultivadores de Alma

### 11. Linha do Tempo
- [~] Citada em textos (Era Dourada, Cataclismo, Reconstrução)
- [ ] Causa do Cataclismo e papel da Raça Demoníaca (em aberto no próprio GDD)

### 12. Heranças Lendárias, Sorte e Vínculo Hereditário com Bestas
- [x] **Rolagem de Herança** (Sorte contra Bronze → Prata → Ouro → Ouro Negro → Lendário); Lendário nunca tem chance zero
  - Bronze: ervas/pílulas · Prata: manual Xuan/Terra · Ouro: manual Céu ou fragmento de artefato · Ouro Negro: herança de um Imperador/Sábio · Lendário: despertar de Constituição Especial ou manual Divino
- [x] Gatilhos da rolagem: nascimento, explorar (evento "Um Golpe de Sorte"), sobreviver a quase-morte
- [x] Túmulo Ancestral com eco de memória (provas de Coração, Força e Sabedoria) e pingente selado no berço
- [x] 9 heranças lendárias: Imperador Estelar, Rainha Fênix, Deus da Alquimia, Mestre das Mil Bestas, **Sábio da Espada**, **Dragão Ancestral**, **Rei Demoníaco**, **Nove Sóis**, **Forja Celestial**
- [x] Heranças se **acumulam** (nenhuma apaga a outra); em combate vale a técnica mais forte de cada categoria, e as passivas de corpo/movimento usam a melhor que você conhece
- [x] 12 novas técnicas (Punho da Montanha, Lâmina do Vento, Lótus Carmesim, Pele de Ferro, Orvalho Celestial, Passo Relâmpago, Ossos de Jade, Sutra do Lótus Azul + 4 de herança)
- [x] **Domadores Hereditários**: família de domadores dá uma besta desde a infância — **Vínculo de Nascença**
- [x] **Evolução Conjunta** (a besta acompanha o seu rank) × **Evolução Independente** (cultiva no próprio ritmo, pode te ultrapassar ou ficar para trás, e às vezes acha tesouros sozinha) — escolha por besta no painel Relações
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
- [x] **Fim da rixa de sangue** (Relações → card do Inimigo Jurado). Cada rixa tem um Patriarca 2 reinos acima da vítima:
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

---

## Vida de Discípulo de Seita

- [x] Discípulos não precisam trabalhar: estipêndio + deveres automáticos (+5 de contribuição por estação)
- [x] Pontos de Contribuição: missões da seita, tarefas extras, desafios
- [x] Postos: Externo → Interno → Núcleo → Ancião Aprendiz; estipêndio ×1, ×2, ×4, ×7
- [x] Pavilhão de Contribuição (pílulas, pedras, manuais até o grau do posto) e Sala de Cultivo
- [x] Hierarquia completa da seita (Líder, Anciões, discípulos) com cultivo, idade e raiz; Bestas Guardiãs
- [x] Desafiar discípulos do seu posto ou do posto acima para **tomar a vaga**
- [x] Seita ortodoxa expulsa quem trabalha no Submundo ou destrói núcleos
- [ ] Discípulo Pessoal de um Ancião, mestre (Shifu) com relação própria
- [ ] Mudar de seita, trair a seita
- [ ] Clãs com sistema equivalente (hoje só estipêndio e intrigas)

## Fundar Clã ou Seita

- [x] Painel **Ocupação → Fundar Clã ou Seita**: clã exige 3º reino, 300 pedras e reputação 40; seita exige 4º reino, 600 pedras e reputação 80; você escolhe o nome
- [x] Fundador deixa a afiliação antiga (Patriarca Fundador / Mestre da Seita), não é mais discípulo e vive da **renda dos membros** (seita rende 1,5× por membro)
- [x] Recrutar membros (custo cresce com o tamanho); a fama atrai membros sozinha
- [x] 3 instalações até o nível 3 (com manutenção): Sala de Cultivo (+8% de cultivo passivo), Biblioteca (−2 na dificuldade de estudar manuais), Muralhas (−25% de ataques de vingadores e bandidos)
- [x] O tamanho da facção eleva a influência da família; herdeiros nascem dentro dela e a herdam
- [ ] Anciões e discípulos próprios com nomes, guerras entre facções, território

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
- [x] Rankings da região: mais fortes, maiores talentos, melhores alquimistas
- [x] Quadro de missões: caçadas e duelos (com opção de Duelo Demoníaco)
- [x] Campanha: Arco 1 (O Dragão Adormecido), Arco 2 (Ascensão Regional), Arco 3 (O Coração do Mundo)
- [ ] Arco 4 em diante; missões com escolhas narrativas próprias
- [ ] Rankings de outras regiões/continente; NPCs que reagem à sua influência

## Atividades

- [x] Pastas; energia por estação (5); repetir mais de 3 vezes não rende ou causa desvio de qi/lesão
- [x] Estilos, Corpo e Cultivo, Seita, Trabalho, Educação e Lazer, Social, Finanças, Crime, Bestas e Espiritualidade, Viagem
- [x] Conhecer pessoas; treinar a besta sozinha, cultivar junto com ela, domar bestas selvagens
- [ ] Aceitar discípulo, romper aliança
- [ ] Comprar montaria/espada voadora, território, abrir loja
- [ ] Fama: demonstração pública, publicar manual; mais crimes (assaltar caravana, fraudar leilão, quebrar selo)

## Sistema de Vida (`Sistema-de-vida.md`)

- [x] Relacionamentos: pais, tutor, mestre, rival, cônjuge, besta companheira, seita inteira, **Inimigos Jurados**
- [x] Pessoas com atributos (idade, cultivo, aparência, inteligência, compatibilidade elemental, relação)
- [x] Interações: conversar, presentear, namorar, casar, ter filhos, discutir, terminar
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
2. Anciões, Patriarca em Reclusão e Anciões Convidados (traição); anciões e guerras para a facção fundada
3. Técnicas elementais e elementos superiores
4. Moradias com densidade espiritual e montarias (viagens mais baratas/rápidas para o comércio)
5. Demais categorias de ocupação
