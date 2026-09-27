import type { EspecieBesta, FaseBesta } from './bestiary';

/**
 * Bestiário Profundo — Fase 1 (docs/GDD_Bestiario_Profundo_Xuanhuan.docx, seções 10 e 11).
 * Campos opcionais sobre EspecieBesta: nada do catálogo atual muda. Todas as 28 espécies têm a
 * ficha de identidade; as cinco pilotos (uma por região) também têm os dados estruturados.
 */
export type PapelEcologico = 'presa' | 'forrageadora' | 'predadora' | 'apice' | 'guardia' | 'simbionte' | 'calamidade';
export type GrauAmeaca = 1 | 2 | 3 | 4 | 5 | 6;

export const NOME_PAPEL: Record<PapelEcologico, string> = {
  presa: 'Presa',
  forrageadora: 'Forrageadora',
  predadora: 'Predadora',
  apice: 'Ápice',
  guardia: 'Guardiã',
  simbionte: 'Simbionte',
  calamidade: 'Calamidade',
};

export const NOME_AMEACA: Record<GrauAmeaca, string> = {
  1: 'I — Local',
  2: 'II — Patrulha',
  3: 'III — Regional',
  4: 'IV — Domínio',
  5: 'V — Soberana',
  6: 'VI — Calamidade',
};

export interface HabilidadeBesta {
  id: string;
  nome: string;
  fases: FaseBesta[];
  /** O que o jogador percebe antes da ação perigosa. */
  sinal: string;
  efeito: string;
  /** Como responder. */
  resposta: string;
}

export interface MaterialBesta {
  id: string;
  nome: string;
  origem: 'coleta' | 'muda' | 'extracao' | 'caca' | 'presente';
  usos: string[];
  renovavel: boolean;
}

/** Ficha de identidade (seção 11): obrigatória para as 28 espécies. */
export interface FichaBesta {
  nicho: string;
  comportamento: string;
  assinatura: string;
  fraqueza: string;
  materiais: string;
  vinculo: string;
  variante: string;
  papelEcologico: PapelEcologico[];
  ameaca: GrauAmeaca;
}

/** Dados estruturados (seção 10.1), preenchidos primeiro nas espécies-piloto. */
export interface DadosProfundos {
  habitats?: string[];
  dieta?: string[];
  atividade?: string;
  estruturaSocial?: string;
  temperamento?: string[];
  inteligencia?: string;
  habilidades?: HabilidadeBesta[];
  resistencias?: string[];
  fraquezas?: string[];
  materiaisDetalhados?: MaterialBesta[];
  variantes?: string[];
  impactoMundial?: string[];
}

export type EspecieBestaProfunda = EspecieBesta & { ficha?: FichaBesta } & DadosProfundos;

const TODAS_AS_FASES: FaseBesta[] = ['Filhote', 'Jovem', 'Adulta', 'Anciã'];
const SEM_FILHOTE: FaseBesta[] = ['Jovem', 'Adulta', 'Anciã'];

export const FICHAS: Record<string, FichaBesta> = {
  // --- Planície Central ---
  'coelho-jade': {
    nicho: 'Forrageador de campos espirituais, pomares e margens de floresta. Enterra sementes carregadas de qi e melhora o solo ao redor das tocas.',
    comportamento: 'Crepuscular, familiar e muito cauteloso. Bate as patas para alertar o grupo e abandona campos onde sente intenção assassina repetida.',
    assinatura: 'Salto de Broto: deixa uma raiz súbita no ponto de partida. Em grupo, cria uma rede de raízes que atrasa perseguidores.',
    fraqueza: 'Sinos graves interrompem a percepção do solo; alimento fresco permite aproximação sem perseguição.',
    materiais: 'Pelos de muda para pílulas de recuperação suave; esterco de jade como fertilizante. Ambos renováveis.',
    vinculo: 'Ganha confiança com rotina, abrigo e cultivo sem veneno. Sofre se isolado de outros coelhos.',
    variante: 'Coelho de Jade Lunar, yin e noturno. O desaparecimento dos coelhos é o primeiro sinal de solo corrompido.',
    papelEcologico: ['forrageadora', 'presa'],
    ameaca: 1,
  },
  'tigre-nuvem-branca': {
    nicho: 'Predador ápice de montanhas úmidas. Controla herbívoros e mantém desfiladeiros livres de bestas corrompidas.',
    comportamento: 'Solitário, territorial e orgulhoso. Marca pedras com cortes de qi; ataca intrusos apenas após três avisos.',
    assinatura: 'Passo sobre Nuvens apaga o som das patas; Rugido da Lâmina condensa névoa em cortes metálicos.',
    fraqueza: 'Poeira de terra revela sua trilha e cavernas baixas limitam o passo aéreo. O bigode aponta para o próximo avanço.',
    materiais: 'Bigodes caídos para bússolas de qi; garras somente de cadáver natural ou caça, usadas em armas de precisão.',
    vinculo: 'Não aceita dominação. Um contrato exige sobreviver à caçada ritual sem ferir filhotes nem cruzar marcas proibidas.',
    variante: 'Tigre da Nuvem Trovejante. Uma linhagem está sendo caçada para falsificar selos de uma seita.',
    papelEcologico: ['apice', 'predadora'],
    ameaca: 4,
  },
  'garca-nove-penas': {
    nicho: 'Guardiã de lagos e terraços medicinais. Cada pena principal acumula um aspecto do ciclo vegetal.',
    comportamento: 'Paciente, monogâmica e sapiente. Julga comunidades pelo tratamento dado às nascentes.',
    assinatura: 'Círculo das Nove Penas alterna cura, enraizamento, purificação e lâminas de folha conforme a postura.',
    fraqueza: 'Água espelhada revela qual pena está ativa. Poluição deliberada transforma defesa em fúria sem negociação.',
    materiais: 'Uma pena cai a cada mudança de estação; usada em talismãs de cura. Pena arrancada perde pureza.',
    vinculo: 'Concede pacto de passagem após restaurar uma nascente e manter o juramento por um ciclo anual.',
    variante: 'Garça da Pena Vazia, com uma pena perdida para o Culto do Abismo; recuperá-la muda uma rota regional.',
    papelEcologico: ['guardia'],
    ameaca: 5,
  },
  'qilin-chifre-dourado': {
    nicho: 'Guardião de fronteiras antigas, campos honestamente cultivados e túmulos sem profanação.',
    comportamento: 'Soberano e compassivo, evita pisar em seres vivos. Reconhece mentiras pelo tremor do solo.',
    assinatura: 'Mandato do Solo sela técnicas de quem quebrou uma promessa dentro de seu domínio.',
    fraqueza: 'Não possui fraqueza elemental simples. Contradições em juramentos e marcos territoriais quebrados limitam o domínio.',
    materiais: 'Pó do chifre desprendido naturalmente fortalece formações; sangue ou chifre arrancado amaldiçoa o usuário.',
    vinculo: 'Não é domesticável. Pode reconhecer um "portador de mandato" e aparecer quando o pacto territorial é ameaçado.',
    variante: 'Qilin do Barro Negro nasce quando uma comunidade prospera por exploração; pode ser purificado ou tornar-se juiz hostil.',
    papelEcologico: ['guardia'],
    ameaca: 5,
  },
  'kirin-ancestral': {
    nicho: 'Memória viva das primeiras veias espirituais. Onde dorme, montanhas estabilizam e rios mudam lentamente de curso.',
    comportamento: 'Ancestral, silencioso e quase imóvel. Responde a linhagens, antigas dívidas e alterações profundas do terreno.',
    assinatura: 'Passo que Reescreve a Montanha altera relevo e sela passagens; Recordação Mineral reproduz técnicas gravadas no solo.',
    fraqueza: 'Combate direto é calamidade. Um marco do primeiro pacto permite dialogar e interromper o despertar.',
    materiais: 'Fragmentos de casco deixados a cada século; não há saque comum. Um fragmento registra a história do lugar.',
    vinculo: 'Jamais companheiro convencional. Pode conceder uma peregrinação compartilhada ou reconhecer uma linhagem familiar.',
    variante: 'O "Kirin Adormecido" pode ser a própria cordilheira central; mineração divina ameaça acordá-lo.',
    papelEcologico: ['guardia', 'calamidade'],
    ameaca: 6,
  },

  // --- Norte ---
  'lobo-presas-gelo': {
    nicho: 'Predador de tundra e pinheiros gelados. Abate animais doentes e conduz rebanhos para longe de gelo frágil.',
    comportamento: 'Matilha disciplinada; juvenis cercam, adultos decidem e anciãos preservam rotas de inverno.',
    assinatura: 'Mordida de Geada reduz circulação de qi; Uivo de Caça troca a liderança do cerco sem perder ação.',
    fraqueza: 'Calor seco racha a camada de gelo nas presas. A cauda do líder sinaliza a direção do próximo ataque.',
    materiais: 'Pelos de inverno e saliva congelante. Coleta não letal exige confiança ou toca abandonada.',
    vinculo: 'Deve ser aceito pela matilha ou formar nova unidade social; isolamento prolongado causa estresse.',
    variante: 'Lobo de Névoa Salina nas costas. Uma matilha segue refugiados porque perdeu seu território para uma mina.',
    papelEcologico: ['predadora'],
    ameaca: 2,
  },
  'aguia-tempestade': {
    nicho: 'Caçadora das escarpas; dispersa nuvens carregadas e leva minerais leves para ninhos altos.',
    comportamento: 'Casais territoriais criam um filhote por estação. Testam intrusos com mergulhos de aviso.',
    assinatura: 'Mergulho de Pressão cria lâmina sônica; Asa de Granizo encobre a retirada.',
    fraqueza: 'Perde controle em correntes cruzadas criadas por formações. As penas do pescoço se erguem antes do mergulho.',
    materiais: 'Penas condutoras de muda para talismãs de velocidade; casca de ovo abandonada para ligas leves.',
    vinculo: 'Exige espaço de voo e parceria, não montaria passiva. Responde bem a cultivadores que respeitam altitude.',
    variante: 'Águia do Olho Quieto prevê nevascas. Caçadores querem capturá-la antes de uma guerra de inverno.',
    papelEcologico: ['predadora'],
    ameaca: 2,
  },
  'urso-armadura-glacial': {
    nicho: 'Onívoro de geleiras e cavernas. Abre poços de pesca usados por espécies menores.',
    comportamento: 'Solitário fora da criação; evita conflito quando alimentado, mas protege covis com persistência absoluta.',
    assinatura: 'Armadura Glacial cresce enquanto recebe dano frio; Pancada de Fenda quebra o terreno sob o alvo.',
    fraqueza: 'Calor gradual expõe juntas, mas fogo súbito provoca frenesi. O gelo azula antes da pancada.',
    materiais: 'Gordura medicinal, pelos e placas desprendidas após hibernação; caça fornece mais, porém desestabiliza poços de pesca.',
    vinculo: 'Resgate de filhote pode gerar confiança, mas o adulto precisa hibernar e escolher território próprio.',
    variante: 'Urso de Vidro Azul possui armadura transparente contaminada por cristal de mineração.',
    papelEcologico: ['predadora', 'simbionte'],
    ameaca: 3,
  },
  'mamute-gelo-eterno': {
    nicho: 'Engenheiro de ecossistema. Migra abrindo rotas, cavando água e transportando sementes no pelo.',
    comportamento: 'Manada matriarcal, memória secular e luto prolongado. Evita assentamentos que respeitam corredores migratórios.',
    assinatura: 'Procissão do Inverno cria uma frente de neve; Trombeta Ancestral fortalece a manada e derruba formações.',
    fraqueza: 'Separação e pânico são mais perigosos que o indivíduo. Sinos de baixa frequência podem orientar sem ferir.',
    materiais: 'Lã, gelo das pegadas e presas encontradas após morte natural. Marfim caçado é contrabando sagrado.',
    vinculo: 'Pode aceitar guia temporário para uma migração. Nunca abandona a manada para ser companheiro permanente.',
    variante: 'Mamute de Musgo Invernal carrega um jardim medicinal. Uma fortaleza bloqueia a rota e ameaça toda a região.',
    papelEcologico: ['forrageadora', 'guardia'],
    ameaca: 5,
  },
  'dragao-gelo-primordial': {
    nicho: 'Soberano adormecido das calotas. Seu sonho regula invernos e preserva memórias no gelo profundo.',
    comportamento: 'Ancestral e territorial em escala continental. Considera séculos como estações.',
    assinatura: 'Inverno sem Horizonte congela qi e memória; Espelho da Geleira devolve técnicas registradas no gelo.',
    fraqueza: 'Calor não o derrota: desperta-o. O contrajogo é restaurar selos, devolver escama roubada ou ajustar o clima ritual.',
    materiais: 'Escamas antigas presas em geleiras; uma lasca pode conservar objeto ou lembrança por gerações.',
    vinculo: 'Somente pacto de soberania, com obrigações sobre o clima do Norte.',
    variante: 'Não há variante conhecida; relatos do Dragão Negro podem ser uma memória corrompida dentro do gelo.',
    papelEcologico: ['apice', 'calamidade'],
    ameaca: 6,
  },

  // --- Sul ---
  'sapo-fogo-venenoso': {
    nicho: 'Poças termais e mangues quentes. Controla insetos espirituais e concentra toxinas ambientais.',
    comportamento: 'Colonial e noturno. Infla bolsas luminosas antes de defender ovos.',
    assinatura: 'Cuspe Ígneo Tóxico adere ao chão; Coro Febril amplifica veneno de toda a colônia.',
    fraqueza: 'Água espalha vapor venenoso; barro frio neutraliza com segurança. A cor das bolsas indica a toxina.',
    materiais: 'Veneno ordenhado para antídotos e bombas; muco de muda para pomadas contra queimadura.',
    vinculo: 'Terrário úmido, companhia e alimentação regular. É útil para alquimistas, mas reage mal a recipientes secos.',
    variante: 'Sapo da Brasa Azul absorveu resíduo alquímico; curá-lo revela descarte ilegal de uma oficina.',
    papelEcologico: ['predadora'],
    ameaca: 2,
  },
  'serpente-escamas-jade': {
    nicho: 'Pomares, ruínas tomadas por vinhas e arrozais. Controla roedores e redistribui qi vegetal.',
    comportamento: 'Solitária, paciente e treinável. Prefere imobilizar a matar quando não está faminta.',
    assinatura: 'Laço de Videira faz brotar cipós por onde desliza; Muda Reflexiva deixa uma pele-ilusão.',
    fraqueza: 'Vibração ritmada confunde sua leitura do solo. A língua muda de cor antes da ilusão.',
    materiais: 'Peles de muda para talismãs de ocultação e escamas soltas para remédios de meridiano.',
    vinculo: 'Aceita tratadores pacientes e locais quentes. Mudanças bruscas de rotina geram fuga, não agressão.',
    variante: 'Serpente de Jade Oca vive em árvores mortas e pode indicar uma doença espiritual no pomar.',
    papelEcologico: ['predadora'],
    ameaca: 1,
  },
  'pantera-nevoa': {
    nicho: 'Predadora de pântanos e florestas chuvosas. Mantém criaturas doentes longe das nascentes.',
    comportamento: 'Solitária, astuta e silenciosa. Observa uma presa por dias e testa rotas de fuga.',
    assinatura: 'Corpo de Névoa evita o primeiro golpe direto; Passo sem Reflexo ataca a partir da imagem errada.',
    fraqueza: 'Pólen aderente e sinos finos revelam deslocamento. A névoa recua um instante antes do salto.',
    materiais: 'Bigodes para formações de ilusão; condensado de pegadas para pílulas de furtividade.',
    vinculo: 'Contrato possível após caça ritual equilibrada. Detesta jaulas e pune crueldade contra presas indefesas.',
    variante: 'Pantera Carmesim corrompida espalha alucinações; purificação pode recuperar memórias de seu território.',
    papelEcologico: ['predadora'],
    ameaca: 3,
  },
  'serpente-nove-cabecas': {
    nicho: 'Guardiã de deltas antigos. Cada cabeça regula um veneno, doença ou fluxo de água.',
    comportamento: 'Sapiente e internamente dividida; as cabeças podem votar, discutir e negociar condições distintas.',
    assinatura: 'Coro dos Nove Venenos combina efeitos; Regeneração Discordante cria nova cabeça se o corte não for selado.',
    fraqueza: 'Selar os pescoços por ordem ritual impede regeneração. Algumas cabeças aceitam argumento ou antídoto.',
    materiais: 'Veneno oferecido em gotas para medicina avançada; escamas de muda registram a personalidade de uma cabeça.',
    vinculo: 'Pacto diplomático, nunca domesticação. O jogador precisa manter nove cláusulas que podem entrar em conflito.',
    variante: 'Uma décima voz surge sem cabeça visível, sugerindo corrupção ou evolução incompleta.',
    papelEcologico: ['guardia'],
    ameaca: 5,
  },
  'fenix-carmesim': {
    nicho: 'Renova florestas antigas por incêndios raros e controlados. Sua morte e renascimento reorganizam o qi regional.',
    comportamento: 'Soberana, intensa e ligada a ciclos. Lembra promessas entre renascimentos, mas não todas as emoções.',
    assinatura: 'Coração de Cinzas renasce se o ciclo não for selado; Aurora Carmesim queima corrupção antes de matéria viva.',
    fraqueza: 'Yin e vazio podem conter as cinzas temporariamente, mas destruir o ciclo provoca incêndios espirituais descontrolados.',
    materiais: 'Penas dadas voluntariamente; cinza de renascimento só pode ser recolhida sem impedir o retorno.',
    vinculo: 'Pacto através de uma vida e uma morte simbólica. Pode acompanhar o jogador por um ciclo, não como propriedade.',
    variante: 'Fênix Pálida renasceu sem memória após ritual inimigo; restaurá-la altera alianças ancestrais.',
    papelEcologico: ['guardia', 'calamidade'],
    ameaca: 6,
  },

  // --- Leste ---
  'macaco-vento-prateado': {
    nicho: 'Copas de floresta, falésias e templos abandonados. Espalha sementes e recupera objetos brilhantes.',
    comportamento: 'Tropas curiosas, hierarquia flexível e forte aprendizagem social. Imitam gestos e selos simples.',
    assinatura: 'Mão que Rouba o Vento copia o início de uma técnica; Risada em Eco confunde alvo e direção.',
    fraqueza: 'Quebra-cabeças e trocas interessam mais que combate. Selos falsos podem fazê-los copiar um movimento inútil.',
    materiais: 'Pelos prateados de muda para talismãs de leveza; sementes escondidas revelam plantas raras.',
    vinculo: 'Precisa de estímulo, liberdade e interação social. Castigo repetitivo transforma curiosidade em sabotagem.',
    variante: 'Macaco dos Cem Selos memorizou uma técnica proibida e várias seitas querem capturá-lo.',
    papelEcologico: ['forrageadora'],
    ameaca: 1,
  },
  'tartaruga-coral': {
    nicho: 'Recifes e baías rasas. O casco sustenta corais, ervas e filhotes de outras espécies.',
    comportamento: 'Lenta, comunitária e migratória. Retorna ao mesmo recife por décadas.',
    assinatura: 'Domínio do Recife cria barreira compartilhada; Maré de Retorno empurra agressores sem persegui-los.',
    fraqueza: 'Vibrações harmônicas abrem a postura defensiva; a parte inferior é vulnerável, mas atacá-la prejudica a confiança.',
    materiais: 'Fragmentos de coral e placas de casco naturalmente soltas; retirar coral vivo destrói um micro-habitat.',
    vinculo: 'Pode transportar um guardião do recife. Exige água limpa e visitas sazonais ao local de origem.',
    variante: 'Tartaruga Cidade carrega um recife grande o bastante para um povoado; piratas querem ocupá-la.',
    papelEcologico: ['simbionte'],
    ameaca: 2,
  },
  'tubarao-chifre': {
    nicho: 'Predador de canais profundos. Segue vazamentos de qi e remove criaturas gravemente feridas.',
    comportamento: 'Solitário, incansável e atraído por circulação espiritual irregular, não apenas sangue.',
    assinatura: 'Investida Perfurante rompe barreiras; Sentido de Meridiano localiza o alvo com qi instável.',
    fraqueza: 'Máscaras de qi e pulsos rítmicos desviam a caçada. O chifre vibra antes de mudar de alvo.',
    materiais: 'Limalha do chifre para agulhas de acupuntura; dentes substituídos naturalmente para lâminas serrilhadas.',
    vinculo: 'Extremamente difícil. Requer área oceânica e rotina de caça; confinamento cria frenesi.',
    variante: 'Tubarão de Chifre Partido ataca portos porque uma arma de seita permanece presa em seu crânio.',
    papelEcologico: ['predadora'],
    ameaca: 3,
  },
  'carpa-portao-dragao': {
    nicho: 'Migrante de rios sagrados. Sua jornada redistribui qi e fertilidade entre costa e montanha.',
    comportamento: 'Persistente, social e orientada pelo Portão do Dragão. Ajuda carpas mais fracas contra correntes.',
    assinatura: 'Salto contra o Céu converte obstáculos vencidos em impulso; Escama da Perseverança resiste uma vez ao golpe fatal.',
    fraqueza: 'Não é vencida por armadilha simples: bloquear a rota fortalece sua determinação. Correntes laterais podem guiá-la.',
    materiais: 'Escamas deixadas em cachoeiras; água da passagem serve a pílulas de avanço sem garantir sucesso.',
    vinculo: 'O jogador acompanha a migração e ajuda outras carpas. Concluir a jornada pode exigir deixá-la ascender.',
    variante: 'Carpa do Portão Quebrado perdeu a rota após uma barragem; restaurar o rio afeta cidades e seitas.',
    papelEcologico: ['simbionte', 'forrageadora'],
    ameaca: 3,
  },
  'dragao-azul': {
    nicho: 'Soberano das chuvas, florestas costeiras e marés de primavera. Governa por ciclos, não por fronteiras humanas.',
    comportamento: 'Ancestral, sapiente e cerimonial. Responde a tributos simbólicos, equilíbrio hídrico e legitimidade.',
    assinatura: 'Édito da Primavera altera clima e crescimento; Corpo do Horizonte viaja entre nuvens e correntezas.',
    fraqueza: 'Seca artificial e juramento violado enfraquecem sua autoridade, mas também ameaçam a região inteira.',
    materiais: 'Escama oferecida como selo de mandato; orvalho de sua passagem para restaurar campos devastados.',
    vinculo: 'Aliança política e espiritual, nunca contrato de posse. Pode reconhecer emissário humano.',
    variante: 'Dois relatos contraditórios sugerem um Dragão Azul jovem disputando o título com o soberano.',
    papelEcologico: ['guardia', 'apice'],
    ameaca: 6,
  },

  // --- Oeste ---
  'camelo-duas-almas': {
    nicho: 'Rotas desérticas e oásis. Uma alma guia o corpo; a outra guarda memória de caminhos e perigos.',
    comportamento: 'Rebanho paciente, treinável e sensível a ilusões. Pode recusar uma rota que terminou em tragédia.',
    assinatura: 'Passo da Segunda Sombra detecta caminhos falsos; Reserva Espiritual sustenta a caravana em emergência.',
    fraqueza: 'Conflito entre as almas causa imobilidade. Canto rítmico e cheiro familiar restauram consenso.',
    materiais: 'Lã para mantos térmicos; cristais de suor para conservação de água, coletados sem ferir.',
    vinculo: 'Rotina, grupo e respeito às pausas. Vender um companheiro contra sua vontade deixa memória na segunda alma.',
    variante: 'Camelo de Alma Vazia chega sozinho de uma rota apagada dos mapas.',
    papelEcologico: ['presa', 'simbionte'],
    ameaca: 1,
  },
  'escorpiao-areia-dourada': {
    nicho: 'Dunas minerais e ruínas. Consome parasitas de veias espirituais e cristaliza toxinas no ferrão.',
    comportamento: 'Solitário, noturno e imóvel por longos períodos. Ataca vibração invasiva, não aparência.',
    assinatura: 'Ferrão de Ouro fixa veneno ao meridiano; Mergulho de Duna muda posição sob a areia.',
    fraqueza: 'Frio noturno reduz velocidade. Passos ritmados podem atraí-lo para ponto controlado.',
    materiais: 'Veneno para antídotos minerais; placas de muda para armadura leve resistente à areia.',
    vinculo: 'Possível com alimentação por minerais e recinto profundo. Não demonstra afeto humano, mas aprende padrões.',
    variante: 'Escorpião de Vidro surge perto de uma veia esgotada e carrega mapa mineral no casco.',
    papelEcologico: ['predadora'],
    ameaca: 2,
  },
  'falcao-sol-poente': {
    nicho: 'Cânions e planaltos. Caça durante o brilho baixo e mantém pequenos predadores longe das caravanas.',
    comportamento: 'Casais competitivos, precisão extrema e apego a poleiros elevados.',
    assinatura: 'Mergulho Contra o Sol cega antes do impacto; Pena Incandescente marca a presa para nova passagem.',
    fraqueza: 'Cobertura, espelhos foscos e deslocamento perpendicular anulam a vantagem solar. A sombra anuncia o ângulo.',
    materiais: 'Penas de muda para flechas térmicas e lentes; fuligem do poleiro para tinta de talismã.',
    vinculo: 'Contrato exige voo, caça e respeito ao par. Separar o casal destrói qualquer vínculo.',
    variante: 'Falcão do Eclipse perdeu o ciclo de caça após um fenômeno celestial e ataca à noite.',
    papelEcologico: ['predadora'],
    ameaca: 3,
  },
  'leao-dourado': {
    nicho: 'Guardião de cidades antigas, vales de bronze e rotas juramentadas. Sua presença afasta saqueadores.',
    comportamento: 'Orgulhoso, social e sapiente. O grupo reconhece coragem, hospitalidade e duelo justo.',
    assinatura: 'Juba das Mil Lâminas repele cercos; Rugido do Rei quebra medo aliado e intenção hostil.',
    fraqueza: 'Barro pesado e raízes flexíveis prendem a juba metálica. Desonra pública provoca duelo, não ataque ao grupo.',
    materiais: 'Fios de juba naturalmente soltos para armaduras cerimoniais; dentes só são entregues a sucessores.',
    vinculo: 'Pacto de honra com deveres públicos. O jogador precisa defender hóspedes e cumprir duelos aceitos.',
    variante: 'Leão sem Juba foi humilhado por uma seita e procura recuperar nome, não poder.',
    papelEcologico: ['guardia'],
    ameaca: 5,
  },
  'verme-devorador': {
    nicho: 'Calamidade subterrânea que segue veias espirituais. Ao passar, cria cavernas e desertos, mas também expõe minerais antigos.',
    comportamento: 'Instintivo em escala colossal. Não odeia cidades; percebe apenas concentração e vibração de qi.',
    assinatura: 'Fome do Subsolo drena formações; Boca do Horizonte engole terreno e reaparece quilômetros adiante.',
    fraqueza: 'Cego, sensível a ressonância. Redes de pilares podem desviar sua rota; feri-lo perto de cidade piora o desastre.',
    materiais: 'Placas abandonadas e cristais digestivos. Matar não é método realista; expedições coletam após a passagem.',
    vinculo: 'Não domesticável. Pode ser conduzido por formação continental, com enorme custo e responsabilidade.',
    variante: 'Um verme juvenil desperta sob uma mina; facções discordam entre matar, desviar ou explorar.',
    papelEcologico: ['calamidade'],
    ameaca: 6,
  },

  // --- Todas as regiões ---
  'lobo-cinzento': {
    nicho: 'Predador adaptável de campos e bosques. Serve como indicador rápido de pressão humana e escassez.',
    comportamento: 'Matilha familiar, evita cultivadores saudáveis e aprende rotas de caravanas.',
    assinatura: 'Cerco Comum ganha eficiência com número; Fuga Coordenada salva filhotes quando o líder recua.',
    fraqueza: 'Fogo controlado, ruído e remoção de alimento desviam a matilha. Não há resistência sobrenatural.',
    materiais: 'Pele e presas simples; valor maior como criação, guarda e estudo de comportamento.',
    vinculo: 'Domesticação gradual com alimento, limites e grupo. Indivíduos criados sozinhos desenvolvem ansiedade.',
    variante: 'Matilhas próximas a seitas começam a imitar formações de patrulha.',
    papelEcologico: ['predadora'],
    ameaca: 1,
  },
  'cavalo-espiritual': {
    nicho: 'Rebanhos de planície e criação humana. Transporta sementes, pessoas e qi térmico entre regiões.',
    comportamento: 'Social, sensível ao humor do cavaleiro e propenso a fugir de ambientes saturados de morte.',
    assinatura: 'Passo de Faísca mantém velocidade em terreno ruim; Fôlego de Longa Jornada compartilha resistência com o cavaleiro.',
    fraqueza: 'Medo e isolamento anulam técnicas. Orelhas e respiração antecipam pânico.',
    materiais: 'Crina de muda para cordas condutoras; esterco aquecido para campos frios.',
    vinculo: 'Cuidado diário e treino sem exaustão. A compatibilidade com o cavaleiro vale mais que o potencial bruto.',
    variante: 'Cavalo de Cinzas nasce em campos queimados e encontra caminhos através de incêndios.',
    papelEcologico: ['presa', 'simbionte'],
    ameaca: 1,
  },
  'corvo-tres-olhos': {
    nicho: 'Necrópoles, cidades e campos de batalha. Limpa restos, recolhe objetos e observa fluxos de qi.',
    comportamento: 'Bandos astutos, memória facial longa e trocas por objetos brilhantes ou histórias.',
    assinatura: 'Terceiro Olho percebe qi oculto; Voz Roubada reproduz frases e sons ouvidos com contexto limitado.',
    fraqueza: 'Reflexos múltiplos confundem o terceiro olho; trilhas falsas podem desviar o bando.',
    materiais: 'Pena ocular de muda para talismãs de detecção. Olho removido perde a maior parte do poder.',
    vinculo: 'Aceita mensageiros honestos e lembra traições por gerações. Precisa de voo livre e interação com o bando.',
    variante: 'Corvo do Quarto Presságio aparece antes de eventos impossíveis; talvez não seja uma espécie, mas um mensageiro.',
    papelEcologico: ['forrageadora'],
    ameaca: 1,
  },
};

/** Espécies-piloto (seção 14.1): uma por região, com os dados estruturados completos. */
export const DADOS_PILOTOS: Record<string, DadosProfundos> = {
  'coelho-jade': {
    habitats: ['campos espirituais', 'pomares', 'margens de floresta'],
    dieta: ['brotos espirituais', 'sementes carregadas de qi'],
    atividade: 'crepuscular',
    estruturaSocial: 'família',
    temperamento: ['cautelosa', 'dócil'],
    inteligencia: 'treinável',
    habilidades: [
      { id: 'salto-broto', nome: 'Salto de Broto', fases: TODAS_AS_FASES, sinal: 'As patas traseiras batem no chão duas vezes.', efeito: 'Salta e deixa uma raiz súbita no ponto de partida; em grupo, forma uma rede que atrasa perseguidores.', resposta: 'Não persiga em linha reta: contorne a rede ou ofereça alimento fresco.' },
    ],
    resistencias: ['madeira'],
    fraquezas: ['sinos graves (interrompem a percepção do solo)'],
    materiaisDetalhados: [
      { id: 'pelo-muda-jade', nome: 'Pelos de muda de jade', origem: 'muda', usos: ['pílulas de recuperação suave'], renovavel: true },
      { id: 'esterco-jade', nome: 'Esterco de jade', origem: 'coleta', usos: ['fertilizante de campos espirituais'], renovavel: true },
    ],
    variantes: ['Coelho de Jade Lunar (yin, noturno)'],
    impactoMundial: ['O desaparecimento dos coelhos é o primeiro sinal de solo corrompido.'],
  },
  'lobo-presas-gelo': {
    habitats: ['tundra', 'pinheirais gelados', 'rotas de inverno'],
    dieta: ['animais doentes', 'rebanhos'],
    atividade: 'diurna no inverno, crepuscular no verão',
    estruturaSocial: 'matilha',
    temperamento: ['territorial', 'predatória'],
    inteligencia: 'astuta',
    habilidades: [
      { id: 'mordida-geada', nome: 'Mordida de Geada', fases: SEM_FILHOTE, sinal: 'As presas brilham com cristais azulados.', efeito: 'Reduz a circulação de qi do alvo.', resposta: 'Calor seco racha o gelo das presas antes da mordida.' },
      { id: 'uivo-caca', nome: 'Uivo de Caça', fases: ['Adulta', 'Anciã'], sinal: 'A cauda do líder aponta a direção do próximo ataque.', efeito: 'Troca a liderança do cerco sem perder a ação.', resposta: 'Observe a cauda do líder e rompa o cerco pelo lado oposto.' },
    ],
    resistencias: ['água', 'frio'],
    fraquezas: ['calor seco'],
    materiaisDetalhados: [
      { id: 'pelo-inverno', nome: 'Pelos de inverno', origem: 'coleta', usos: ['mantos térmicos'], renovavel: true },
      { id: 'saliva-congelante', nome: 'Saliva congelante', origem: 'extracao', usos: ['pílulas de resfriamento', 'conservação'], renovavel: true },
    ],
    variantes: ['Lobo de Névoa Salina (costa)'],
    impactoMundial: ['Uma matilha segue refugiados porque perdeu seu território para uma mina.'],
  },
  'pantera-nevoa': {
    habitats: ['pântanos', 'florestas chuvosas', 'nascentes'],
    dieta: ['criaturas doentes', 'presas de pântano'],
    atividade: 'noturna',
    estruturaSocial: 'solitária',
    temperamento: ['predatória', 'cautelosa'],
    inteligencia: 'astuta',
    habilidades: [
      { id: 'corpo-nevoa', nome: 'Corpo de Névoa', fases: SEM_FILHOTE, sinal: 'A névoa ao redor fica mais espessa de repente.', efeito: 'Evita o primeiro golpe direto.', resposta: 'Pólen aderente marca o corpo real dentro da névoa.' },
      { id: 'passo-sem-reflexo', nome: 'Passo sem Reflexo', fases: ['Adulta', 'Anciã'], sinal: 'A névoa recua um instante antes do salto.', efeito: 'Ataca a partir da imagem errada.', resposta: 'Sinos finos revelam o deslocamento verdadeiro.' },
    ],
    resistencias: ['ilusão', 'água'],
    fraquezas: ['pólen aderente', 'sinos finos'],
    materiaisDetalhados: [
      { id: 'bigode-pantera', nome: 'Bigodes de névoa', origem: 'muda', usos: ['formações de ilusão'], renovavel: true },
      { id: 'condensado-pegadas', nome: 'Condensado de pegadas', origem: 'coleta', usos: ['pílulas de furtividade'], renovavel: true },
    ],
    variantes: ['Pantera Carmesim (corrompida, espalha alucinações)'],
    impactoMundial: ['Mantém criaturas doentes longe das nascentes do Sul.'],
  },
  'carpa-portao-dragao': {
    habitats: ['rios sagrados', 'cachoeiras', 'foz costeira'],
    dieta: ['algas espirituais', 'qi da correnteza'],
    atividade: 'sazonal (migração)',
    estruturaSocial: 'colônia migratória',
    temperamento: ['orgulhosa', 'curiosa'],
    inteligencia: 'sapiente',
    habilidades: [
      { id: 'salto-contra-ceu', nome: 'Salto contra o Céu', fases: SEM_FILHOTE, sinal: 'As escamas douradas brilham mais a cada obstáculo vencido.', efeito: 'Converte obstáculos vencidos em impulso.', resposta: 'Não bloqueie a rota: correntes laterais podem guiá-la.' },
      { id: 'escama-perseveranca', nome: 'Escama da Perseverança', fases: ['Adulta', 'Anciã'], sinal: 'Uma escama isolada começa a vibrar.', efeito: 'Resiste uma vez a um golpe fatal.', resposta: 'Vencer à força é quase inútil; ajudar a migração é o caminho.' },
    ],
    resistencias: ['água', 'correnteza'],
    fraquezas: ['correntes laterais (guiam sem ferir)'],
    materiaisDetalhados: [
      { id: 'escama-cachoeira', nome: 'Escamas de cachoeira', origem: 'muda', usos: ['talismãs de perseverança'], renovavel: true },
      { id: 'agua-passagem', nome: 'Água da passagem', origem: 'coleta', usos: ['pílulas de avanço (sem garantia)'], renovavel: true },
    ],
    variantes: ['Carpa do Portão Quebrado (perdeu a rota após uma barragem)'],
    impactoMundial: ['A migração redistribui qi e fertilidade entre costa e montanha.'],
  },
  'camelo-duas-almas': {
    habitats: ['rotas desérticas', 'oásis'],
    dieta: ['arbustos do deserto', 'água de oásis'],
    atividade: 'diurna',
    estruturaSocial: 'rebanho',
    temperamento: ['dócil', 'cautelosa'],
    inteligencia: 'treinável',
    habilidades: [
      { id: 'passo-segunda-sombra', nome: 'Passo da Segunda Sombra', fases: TODAS_AS_FASES, sinal: 'O camelo para e fareja o vento.', efeito: 'Detecta caminhos falsos e ilusões na rota.', resposta: 'Confie na parada: ele está evitando uma armadilha.' },
      { id: 'reserva-espiritual', nome: 'Reserva Espiritual', fases: ['Adulta', 'Anciã'], sinal: 'A segunda sombra se deita sobre o corpo.', efeito: 'Sustenta a caravana em emergência.', resposta: 'Respeite as pausas depois: forçar deixa memória na segunda alma.' },
    ],
    resistencias: ['calor', 'sede'],
    fraquezas: ['conflito entre as almas (imobilidade)'],
    materiaisDetalhados: [
      { id: 'la-camelo', nome: 'Lã de duas almas', origem: 'muda', usos: ['mantos térmicos'], renovavel: true },
      { id: 'cristal-suor', nome: 'Cristais de suor', origem: 'coleta', usos: ['conservação de água'], renovavel: true },
    ],
    variantes: ['Camelo de Alma Vazia (chega sozinho de uma rota apagada)'],
    impactoMundial: ['Pode recusar uma rota que terminou em tragédia, salvando caravanas.'],
  },
};

export function fichaDaEspecie(id: string): FichaBesta | undefined {
  return FICHAS[id];
}

export function especieProfunda(especie: EspecieBesta): EspecieBestaProfunda {
  return { ...especie, ficha: FICHAS[especie.id], ...(DADOS_PILOTOS[especie.id] ?? {}) };
}
