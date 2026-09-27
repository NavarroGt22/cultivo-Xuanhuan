import type { Character } from './character';
import type { StoryChoice } from './story';
import type { Efeitos } from './effects';
import type { CapituloNarrativo, EfeitoNarrativo, EstadoNarrativo } from './narrative';

/**
 * HIS-001 — Renascimento do Demônio Celestial (docs/GDD_Historias_Xuanhuan.docx, seção 9).
 * Ato 1: Cinzas da vida mortal (Capítulos 1 a 4). Textos e escolhas seguem o GDD; os ids das
 * escolhas são os do documento. Variáveis numéricas ficam ocultas ao jogador (seção 10.3).
 */
type N = EstadoNarrativo;

const v = (n: N, id: string): number => n.vars[id] ?? 0;
const f = (n: N, id: string): string => String(n.flags[id] ?? '');
const tem = (n: N, ...ids: string[]): boolean => ids.some((id) => Boolean(n.flags[id]));
const g = (c: Character, masc: string, fem: string): string => (c.genero === 'feminino' ? fem : masc);

function escolha(id: string, texto: string, resultado: string, efeito: Omit<EfeitoNarrativo, 'escolha'> = {}, extra: Efeitos = {}, bloqueio?: string | null): StoryChoice {
  return {
    texto,
    requisito: bloqueio ? { bloqueio } : undefined,
    resultado: { texto: resultado, efeitos: { ...extra, narrativa: { escolha: id, ...efeito } } },
  };
}

const continuar = (id: string, texto = 'Continuar.', resultado = '…'): StoryChoice => escolha(id, texto, resultado);

// ---------------------------------------------------------------------------
// Capítulo 1 — A Criança de Raiz Inútil (8 anos, Aldeia do Campo Sereno)
// ---------------------------------------------------------------------------
const CAPITULO_1: CapituloNarrativo = {
  numero: 1,
  titulo: 'A Criança de Raiz Inútil',
  cenas: [
    {
      id: 'HIS-001-CAP-01-CEN-01',
      titulo: 'O campo antes do amanhecer',
      meses: 0,
      personagem: 'Pai',
      montar: () => ({
        texto:
          'Você acorda antes do nascer do sol, com a chuva fina batendo no telhado e a voz do seu pai chamando lá fora. O canal está obstruído, e a colheita precisa ser protegida.\n\n' +
          '"Se continuarmos esperando pelos céus, o arroz aprende a nadar antes de nós."\n\n' +
          'Vocês dois retiram lama, folhas e pedras do canal. O trabalho é pesado para uma criança de oito anos, mas seu pai nunca trata você como inútil. No fundo da água, seus dedos encontram uma **pedra negra** que fica morna quando você a toca. Seu pai não percebe.',
        escolhas: [
          escolha('HIS-001-ESC-000-A', 'Perguntar por que a pedra está quente.', 'Seu pai franze a testa, vira a pedra nas mãos e a guarda para mostrar ao chefe da aldeia.', { vars: { 'VAR-VERDADE': 1 }, flags: { 'PEDRA-MORNA': 'pai' } }),
          escolha('HIS-001-ESC-000-B', 'Esconder a pedra.', 'Você a guarda no bolso. Durante o dia inteiro, ela continua morna contra a sua perna.', { vars: { 'VAR-CURIOSIDADE': 1 }, flags: { 'PEDRA-MORNA': 'guardada' } }),
          escolha('HIS-001-ESC-000-C', 'Jogar a pedra de volta na água.', 'A pedra afunda sem ruído. Por algum motivo, você sente que ela não foi embora de verdade.', { vars: { 'VAR-PRUDENCIA': 1 }, flags: { 'PEDRA-MORNA': 'templo' } }),
        ],
      }),
    },
    {
      id: 'HIS-001-CAP-01-CEN-02',
      titulo: 'A mesa da família',
      meses: 0,
      personagem: 'Irmã',
      montar: () => ({
        texto:
          'Depois do trabalho, a família divide uma refeição simples. Sua mãe separa ervas para a tosse de uma vizinha. Sua irmã tenta copiar, num pedaço de madeira, o símbolo que viu no templo. Seu pai calcula quanto arroz poderá ser guardado para o inverno.\n\n' +
          '"Hoje o cultivador viajante chega à aldeia. Dizem que ele consegue ver as raízes espirituais."',
        escolhas: [
          escolha('HIS-001-ESC-000-D', 'Mal conseguir ficar parado de tanta vontade.', 'Seu pai ri: possuir uma raiz não torna ninguém melhor. Sua mãe lembra que cultivadores também adoecem. Sua irmã faz você prometer que, se aprender a voar, vai levá-la para conhecer as montanhas.', { flags: { 'REACAO-CULTIVADOR': 'entusiasmo' } }),
          escolha('HIS-001-ESC-000-E', 'Confessar que tem medo do teste.', 'Sua mãe segura sua mão: cultivadores também adoecem, e ninguém nesta casa vai gostar menos de você. Sua irmã promete ficar ao seu lado na fila.', { flags: { 'REACAO-CULTIVADOR': 'medo' } }),
          escolha('HIS-001-ESC-000-F', 'Dar de ombros: o arroz importa mais.', 'Seu pai sorri, satisfeito. Sua irmã revira os olhos — e ainda assim pede que você a leve às montanhas se um dia aprender a voar.', { flags: { 'REACAO-CULTIVADOR': 'indiferenca' } }),
        ],
      }),
    },
    {
      id: 'HIS-001-CAP-01-CEN-03',
      titulo: 'O templo dos ancestrais',
      meses: 0,
      personagem: 'Shen Ruo',
      montar: (c) => ({
        texto:
          'Toda a aldeia se reúne diante do pequeno templo. **Shen Ruo**, discípulo externo de uma seita distante, instala um cristal de avaliação sobre a mesa. Ele não é cruel — está entediado, e considera os camponeses inferiores. As crianças tocam o cristal uma a uma; luzes fracas revelam afinidades de terra, água ou madeira.\n\n' +
          'Quando chega a sua vez, o cristal **apaga**. Shen Ruo acha que o artefato falhou e repete o teste. Na segunda tentativa, uma sombra parece atravessar o interior do cristal. Na terceira, surge uma rachadura quase invisível.\n\n' +
          '"Seus meridianos mal percebem o Qi. Sua raiz é pior que a de um animal doméstico. Você continuará Humano Comum até morrer."\n\n' +
          `Algumas crianças riem porque não compreendem a crueldade da frase. Alguns adultos desviam o olhar. O som mais importante é o seu próprio silêncio, antes de responder.`,
        escolhas: [
          escolha('HIS-001-ESC-001-A', '"Então vou viver sem precisar do seu Qi."', 'Shen Ruo arqueia a sobrancelha — e, sem saber, guarda a frase para lembrar dela anos depois.\n\nSeu pai põe a mão no seu ombro. "Não existe vergonha em ser comum. Um campo não precisa tocar os céus para alimentar uma família."', { vars: { 'VAR-VONTADE': 2 }, flags: { 'REACAO-TESTE': 'desafio' } }, { flags: { raizRevelada: true } }),
          escolha('HIS-001-ESC-001-B', '"Eu não fiz nada para merecer isso."', 'Sua mãe se coloca entre você e o cultivador e leva você para longe da mesa, protegendo-o da humilhação.\n\nSeu pai põe a mão no seu ombro. "Não existe vergonha em ser comum. Um campo não precisa tocar os céus para alimentar uma família."', { vars: { 'VAR-HUMANIDADE': 2 }, flags: { 'REACAO-TESTE': 'injustica' } }, { flags: { raizRevelada: true } }),
          escolha('HIS-001-ESC-001-C', '"Um dia farei você retirar essas palavras."', `O cultivador ri. Muito abaixo da terra, algo registra a frase — um dia, uma voz numa caverna vai vê-la como memória.\n\nSeu pai põe a mão no seu ombro. "Não existe vergonha em ser comum. Um campo não precisa tocar os céus para alimentar uma família."`, { vars: { 'VAR-FURIA': 2 }, flags: { 'REACAO-TESTE': 'ameaca' } }, { flags: { raizRevelada: true } }),
          escolha('HIS-001-ESC-001-D', 'Permanecer em silêncio e observar a rachadura.', `Enquanto todos olham para o seu rosto, você olha para o cristal. A rachadura desenha linhas que avançam e voltam ao centro.\n\nSeu pai põe a mão no seu ombro. "Não existe vergonha em ser comum. Um campo não precisa tocar os céus para alimentar uma família."`, { vars: { 'VAR-VONTADE': 1, 'VAR-VERDADE': 1 }, flags: { 'REACAO-TESTE': 'silencio', 'INVESTIGAR-TEMPLO': true } }, { flags: { raizRevelada: true } }),
        ].map((e) => ({ ...e, resultado: { ...e.resultado, texto: `${e.resultado.texto}\n\n${g(c, 'Classificado', 'Classificada')} como Humano Comum, raiz inútil.` } })),
      }),
    },
    {
      id: 'HIS-001-CAP-01-CEN-04',
      titulo: 'A tarde que permanece',
      meses: 0,
      montar: () => ({
        texto:
          'Depois do teste, a tarde é sua. Todas estas cenas aconteceram — mas só uma vai se transformar em **Memória Nítida**, capaz de oferecer uma solução especial no futuro.',
        escolhas: [
          escolha('HIS-001-ESC-002-A', 'Ajudar seu pai a reparar uma comporta e salvar mudas alagadas.', 'Você aprende que força sem direção destrói uma plantação. Memória Nítida: **Mãos que Cultivam**.', { flags: { 'MEMORIA-NITIDA': 'pai' } }),
          escolha('HIS-001-ESC-002-B', 'Preparar remédio com sua mãe e cuidar da vizinha.', 'Você aprende que uma erva venenosa, na dose certa, salva uma vida. Memória Nítida: **Pulso da Vida**.', { flags: { 'MEMORIA-NITIDA': 'mae' } }),
          escolha('HIS-001-ESC-002-C', 'Explorar o templo com sua irmã e comparar símbolos.', 'Atrás do altar, vocês encontram um símbolo circular com linhas que avançam e retornam ao centro — parecido com algo que você ainda não sabe nomear. Memória Nítida: **Olhos sem Nome**.', { flags: { 'MEMORIA-NITIDA': 'irma' } }),
        ],
      }),
    },
    {
      id: 'HIS-001-CAP-01-CEN-05',
      titulo: 'O visitante sob a chuva',
      meses: 0,
      montar: () => ({
        texto:
          'Ao anoitecer, um homem encapuzado pede abrigo. Diz ser cartógrafo, mas as botas dele trazem o símbolo apagado de uma seita. No jantar oferecido pelos moradores, pergunta sobre **tremores, pedras quentes e água com gosto metálico**.\n\n' +
          'Você o segue até o templo. O homem copia parte do símbolo ancestral e esconde um pequeno **talismã** sob o assoalho. Antes de partir, observa a casa da sua família por tempo demais.',
        escolhas: [
          escolha('HIS-001-ESC-003-A', 'Contar ao seu pai.', 'Seu pai arranca o talismã do assoalho e o queima no fogão. Quem vier procurar alguma coisa aqui virá menos preparado.', { vars: { 'VAR-VINCULO-FAMILIAR': 2, 'VAR-VERDADE': 1 }, flags: { 'TALISMA-VISITANTE': 'removido' } }),
          escolha('HIS-001-ESC-003-B', 'Contar ao cultivador Shen Ruo.', 'Shen Ruo toma o talismã e manda você esquecer o assunto. Mas ele guarda seu rosto — uma carta dele vai surgir anos depois.', { vars: { 'VAR-VERDADE': 2 }, flags: { 'TALISMA-VISITANTE': 'shen-ruo' } }),
          escolha('HIS-001-ESC-003-C', 'Guardar segredo e copiar o símbolo.', 'Você desenha o símbolo na terra e depois num pedaço de pano: **Esboço do Selo**. O talismã continua ativo sob o assoalho.', { vars: { 'VAR-VERDADE': 2 }, flags: { 'TALISMA-VISITANTE': 'ativo', 'ESBOCO-SELO': true } }),
          escolha('HIS-001-ESC-003-D', 'Não seguir o visitante e ficar em casa.', 'A família passa a noite reunida em volta do fogo. O que quer que o estranho tenha feito no templo, você não verá.', { vars: { 'VAR-PRUDENCIA': 1 }, flags: { 'TALISMA-VISITANTE': 'ativo' } }),
        ],
      }),
    },
    {
      id: 'HIS-001-CAP-01-CEN-06',
      titulo: 'Sob o mesmo teto',
      meses: 0,
      personagem: 'Irmã',
      montar: () => ({
        texto:
          'A tempestade aumenta. A família dorme reunida porque parte do telhado está vazando. No escuro, sua irmã pergunta se você ainda quer se tornar cultivador.',
        escolhas: [
          ['PROTECAO', '"Quero ficar forte para proteger vocês."'],
          ['ORGULHO', '"Quero mostrar que aquele homem estava errado."'],
          ['MORTAL', '"Não preciso cultivar para ter uma boa vida."'],
          ['VERDADE', '"Quero descobrir por que o cristal rachou."'],
        ].map(([id, texto], i) =>
          escolha(
            `HIS-001-ESC-000-P${i + 1}`,
            texto,
            'Sua irmã boceja e diz que vai cobrar a promessa.\n\nAntes de dormir, você escuta algo muito abaixo da terra. Não é uma voz completa — apenas duas palavras atravessando pedra, água e sonho:\n\n**Ainda não.**\n\nMuito abaixo das raízes e das rochas, uma corrente dourada prende um coração negro petrificado. Um de seus dedos se move.',
            { flags: { 'PROPOSITO-INFANTIL': id } },
          ),
        ),
      }),
    },
  ],
};

// ---------------------------------------------------------------------------
// Capítulo 2 — Quatro Colheitas (8 aos 12 anos)
// ---------------------------------------------------------------------------
const nomeMemoria: Record<string, string> = { pai: 'Mãos que Cultivam', mae: 'Pulso da Vida', irma: 'Olhos sem Nome' };

const CAPITULO_2: CapituloNarrativo = {
  numero: 2,
  titulo: 'Quatro Colheitas',
  cenas: [
    {
      id: 'HIS-001-CAP-02-CEN-01',
      titulo: 'Terra que não ri',
      meses: 0,
      montar: () => ({
        texto:
          'Três dias depois do teste, você volta ao campo. Algumas crianças repetem as palavras de Shen Ruo e chamam você de **Raiz Morta**. **Tao Jun**, filho do carpinteiro e seu amigo de infância, tenta defendê-lo — e piora tudo ao começar uma briga.',
        escolhas: [
          escolha('HIS-001-CAP-02-ESC-00-A', 'Separar os dois.', 'Você se mete no meio e leva um soco que não era para você. Tao Jun fica furioso por você não ter deixado ele terminar — mas a briga acaba.', { vars: { 'VAR-HUMANIDADE': 1 }, flags: { 'TAO-JUN-BRIGA': 'separou' } }),
          escolha('HIS-001-CAP-02-ESC-00-B', 'Lutar ao lado do amigo.', 'Vocês dois voltam para casa com o rosto roxo e rindo. Pela primeira vez desde o teste, você não se sente pequeno.', { vars: { 'VAR-FURIA': 1 }, flags: { 'TAO-JUN-BRIGA': 'lutou' } }),
          escolha('HIS-001-CAP-02-ESC-00-C', 'Ir embora em silêncio.', 'Você vira as costas. Atrás de você, Tao Jun continua brigando sozinho. Ele não fala com você por semanas.', { vars: { 'VAR-PRUDENCIA': 1 }, flags: { 'TAO-JUN-BRIGA': 'partiu' } }),
        ],
      }),
    },
    {
      id: 'HIS-001-CAP-02-CEN-01B',
      titulo: 'Terra que não ri',
      meses: 4,
      montar: (_c, n) => {
        const memoria = f(n, 'MEMORIA-NITIDA');
        const conselho =
          memoria === 'pai'
            ? 'Seu pai mostra uma semente que levou semanas para romper a terra.'
            : memoria === 'mae'
              ? 'Sua mãe mostra uma raiz medicinal que só cresce em solo pobre.'
              : 'Sua irmã lembra que o cristal rachou — e que ninguém explicou por quê.';
        return {
          texto:
            'Mais tarde, você tenta sentir o Qi sozinho. Senta-se como viu Shen Ruo fazer, controla a respiração, imagina a energia entrando pelo peito. Nada acontece. Quando força a circulação, sente uma dor aguda: seus meridianos não recebem o fluxo — eles o **empurram de volta**.\n\n' +
            '"Talvez aquele homem estivesse certo."\n\n' +
            conselho,
          escolhas: [
            escolha('HIS-001-CAP-02-ESC-01-A', 'Treinar o corpo através do trabalho.', 'Anos de carga, frio e colheita. Seu corpo endurece como madeira velha. Traço: **Corpo Camponês**.', { flags: { COMPETENCIA: 'corpo', 'TRACO-CORPO-CAMPONES': true } }, { atributos: { constituicao: 1, forca: 1 } }),
            escolha('HIS-001-CAP-02-ESC-01-B', 'Estudar ervas, minerais e animais espirituais.', 'Você aprende a olhar o que os outros pisam. Traço: **Observador Mortal**.', { flags: { COMPETENCIA: 'observador', 'TRACO-OBSERVADOR-MORTAL': true } }, { atributos: { inteligencia: 1 } }),
            escolha('HIS-001-CAP-02-ESC-01-C', 'Repetir a circulação todos os dias, apesar da dor.', 'A dor vira rotina. Uma noite, por um instante, você sente o fluxo tentar correr ao contrário. Marca: **Cicatriz no Meridiano**.', { vars: { 'VAR-VONTADE': 2 }, flags: { COMPETENCIA: 'cicatriz', 'CICATRIZ-MERIDIANO': true, 'PISTA-FLUXO-INVERSO': true } }, { atributos: { espirito: 1 } }),
            escolha('HIS-001-CAP-02-ESC-01-D', 'Abandonar o cultivo e aperfeiçoar a Memória Nítida.', `Você decide que ser comum não é vergonha. A memória familiar (${nomeMemoria[memoria] ?? 'sua memória'}) fica mais forte.`, { flags: { COMPETENCIA: 'memoria', 'MEMORIA-GRAU': 2, 'PROPOSITO-MORTAL-REFORCADO': true } }),
          ],
        };
      },
    },
    {
      id: 'HIS-001-CAP-02-CEN-02',
      titulo: 'A fome das folhas',
      meses: 0,
      montar: (_c, n) => {
        const memoria = f(n, 'MEMORIA-NITIDA');
        const competencia = f(n, 'COMPETENCIA');
        const precisa = (ok: boolean, motivo: string): string | null => (ok ? null : motivo);
        return {
          texto:
            'Na primeira primavera depois do teste, insetos cinzentos surgem nas plantações. Não comem os grãos: drenam o pouco Qi do solo, deixando as folhas transparentes. Shen Ruo já partiu, e a aldeia não tem dinheiro para contratar um cultivador. Se a praga continuar por três dias, parte das famílias passará fome no inverno.\n\n' +
            'Você percebe um padrão que os adultos não veem: os insetos evitam a água do canal perto do templo.',
          escolhas: [
            escolha('HIS-001-CAP-02-PRAGA-A', 'Inundar os sulcos no momento certo.', 'A água sobe na hora exata e a praga se afoga. Quase toda a colheita é salva, e seu pai confia a você o **mapa do canal**.', { flags: { PRAGA: 'inundou', 'MAPA-CANAL': true } }, {}, precisa(memoria === 'pai' || competencia === 'corpo', 'Exige Mãos que Cultivam ou Corpo Camponês')),
            escolha('HIS-001-CAP-02-PRAGA-B', 'Preparar fumaça com ervas amargas.', 'A fumaça amarga cobre os campos e os insetos fogem. Sua mãe entrega a você o **caderno de remédios** dela.', { flags: { PRAGA: 'fumaca', 'CADERNO-MAE': true } }, {}, precisa(memoria === 'mae' || competencia === 'observador', 'Exige Pulso da Vida ou Observador Mortal')),
            escolha('HIS-001-CAP-02-PRAGA-C', 'Copiar o desenho do templo na lama.', 'Os insetos fogem do símbolo. Sua irmã jura que viu uma das linhas se mover sozinha.', { vars: { 'VAR-VERDADE': 1 }, flags: { PRAGA: 'simbolo' } }, {}, precisa(memoria === 'irma' || v(n, 'VAR-VERDADE') >= 2, 'Exige Olhos sem Nome ou mais Verdade')),
            escolha('HIS-001-CAP-02-PRAGA-D', 'Queimar o primeiro campo para criar uma barreira.', 'O fogo detém a praga. A aldeia sobrevive — mas uma família perde toda a reserva, e agora a aldeia tem uma dívida com ela.', { vars: { 'VAR-FURIA': 1 }, flags: { PRAGA: 'queimou', 'DIVIDA-COMUNITARIA': true } }),
          ],
        };
      },
    },
    {
      id: 'HIS-001-CAP-02-CEN-02B',
      titulo: 'A fome das folhas',
      meses: 14,
      montar: (_c, n) => {
        const opcoes = [
          escolha('HIS-001-CAP-02-ESC-02-A', 'Sua família aceita comer menos.', 'O inverno é mais magro na sua casa — e mais quente nas outras.', { vars: { 'VAR-HUMANIDADE': 2, 'VAR-VINCULO-FAMILIAR': 2 }, flags: { 'PARTILHA-COLHEITA': 'familia' } }),
          escolha('HIS-001-CAP-02-ESC-02-B', 'A perda é dividida igualmente.', 'Alguns moradores acham a decisão justa; outros, não. Mas todos lembram que foi você quem propôs.', { vars: { 'VAR-REPUTACAO': 1 }, flags: { 'PARTILHA-COLHEITA': 'igual' } }),
          escolha('HIS-001-CAP-02-ESC-02-D', 'Expor os grãos escondidos pelo coletor de impostos.', 'Você encontra os sacos escondidos por **Ma Qiu** e os mostra à aldeia. A fome acaba — e agentes de fora passam a prestar atenção em você.', { vars: { 'VAR-VERDADE': 1 }, flags: { 'PARTILHA-COLHEITA': 'graos', 'GRAOS-EXPOSTOS': true } }),
        ];
        if (f(n, 'PRAGA') === 'queimou') {
          opcoes.splice(2, 0, escolha('HIS-001-CAP-02-ESC-02-C', 'A família cujo campo foi queimado assume o prejuízo.', 'A reserva da sua família fica intacta. Na casa vizinha, nasce um ressentimento que ninguém diz em voz alta.', { flags: { 'PARTILHA-COLHEITA': 'queimados', 'RESSENTIMENTO-OCULTO': true } }));
        }
        return {
          texto: 'A colheita foi menor que o esperado. Na reunião da aldeia, alguém precisa decidir quem recebe a menor parte.',
          escolhas: opcoes.map((e) => ({
            ...e,
            resultado: { ...e.resultado, texto: `${e.resultado.texto}\n\nNo fim da estação, você observa um único inseto morto. Dentro do casco há um pó negro que gira no sentido contrário ao vento. Ao tocá-lo, seus meridianos doem exatamente como quando você tentou cultivar.` },
          })),
        };
      },
    },
    {
      id: 'HIS-001-CAP-02-CEN-03',
      titulo: 'O homem no celeiro',
      meses: 10,
      personagem: 'Ren Huo',
      montar: (_c, n) => ({
        texto:
          'No inverno do seu décimo ano, o cachorro da família late para o celeiro. Escondido entre os sacos de arroz está **Ren Huo**, um cultivador ferido, com uma flecha atravessada no ombro. As roupas não têm emblema, mas no pulso há a marca removida da **Seita da Aurora Imaculada**.\n\n' +
          '"Se eu quisesse machucar vocês, teria feito antes de cair. Preciso de água, linha e uma noite."\n\n' +
          `Ele desertou depois de receber ordens para eliminar uma família que se recusava a vender suas terras. Carrega metade de um mapa marcado com veios espirituais e selos antigos.${tem(n, 'ESBOCO-SELO') ? ' Quando vê o esboço que você copiou do templo, empalidece.' : ''}`,
        escolhas: [
          escolha('HIS-001-CAP-02-ESC-03-A', 'Tratá-lo e escondê-lo.', `${f(n, 'MEMORIA-NITIDA') === 'mae' ? 'Suas mãos lembram o que sua mãe ensinou.' : 'Sua mãe ajuda você a costurar a ferida.'} Ren Huo sobrevive e deixa um **medalhão de bronze**. Antes de sumir na neve, avisa que a Aurora está comprando mapas de regiões agrícolas e procurando lugares onde bússolas espirituais enlouquecem.\n\n"Nunca acredite que um manto branco permanece limpo só porque o sangue foi lavado."`, { vars: { 'VAR-HUMANIDADE': 1 }, flags: { 'REN-HUO': 'vivo-aliado', 'MEDALHAO-BRONZE': true } }),
          escolha('HIS-001-CAP-02-ESC-03-B', 'Ouvir a história dele e mandá-lo partir.', 'Ren Huo parte antes do amanhecer. Deixa uma frase cifrada sobre a Aurora, rabiscada na parede do celeiro.', { vars: { 'VAR-PRUDENCIA': 1 }, flags: { 'REN-HUO': 'partiu', 'FRASE-CIFRADA': true } }),
          escolha('HIS-001-CAP-02-ESC-03-C', 'Entregá-lo aos guardas da cidade.', 'Os guardas levam Ren Huo acorrentado. A notícia chega à Aurora: a aldeia encontrou um desertor.', { vars: { 'VAR-REPUTACAO': 1 }, flags: { 'REN-HUO': 'entregue' } }),
          escolha('HIS-001-CAP-02-ESC-03-D', 'Roubar o mapa enquanto ele dorme.', 'Você foge com meio mapa cheio de veios e selos. Ren Huo sobrevive — e pode voltar como inimigo.', { vars: { 'VAR-FURIA': 1, 'VAR-VERDADE': 2 }, flags: { 'REN-HUO': 'roubado', 'MAPA-REN-HUO': true } }),
          escolha('HIS-001-CAP-02-ESC-03-E', 'Matá-lo para impedir que traga perigo.', 'Seu primeiro ato de violência deliberada. Suas mãos tremem por dias. Algo, muito abaixo da terra, presta atenção.', { vars: { 'VAR-FURIA': 2, 'VAR-HUMANIDADE': -3 }, flags: { 'REN-HUO': 'morto' } }, { alinhamento: -8 }, v(n, 'VAR-FURIA') >= 3 ? null : 'Exige mais Fúria'),
        ],
      }),
    },
    {
      id: 'HIS-001-CAP-02-CEN-04',
      titulo: 'O rio de pedra',
      meses: 10,
      montar: () => ({
        texto:
          'No terceiro ano, um tremor acorda a aldeia antes do amanhecer. O leito do canal se rompe, e a água desaparece por uma fenda recém-aberta. Você desce com seu pai e encontra uma parede de pedra coberta por **veios luminosos**. Por alguns segundos, parece uma mina espiritual. Quando a luz acaba, resta apenas rocha comum.\n\n' +
          'Enquanto os moradores reparam o canal, você encontra **três marcas de metal** presas em árvores, formando um triângulo ao redor da aldeia. No verso, o mesmo símbolo apagado das botas do cartógrafo.',
        escolhas: [
          escolha('HIS-001-CAP-02-ESC-04-A', 'Mostrar ao seu pai e preparar rotas de fuga.', 'Vocês dois memorizam cada túnel do canal. Se um dia for preciso correr, vocês saberão para onde.', { vars: { 'VAR-PREPARO-ALDEIA': 2 }, flags: { 'MARCAS-AURORA': 'rotas', 'TUNEIS-CANAL': true } }),
          escolha('HIS-001-CAP-02-ESC-04-B', 'Levar as marcas ao chefe da aldeia.', 'O Chefe **Guo Tian** envia uma mensagem à cidade. Ninguém responde — mas a aldeia fica alerta.', { vars: { 'VAR-PREPARO-ALDEIA': 1, 'VAR-REPUTACAO': 1 }, flags: { 'MARCAS-AURORA': 'chefe' } }),
          escolha('HIS-001-CAP-02-ESC-04-C', 'Seguir as pegadas dos observadores.', 'Numa clareira, você ouve dois homens falando o nome **Aurora Imaculada**. Um batedor vê você correndo de volta.', { vars: { 'VAR-VERDADE': 2 }, flags: { 'MARCAS-AURORA': 'seguiu', 'VISTO-POR-BATEDOR': true } }),
          escolha('HIS-001-CAP-02-ESC-04-D', 'Remover as marcas e criar rastros falsos.', 'Quem voltar para procurar vai perder tempo — e chegar mais irritado.', { vars: { 'VAR-VONTADE': 1 }, flags: { 'MARCAS-AURORA': 'removidas' } }),
          escolha('HIS-001-CAP-02-ESC-04-E', 'Ignorar o assunto para não assustar a família.', 'Você guarda o segredo para si. Naquela noite, todos dormem tranquilos.', { vars: { 'VAR-HUMANIDADE': 1 }, flags: { 'MARCAS-AURORA': 'ignoradas' } }),
        ],
      }),
    },
    {
      id: 'HIS-001-CAP-02-CEN-05',
      titulo: 'A última festa das lanternas',
      meses: 8,
      personagem: 'Irmã',
      montar: () => ({
        texto:
          'Quando você completa onze anos, a colheita é melhor que a esperada. A aldeia organiza a **Festa das Lanternas de Palha**: cada família oferece um prato, uma história e uma lanterna feita à mão.\n\n' +
          'Tao Jun pede desculpas pela briga de anos atrás e entrega a você uma **faca de carpinteiro**. Sua irmã mostra um mapa infantil das montanhas, desenhado para o dia em que vocês puderem viajar. Sua mãe revela que guardou moedas para mandar um dos filhos estudar medicina na cidade. Seu pai promete ampliar a casa depois da próxima colheita.\n\n' +
          '"Quando formos adultos, este lugar ainda vai estar aqui. Podemos partir porque sempre teremos para onde voltar."',
        escolhas: [
          ['A', 'Ajudar seu pai a soltar lanternas.', 'Promessa da Casa Maior', 'casa'],
          ['B', 'Cozinhar com sua mãe.', 'Sabor do Retorno', 'sabor'],
          ['C', 'Subir a colina com sua irmã.', 'Mapa das Montanhas', 'mapa'],
          ['D', 'Reconciliar-se de verdade com Tao Jun.', 'Faca do Carpinteiro', 'faca'],
        ].map(([letra, texto, ancora, id]) =>
          escolha(
            `HIS-001-CAP-02-ESC-05-${letra}`,
            texto,
            `Essa noite vira sua **Âncora Familiar**: ${ancora}.\n\nÀ meia-noite, todas as lanternas se inclinam na mesma direção, embora o vento tenha parado. Por um instante, sua sombra é projetada para trás e parece usar uma coroa quebrada. Só sua irmã percebe.\n\n"Sua sombra não está obedecendo você."\n\n"Talvez ela também tenha sido chamada de inútil."`,
            { flags: { 'ANCORA-FAMILIAR': id, 'FACA-CARPINTEIRO': true, 'MAPA-IRMA': id === 'mapa' } },
          ),
        ),
      }),
    },
    {
      id: 'HIS-001-CAP-02-CEN-06',
      titulo: 'O quarto inverno',
      meses: 2,
      montar: (_c, n) => {
        const suspeita =
          f(n, 'REN-HUO') === 'entregue'
            ? ' Ele já sabe o nome da sua família — o desertor foi entregue.'
            : f(n, 'REN-HUO') === 'roubado'
              ? ' Ele olha para as manchas de tinta nas suas mãos por tempo demais.'
              : f(n, 'MARCAS-AURORA') === 'removidas'
                ? ' Ele acusa os moradores de esconder propriedade da seita.'
                : '';
        return {
          texto:
            'Pouco antes de você completar doze anos, representantes da cidade chegam para registrar terras. Medem o solo, recolhem água e colocam uma **agulha espiritual** dentro do poço. A agulha gira descontroladamente e se parte.\n\n' +
            `O líder do grupo sorri antes de esconder o resultado.${suspeita} Naquela noite, um pássaro mensageiro parte em direção às montanhas.`,
          escolhas: [
            escolha('HIS-001-CAP-02-ESC-06-A', 'Convencer a família a esconder documentos, sementes e remédios no canal.', 'Vocês enchem um nicho do canal com o que a família tem de mais precioso: o **cache familiar**.', { flags: { 'ULTIMA-PREPARACAO': 'cache', 'CACHE-FAMILIAR': true } }),
            escolha('HIS-001-CAP-02-ESC-06-B', 'Pedir que todos abandonem a aldeia.', 'Sua família concorda em partir — depois da colheita. Um dia a mais.', { flags: { 'ULTIMA-PREPARACAO': 'partir' } }),
            escolha('HIS-001-CAP-02-ESC-06-C', 'Viajar sozinho até a cidade para buscar respostas.', 'Na cidade, você descobre que a Aurora Imaculada comprou os direitos sobre "terras de mina" no Leste. Quando volta, as estradas já estão fechadas.', { vars: { 'VAR-VERDADE': 1 }, flags: { 'ULTIMA-PREPARACAO': 'cidade', 'INFO-CIDADE': true } }),
            escolha('HIS-001-CAP-02-ESC-06-D', 'Não preocupar a família e continuar a rotina.', 'Mais uma noite tranquila à mesa. A última.', { vars: { 'VAR-PREPARO-ALDEIA': -1 }, flags: { 'ULTIMA-PREPARACAO': 'rotina', 'ANCORA-FORTE': true } }),
          ],
        };
      },
    },
    {
      id: 'HIS-001-CAP-02-CEN-07',
      titulo: 'Mantos brancos na estrada',
      meses: 0,
      personagem: 'Pai',
      montar: () => ({
        texto:
          'Na manhã seguinte, você trabalha com seu pai no mesmo canal de quatro anos atrás. Agora consegue levantar sozinho as pedras que antes exigiam ajuda. Ele observa suas mãos feridas e diz que você cresceu depressa demais.\n\n' +
          '"Você ainda pensa no que aquele cultivador disse?"',
        escolhas: [
          ['MANTER', 'Manter o que você disse à sua irmã quatro anos atrás.'],
          ['REJEITAR', 'Dizer que aquela criança já não existe.'],
          ['NAO-SEI', 'Admitir que ainda não sabe quem quer ser.'],
        ].map(([id, texto]) =>
          escolha(
            `HIS-001-CAP-02-ESC-07-${id}`,
            texto,
            'Seu pai não responde — um sino toca na entrada da aldeia. Tao Jun aparece correndo, sem fôlego. Atrás dele, animais espirituais descem a colina. Dezenas de cultivadores usam **mantos brancos com bordas douradas**. O emblema no peito deles é um sol nascendo por trás de uma espada.\n\n' +
              'À frente do grupo, o **Ancião Jian Luo** desenrola um decreto. A voz dele, amplificada por Qi, atravessa todas as casas:\n\n' +
              '"Por ordem da Seita da Aurora Imaculada, estas terras e tudo o que existe sob elas passam a pertencer ao caminho ortodoxo. Os habitantes terão três horas para partir."\n\n' +
              'A pedra morna racha. Muito abaixo da aldeia, o coração petrificado dá sua primeira batida completa em incontáveis anos.\n\n**Agora.**',
            { flags: { 'PROPOSITO-AOS-DOZE': id } },
          ),
        ),
      }),
    },
  ],
};

// ---------------------------------------------------------------------------
// Capítulo 3 — Mantos Brancos sobre o Campo (12 anos)
// ---------------------------------------------------------------------------
const CAPITULO_3: CapituloNarrativo = {
  numero: 3,
  titulo: 'Mantos Brancos sobre o Campo',
  cenas: [
    {
      id: 'HIS-001-CAP-03-CEN-01',
      titulo: 'Três horas',
      meses: 0,
      personagem: 'Jian Luo',
      montar: (_c, n) => {
        const preparo = v(n, 'VAR-PREPARO-ALDEIA') >= 1;
        const estudou = tem(n, 'ESBOCO-SELO') || f(n, 'MEMORIA-NITIDA') === 'irma';
        return {
          texto:
            'Jian Luo termina de ler o decreto enquanto discípulos fincam **doze estandartes brancos** ao redor da aldeia. Cada um projeta uma linha dourada sobre o chão. Os moradores acham que marcam a futura escavação.' +
            (estudou ? ' Você reconhece o padrão: é uma barreira de contenção — voltada para dentro.' : '') +
            '\n\n"Recolham apenas o que puderem carregar. Quem danificar propriedade espiritual responderá diante da seita."\n\n' +
            'O Chefe Guo Tian pede autorização para retirar idosos, animais e sementes. Jian concede as três horas, mas proíbe qualquer pessoa de cruzar os estandartes antes da inspeção. A contradição diz tudo: a evacuação talvez nunca tenha sido real.',
          escolhas: [
            escolha('HIS-001-CAP-03-ESC-01-A', 'Organizar a resistência.', 'Você corre até Tao Wei, o carpinteiro, e Han Bo, o caçador. Se a aldeia vai cair, vai cair lutando.', { flags: { 'ROTA-MASSACRE': 'resistencia' } }, {}, tem(n, 'TRACO-CORPO-CAMPONES') || f(n, 'MEMORIA-NITIDA') === 'pai' || preparo ? null : 'Exige Corpo Camponês, Mãos que Cultivam ou uma aldeia preparada'),
            escolha('HIS-001-CAP-03-ESC-01-B', 'Preparar a evacuação pelo canal.', 'Você conhece os túneis. Se houver uma saída, ela passa por baixo da terra.', { flags: { 'ROTA-MASSACRE': 'evacuacao' } }, {}, tem(n, 'MAPA-CANAL', 'CACHE-FAMILIAR', 'TUNEIS-CANAL') || preparo ? null : 'Exige o mapa do canal, o cache familiar ou uma aldeia preparada'),
            escolha('HIS-001-CAP-03-ESC-01-C', 'Seguir Jian Luo e procurar a ordem verdadeira.', 'Alguém precisa saber o que realmente foi ordenado — e sobreviver para contar.', { flags: { 'ROTA-MASSACRE': 'evidencia' } }, {}, v(n, 'VAR-VERDADE') >= 3 || tem(n, 'TRACO-OBSERVADOR-MORTAL', 'ESBOCO-SELO') ? null : 'Exige mais Verdade, Observador Mortal ou o Esboço do Selo'),
            escolha('HIS-001-CAP-03-ESC-01-D', 'Ficar com a família e ajudá-la a empacotar a vida.', 'Você escolhe as pessoas, não o destino da aldeia. Sua mãe aperta sua mão com força.', { vars: { 'VAR-HUMANIDADE': 1 }, flags: { 'ROTA-MASSACRE': 'familia', 'ANCORA-FORTE': true } }),
          ],
        };
      },
    },
    {
      id: 'HIS-001-CAP-03-CEN-02',
      titulo: 'A discípula da última fileira',
      meses: 0,
      personagem: 'Lian Yue',
      montar: () => ({
        texto:
          '**Lian Yue** recebe a tarefa de vigiar o poço. Ela tem treze anos e segura a espada com as duas mãos para esconder o tremor. Quando uma criança tenta buscar água, outro discípulo levanta a bainha para golpeá-la — e Lian intervém: a ordem proíbe violência antes da inspeção.',
        escolhas: [
          escolha('HIS-001-CAP-03-ESC-02-A', 'Confiar a ela que existem crianças no templo.', 'Lian não responde. Mas, minutos depois, você vê que ela mudou a patrulha para longe do templo.', { vars: { 'VAR-VINCULO-LIAN': 2 }, flags: { 'LIAN-PRIMEIRA': 'confiou' } }),
          escolha('HIS-001-CAP-03-ESC-02-B', 'Acusá-la de participar da ameaça.', 'Ela não se defende. Só olha para você — com culpa.', { vars: { 'VAR-FURIA': 1 }, flags: { 'LIAN-PRIMEIRA': 'acusou' } }),
          {
            texto: 'Roubar o talismã de passagem dela (Destreza).',
            teste: { atributo: 'destreza', dificuldade: 12 },
            resultado: { texto: 'Seus dedos de camponês são mais rápidos do que ela esperava. O **talismã de passagem** agora está no seu bolso.', efeitos: { narrativa: { escolha: 'HIS-001-CAP-03-ESC-02-C', flags: { 'LIAN-PRIMEIRA': 'roubou', 'TALISMA-PASSAGEM': true } } } },
            falha: { texto: 'Ela segura seu pulso no ar. Não grita. Apenas solta você — e lembra do seu rosto.', efeitos: { narrativa: { escolha: 'HIS-001-CAP-03-ESC-02-C', flags: { 'LIAN-PRIMEIRA': 'roubou-falhou' } } } },
          },
          escolha('HIS-001-CAP-03-ESC-02-D', 'Perguntar quem assinou a ordem.', 'Lian olha para a tira de jade na cintura do ancião e percebe algo que não queria perceber: o selo superior parece sobreposto.', { vars: { 'VAR-VERDADE': 1 }, flags: { 'LIAN-PRIMEIRA': 'perguntou' } }),
        ],
      }),
    },
    {
      id: 'HIS-001-CAP-03-CEN-03',
      titulo: 'A mina que não responde',
      meses: 0,
      personagem: 'Jian Luo',
      montar: (_c, n) => {
        const rota = f(n, 'ROTA-MASSACRE');
        const pista =
          rota === 'evidencia'
            ? 'Escondido atrás da tenda, você vê **He Song** trocar a tira verdadeira por outra.'
            : rota === 'familia'
              ? 'Sua irmã, ao seu lado, sussurra que a luz da inscrição mudou de cor.'
              : f(n, 'REN-HUO') === 'partiu' || f(n, 'REN-HUO') === 'vivo-aliado'
                ? 'A frase de Ren Huo volta à sua cabeça — e você reconhece a cifra na tira de jade.'
                : '';
        return {
          texto:
            'Os mestres de inscrição perfuram três pontos do campo e instalam bússolas espirituais. A primeira gira até quebrar. A segunda aponta para o templo. A terceira fica imóvel. **Não há veio de pedras espirituais** que justifique uma mina divina — apenas uma concentração profunda que recua sempre que tentam medi-la.\n\n' +
            `Jian Luo exige contato com a seita. He Song entrega uma tira de jade supostamente enviada pelo Grande Ancião Qiao Zhen. ${pista}\n\n` +
            '*A anomalia confirma contaminação perversa. Purifiquem os habitantes. Escavem até encontrar a fonte.*\n\n' +
            'Jian Luo compreende o significado. Ele poderia suspender a missão. Em vez disso, olha para os moradores, calcula o valor político de voltar sem a mina e ordena que ninguém atravesse a formação.\n\n' +
            '"A resistência de mortais diante de uma ordem justa já é prova de corrupção."',
          escolhas: [continuar('HIS-001-CAP-03-CEN-03-C', 'Continuar.', 'O silêncio que se segue é o de uma aldeia inteira entendendo ao mesmo tempo.')],
        };
      },
    },
    {
      id: 'HIS-001-CAP-03-CEN-04',
      titulo: 'A primeira morte',
      meses: 0,
      montar: (_c, n) => ({
        texto:
          'Guo Tian exige ver a nova ordem. Jian recusa. O chefe tenta atravessar a linha para mostrar o decreto aos moradores do lado de fora — e **Han Geng** o atinge com a lança.\n\n' +
          (tem(n, 'GRAOS-EXPOSTOS')
            ? 'Ma Qiu, o coletor de impostos que você desmascarou, é o primeiro a correr para amparar Guo Tian.'
            : 'Ma Qiu recua e, em troca de proteção, revela aos discípulos o túnel secundário.') +
          '\n\nO sino de Tao Jun toca três vezes. A ponte cai. As comportas se abrem. Fumaça de ervas cobre o celeiro. A resistência do Campo Sereno começa não com uma arma espiritual, mas com ferramentas, água, madeira e pessoas que se recusam a morrer ajoelhadas.',
        escolhas: [continuar('HIS-001-CAP-03-CEN-04-C', 'Correr.', 'Seus pés se movem antes que você decida para onde.')],
      }),
    },
    {
      id: 'HIS-001-CAP-03-CEN-05',
      titulo: 'Cada um em seu posto',
      meses: 0,
      montar: (_c, n) => {
        const rota = f(n, 'ROTA-MASSACRE');
        if (rota === 'resistencia') {
          return {
            texto:
              'Você ajuda Tao Wei a derrubar a ponte antes das bestas espirituais, usa a água do canal para apagar os estandartes externos e leva flechas a Han Bo, que derruba o pássaro mensageiro e fere Han Geng. Agora falta decidir o que as armadilhas de madeira vão fazer com os discípulos que entrarem nelas.',
            escolhas: [
              escolha('HIS-001-CAP-03-RES-A', 'Ferir: montarias e pernas.', 'Montarias caem, discípulos mancam. Os sobreviventes culpados vão jurar vingança.', { flags: { ARMADILHAS: 'ferir', 'FERIMENTOS-AURORA': true } }),
              escolha('HIS-001-CAP-03-RES-B', 'Prender: redes e covas.', 'Dois discípulos presos numa cova discutem entre si quem recebeu qual ordem. Você ouve tudo.', { vars: { 'VAR-VERDADE': 1 }, flags: { ARMADILHAS: 'prender', 'FERIMENTOS-AURORA': true } }),
              escolha('HIS-001-CAP-03-RES-C', 'Matar: estacas e pedras.', 'A perseguição imediata diminui. O que você fez hoje vai tornar difícil qualquer defesa pública sua no futuro.', { vars: { 'VAR-FURIA': 2 }, flags: { ARMADILHAS: 'matar', 'FERIMENTOS-AURORA': true } }, { alinhamento: -5 }),
            ],
          };
        }
        if (rota === 'evacuacao') {
          return {
            texto:
              'Você retira pedras do túnel com as ferramentas de Tao Jun e começa a conduzir grupos para baixo da terra. Não há tempo para todos. Quem vai primeiro?',
            escolhas: [
              escolha('HIS-001-CAP-03-EVA-A', 'As crianças.', 'Você leva as crianças pelo túnel escuro, contando histórias baixinho para que não chorem.', { vars: { 'VAR-HUMANIDADE': 2 }, flags: { EVACUACAO: 'criancas' } }),
              escolha('HIS-001-CAP-03-EVA-B', 'Os idosos.', 'Avó Nai Li recusa ir. Os outros idosos vão, apoiados em você.', { vars: { 'VAR-HUMANIDADE': 1 }, flags: { EVACUACAO: 'idosos' } }),
              escolha('HIS-001-CAP-03-EVA-C', 'Sua própria família.', 'Você corre para casa. Seus pais se recusam a entrar no túnel antes dos vizinhos.', { vars: { 'VAR-VINCULO-FAMILIAR': 2 }, flags: { EVACUACAO: 'familia' } }),
            ].map((e) => ({ ...e, resultado: { ...e.resultado, texto: `${e.resultado.texto}\n\nA formação da Aurora detecta o fluxo de pessoas e desaba parte do túnel. Você aprende, com as mãos sangrando, a **rota subterrânea**.` } })),
          };
        }
        if (rota === 'evidencia') {
          return {
            texto:
              'Você distrai os guardas com fumaça e entra na tenda de comando. Há três coisas sobre a mesa — e tempo para pegar só uma antes que a tira de jade se destrua.',
            escolhas: [
              escolha('HIS-001-CAP-03-EVI-A', 'A ordem original.', 'A ordem original prova negligência da seita.', { vars: { 'VAR-VERDADE': 2 }, flags: { 'PROVA-SALVA': 'ordem' } }),
              escolha('HIS-001-CAP-03-EVI-B', 'O mapa.', 'O mapa liga um nome — **Su Moye** — a este lugar.', { vars: { 'VAR-VERDADE': 2 }, flags: { 'PROVA-SALVA': 'mapa' } }),
              escolha('HIS-001-CAP-03-EVI-C', 'A lista de participantes.', 'A lista identifica, um a um, os executores.', { vars: { 'VAR-VERDADE': 2 }, flags: { 'PROVA-SALVA': 'lista' } }),
            ].map((e) => ({ ...e, resultado: { ...e.resultado, texto: `${e.resultado.texto} Antes de sair, você copia o selo de He Song.` } })),
          };
        }
        return {
          texto:
            'Você ajuda sua mãe a mover feridos para o celeiro e protege sua irmã enquanto ela completa, com carvão, o símbolo do templo. A casa começa a queimar. Há tempo para levar **um** objeto da família.',
          escolhas: OBJETOS_FAMILIA(),
        };
      },
    },
    {
      id: 'HIS-001-CAP-03-CEN-06',
      titulo: 'Os nomes dos que ficaram',
      meses: 0,
      montar: () => ({
        texto:
          'As rotas convergem quando **Avó Nai Li** conduz as crianças ao templo e começa a recitar os nomes dos fundadores da aldeia. Cada nome faz o altar responder — sem saber, as famílias mantiveram um selo por gerações através de ritos cotidianos. A Aurora interpreta a reação como prova de um tesouro escondido.\n\n' +
          'Jian Luo manda He Song quebrar o altar. Sua irmã completa a linha que faltava e **desvia a explosão** para o campo vazio. O esforço a deixa gravemente ferida. A onda espiritual desperta, por um instante, algo nos seus meridianos: você enxerga o movimento inteiro e grava o primeiro padrão que vai copiar no futuro.',
        escolhas: [
          escolha('HIS-001-CAP-03-ESC-03-A', 'Gravar a formação de contenção da Aurora.', 'Linhas que prendem, linhas que soltam. Você sente que um dia saberá quebrá-las.', { flags: { 'TECNICA-OBSERVADA': 'formacao' } }),
          escolha('HIS-001-CAP-03-ESC-03-B', 'Gravar o passo de espada de Jian Luo.', 'Um passo entre duas respirações. Seu corpo guarda o ritmo como uma cicatriz.', { flags: { 'TECNICA-OBSERVADA': 'passo-jian' } }),
          escolha('HIS-001-CAP-03-ESC-03-C', 'Gravar a barreira de água e luz de Lian Yue.', 'Ela ergueu a barreira para proteger uma criança. Você guarda o desenho — e o gesto.', { flags: { 'TECNICA-OBSERVADA': 'barreira-lian' } }),
          escolha('HIS-001-CAP-03-ESC-03-D', 'Gravar a circulação de He Song ao destruir o altar.', 'Há algo errado no fluxo dele — algo que não é da Aurora.', { vars: { 'VAR-VERDADE': 1 }, flags: { 'TECNICA-OBSERVADA': 'he-song' } }),
        ],
      }),
    },
    {
      id: 'HIS-001-CAP-03-CEN-07',
      titulo: 'A casa e o campo',
      meses: 0,
      personagem: 'Mãe',
      montar: (_c, n) => {
        const texto =
          'Seu pai está ferido, sua mãe coberta de fuligem e sua irmã mal consegue caminhar. Eles não discutem sobre quem será salvo. Seus pais já decidiram que você vai entrar no túnel.\n\n' +
          '"Você não é o único que pode escolher por esta família."';
        if (!f(n, 'OBJETO-FAMILIAR')) return { texto: `${texto}\n\nSua mãe olha em volta da casa em chamas: "Leve alguma coisa nossa."`, escolhas: OBJETOS_FAMILIA() };
        return { texto: `${texto}\n\nSeu pai, com a voz firme: "Sobreviver não significa concordar com o que fizeram. Significa que eles não conseguiram apagar todos nós."`, escolhas: PROMESSAS() };
      },
    },
    {
      id: 'HIS-001-CAP-03-CEN-07B',
      titulo: 'A casa e o campo',
      meses: 0,
      personagem: 'Pai',
      montar: (_c, n) => {
        if (f(n, 'PROMESSA-FAMILIA')) return { texto: 'Não há mais nada a dizer. Só a água subindo.', escolhas: [continuar('HIS-001-CAP-03-CEN-07B-C', 'Entrar no túnel.', 'A água fria engole seus joelhos.')] };
        return {
          texto: '"Sobreviver não significa concordar com o que fizeram. Significa que eles não conseguiram apagar todos nós."',
          escolhas: PROMESSAS(),
        };
      },
    },
    {
      id: 'HIS-001-CAP-03-CEN-08',
      titulo: 'A espada que não desceu',
      meses: 0,
      personagem: 'Lian Yue',
      montar: (_c, n) => {
        const temProva = Boolean(f(n, 'PROVA-SALVA'));
        const opcoes = [
          escolha('HIS-001-CAP-03-ESC-05-A', 'Dizer a ela seu nome verdadeiro.', 'Ela repete seu nome em voz baixa, como quem guarda algo perigoso.', { vars: { 'VAR-VINCULO-LIAN': 2 }, flags: { 'VINCULO-LIAN': 'nome' } }),
          escolha('HIS-001-CAP-03-ESC-05-B', 'Dizer o nome de Jian Luo.', 'O encontro vira uma acusação que ela nunca vai esquecer.', { vars: { 'VAR-VERDADE': 1 }, flags: { 'VINCULO-LIAN': 'acusacao' } }),
          escolha('HIS-001-CAP-03-ESC-05-C', 'Entregar a ela uma cópia da prova.', 'A prova agora existe em dois lugares. A Aurora vai descobrir que ela existe.', { vars: { 'VAR-VINCULO-LIAN': 1 }, flags: { 'VINCULO-LIAN': 'prova' } }, {}, temProva ? null : 'Exige uma prova salva'),
          escolha('HIS-001-CAP-03-ESC-05-D', 'Não dizer nada.', 'Você passa em silêncio. Entre vocês dois começa uma culpa sem confiança.', { flags: { 'VINCULO-LIAN': 'silencio' } }),
        ];
        return {
          texto:
            'O pai abre a comporta e a água invade o pátio. Sua mãe empurra o objeto da família para as suas mãos. Sua irmã usa o último pedaço de carvão para desenhar uma seta no mapa dela. Os três ficam do outro lado para que os discípulos não vejam a entrada.\n\n' +
            'Na boca do canal, **Lian Yue** encontra você. A ordem dela é eliminar qualquer sobrevivente. Ela ergue a espada — e você não tem cultivo para vencê-la. Mas ela vê uma criança ensanguentada, não um demônio.\n\n' +
            '"Se eu deixar você passar, tudo o que conheço acaba."\n\n"Tudo o que eu conheço já acabou."',
          escolhas: opcoes.map((e) => ({
            ...e,
            resultado: { ...e.resultado, texto: `${e.resultado.texto}\n\nLian corta o próprio braço, espalha sangue na entrada e golpeia a parede para simular uma execução e um desabamento. Depois baixa a espada e desfaz um único traço da barreira.\n\n"Corra antes que eu volte a ser covarde."` },
          })),
        };
      },
    },
    {
      id: 'HIS-001-CAP-03-CEN-09',
      titulo: 'Debaixo do campo',
      meses: 0,
      montar: (_c, n) => {
        const saida =
          tem(n, 'MAPA-CANAL', 'TUNEIS-CANAL') || v(n, 'VAR-PREPARO-ALDEIA') >= 2
            ? { id: 'raizes', texto: 'Você toma a **saída das raízes**, longe da perseguição, e leva o cache familiar inteiro.' }
            : tem(n, 'TALISMA-PASSAGEM') || v(n, 'VAR-VINCULO-LIAN') >= 2
              ? { id: 'fenda', texto: 'Você sai pela **fenda da formação**, perto da estrada, e vê de relance quem vai persegui-lo.' }
              : tem(n, 'MAPA-IRMA')
                ? { id: 'selo', texto: 'A seta no mapa da sua irmã leva à **passagem do antigo selo**. Por um instante, algo lá embaixo sussurra.' }
                : { id: 'dreno', texto: 'A única saída é um **dreno estreito e inundado**. Você sai com o objeto da família — e uma cicatriz nova.' };
        return {
          texto:
            'Você rasteja pelo túnel enquanto o fogo consome as construções acima. A água sobe, carregando cinzas, grãos e pequenos objetos da aldeia. Atrás de você, a entrada desaba.\n\n' +
            `${saida.texto}\n\n` +
            'Ao emergir, você vê o Campo Sereno coberto por fumaça branca. Os cultivadores começam a escavar antes mesmo de apagar os incêndios. Jian Luo declara a missão concluída. **Nenhuma mina é encontrada.**\n\n' +
            'Você espera ouvir o sino outra vez. Escuta apenas uma batida vinda de debaixo da terra. Depois outra.\n\n**Sobreviva.**',
          escolhas: [
            escolha('HIS-001-CAP-03-CEN-09-C', 'Entrar nas montanhas.', 'Sem alimento, sem cultivo e sem saber para onde ir, você entra nas montanhas. A neve começa a cair.', {
              flags: { SAIDA: saida.id, 'REGISTRO-DOS-MORTOS': true, ...(saida.id === 'dreno' ? { 'CICATRIZ-FISICA': true } : {}) },
            }),
          ],
        };
      },
    },
  ],
};

function OBJETOS_FAMILIA(): StoryChoice[] {
  return [
    escolha('HIS-001-CAP-03-OBJ-A', 'A ferramenta do seu pai.', 'O cabo gasto ainda está quente da mão dele.', { flags: { 'OBJETO-FAMILIAR': 'ferramenta' } }),
    escolha('HIS-001-CAP-03-OBJ-B', 'O caderno da sua mãe.', 'Receitas, doses, nomes de vizinhos curados — e anotações sobre os feridos desta noite.', { flags: { 'OBJETO-FAMILIAR': 'caderno', 'CADERNO-MAE': true } }),
    escolha('HIS-001-CAP-03-OBJ-C', 'O mapa da sua irmã.', 'As montanhas que vocês nunca vão visitar juntos — e, sem que ela soubesse, um fragmento correto do selo.', { flags: { 'OBJETO-FAMILIAR': 'mapa', 'MAPA-IRMA': true } }),
    escolha('HIS-001-CAP-03-OBJ-D', 'A tigela da família.', 'Não serve para lutar. Serve para lembrar quem você era à mesa.', { flags: { 'OBJETO-FAMILIAR': 'tigela' } }),
  ];
}

function PROMESSAS(): StoryChoice[] {
  return [
    escolha('HIS-001-CAP-03-ESC-04-A', '"Eu vou me vingar."', 'Seu pai fecha os olhos. Não discute.', { vars: { 'VAR-FURIA': 3 }, flags: { 'PROMESSA-FAMILIA': 'vinganca' } }),
    escolha('HIS-001-CAP-03-ESC-04-B', '"Eu vou contar a verdade."', 'Sua mãe assente, como quem entrega uma última receita.', { vars: { 'VAR-VERDADE': 3 }, flags: { 'PROMESSA-FAMILIA': 'verdade' } }),
    escolha('HIS-001-CAP-03-ESC-04-C', '"Eu vou viver por todos nós."', 'Sua irmã sorri pela última vez.', { vars: { 'VAR-HUMANIDADE': 3 }, flags: { 'PROMESSA-FAMILIA': 'viver', 'ANCORA-FORTE': true } }),
    escolha('HIS-001-CAP-03-ESC-04-D', '"Eu voltarei para buscar vocês."', 'Ninguém diz que é impossível.', { flags: { 'PROMESSA-FAMILIA': 'voltar', 'ROTA-FAMILIA-QUE-NAO-MORREU': true } }),
  ];
}

// ---------------------------------------------------------------------------
// Capítulo 4 — O Único Sobrevivente (7 dias nas montanhas)
// ---------------------------------------------------------------------------
const SOBREVIVENCIA = ['VAR-FOME', 'VAR-FRIO', 'VAR-FERIMENTO', 'VAR-RASTRO'];
const LIMITE = 3;

const CAPITULO_4: CapituloNarrativo = {
  numero: 4,
  titulo: 'O Único Sobrevivente',
  cenas: [
    {
      id: 'HIS-001-CAP-04-DIA-1',
      titulo: 'Dia 1 — Cinza na neve',
      meses: 0,
      montar: () => ({
        texto:
          'O canal termina num barranco coberto de raízes. Você vomita água escura e vê a fumaça da aldeia manchar o céu. **Sinos de rastreamento** soam ao longe.\n\n*Fome, Frio, Ferimento e Rastro vão pesar sobre você nos próximos sete dias. Nenhum deles mata sozinho — mas cada um cobra um preço.*',
        escolhas: [
          escolha('HIS-001-CAP-04-D1-A', 'Seguir o rio.', 'A água apaga seus rastros e congela seus ossos.', { vars: { 'VAR-RASTRO': -1, 'VAR-FRIO': 1 } }),
          escolha('HIS-001-CAP-04-D1-B', 'Subir entre as pedras.', 'Você abre distância — com as mãos em carne viva.', { vars: { 'VAR-FERIMENTO': 1 } }),
          escolha('HIS-001-CAP-04-D1-C', 'Esconder-se perto do campo para ouvir os perseguidores.', 'Você ouve: nenhuma mina foi encontrada. E ouve um nome — **Han Geng** — encarregado de caçar sobreviventes.', { vars: { 'VAR-VERDADE': 1, 'VAR-RASTRO': 1 }, flags: { 'CACADOR-HAN-GENG': true } }),
        ],
      }),
    },
    {
      id: 'HIS-001-CAP-04-DIA-2',
      titulo: 'Dia 2 — A primeira fome',
      meses: 0,
      montar: (_c, n) => {
        const mae = f(n, 'MEMORIA-NITIDA') === 'mae' || tem(n, 'CADERNO-MAE');
        const campo = f(n, 'MEMORIA-NITIDA') === 'pai' || tem(n, 'TRACO-CORPO-CAMPONES');
        return {
          texto: 'Uma raiz amarga, um pássaro morto e — talvez — o que sobrou do cache familiar. É tudo.\n\n"Vingar os mortos parecia simples enquanto eu ainda conseguia ficar de pé."',
          escolhas: [
            escolha('HIS-001-CAP-04-D2-A', 'Comer a raiz amarga.', campo ? 'Você reconhece a raiz do trabalho no campo: amarga, mas segura.' : 'A raiz mata a fome — e traz febre.', { vars: campo ? { 'VAR-FOME': -1 } : { 'VAR-FOME': -1, 'VAR-FRIO': 1 } }),
            escolha('HIS-001-CAP-04-D2-B', 'Preparar o pássaro.', mae ? 'O que sua mãe ensinou identifica o veneno na carne. Você tira a parte ruim e come o resto.' : 'A carne enche o estômago. Horas depois, a febre chega.', { vars: mae ? { 'VAR-FOME': -1 } : { 'VAR-FOME': -1, 'VAR-FERIMENTO': 1 } }),
            escolha('HIS-001-CAP-04-D2-C', 'Comer a última porção do cache familiar.', 'O gosto de casa. Você chora mastigando.', { vars: { 'VAR-FOME': -2 } }, {}, tem(n, 'CACHE-FAMILIAR') ? null : 'Exige o cache familiar'),
            escolha('HIS-001-CAP-04-D2-D', 'Não comer nada.', 'Você guarda a raiz para amanhã. O estômago não perdoa.', { vars: { 'VAR-FOME': 1 } }),
          ],
        };
      },
    },
    {
      id: 'HIS-001-CAP-04-DIA-3',
      titulo: 'Dia 3 — A noite branca',
      meses: 0,
      montar: (_c, n) => ({
        texto: 'A nevasca apaga o caminho. Se você parar, congela. Se andar, se perde.',
        escolhas: [
          {
            texto: 'Construir um abrigo com galhos e neve (Constituição).',
            teste: { atributo: 'constituicao', dificuldade: 11 },
            resultado: { texto: 'O abrigo segura o vento. Você dorme encolhido, vivo.', efeitos: { narrativa: { escolha: 'HIS-001-CAP-04-D3-A' } } },
            falha: { texto: 'O abrigo desaba duas vezes. Você passa a noite tremendo.', efeitos: { narrativa: { escolha: 'HIS-001-CAP-04-D3-A', vars: { 'VAR-FRIO': 1 } } } },
          },
          escolha('HIS-001-CAP-04-D3-B', 'Continuar caminhando para não congelar.', 'Você anda a noite inteira. Pela manhã, os pés estão feridos — mas longe.', { vars: { 'VAR-FERIMENTO': 1, 'VAR-RASTRO': -1 } }),
          escolha('HIS-001-CAP-04-D3-C', 'Queimar a prova que salvou para se aquecer.', 'O papel arde por poucos minutos. É o bastante para sobreviver — e uma acusação a menos no futuro.', { vars: { 'VAR-FRIO': -1 }, flags: { 'PROVA-SALVA': '', 'PROVA-QUEIMADA': true } }, {}, f(n, 'PROVA-SALVA') ? null : 'Exige uma prova salva'),
        ],
      }),
    },
    {
      id: 'HIS-001-CAP-04-DIA-4',
      titulo: 'Dia 4 — Cães de luz',
      meses: 0,
      montar: (_c, n) => {
        const lianAjudou = ['nome', 'prova'].includes(f(n, 'VINCULO-LIAN'));
        const armadilha = tem(n, 'TRACO-CORPO-CAMPONES') || f(n, 'MEMORIA-NITIDA') === 'pai' || tem(n, 'FACA-CARPINTEIRO');
        return {
          texto:
            `Han Geng solta ${lianAjudou ? 'duas bestas treinadas para seguir sangue — mas Lian registrou uma pista falsa, e só **uma** encontra o seu caminho' : 'duas bestas treinadas para seguir sangue'}. Você as ouve farejando entre as árvores. Uma delas se fere numa pedra e fica para trás, ganindo.`,
          escolhas: [
            escolha('HIS-001-CAP-04-D4-A', 'Poupar a besta ferida.', 'Você passa ao lado dela sem tocá-la. Ela olha para você por muito tempo. Um dia, pode reconhecê-lo.', { vars: { 'VAR-RASTRO': 1, 'VAR-FOME': 1 }, flags: { 'BESTA-AURORA': 'poupada' } }),
            escolha('HIS-001-CAP-04-D4-B', 'Matá-la para comer.', 'A fome diminui. Algo em você também.', { vars: { 'VAR-HUMANIDADE': -1, 'VAR-FOME': -2 }, flags: { 'BESTA-AURORA': 'morta' } }),
            escolha('HIS-001-CAP-04-D4-C', 'Ferir o tratador sem ser visto.', 'Um laço camponês entre duas árvores. O tratador cai gritando — e Han Geng começa a ter medo do sobrevivente.', { flags: { 'BESTA-AURORA': 'tratador', 'HAN-GENG-MEDO': true } }, {}, armadilha ? null : 'Exige um laço ou armadilha (Corpo Camponês, Mãos que Cultivam ou a faca de Tao Jun)'),
          ],
        };
      },
    },
    {
      id: 'HIS-001-CAP-04-DIA-5',
      titulo: 'Dia 5 — Febre',
      meses: 0,
      personagem: 'Mãe',
      montar: (_c, n) => ({
        texto: `A febre devolve a casa inteira por alguns minutos. Você ouve sua mãe chamando para o jantar — e a voz vem de uma ravina.\n\n"Venha comer, ${f(n, 'OBJETO-FAMILIAR') === 'tigela' ? 'sua tigela já está servida' : 'a comida está esfriando'}."`,
        escolhas: [
          escolha('HIS-001-CAP-04-D5-A', 'Tocar o objeto da família.', 'O objeto está frio e real. A casa some. A ravina aparece, a um passo dos seus pés.', {}, {}, f(n, 'OBJETO-FAMILIAR') ? null : 'Exige um objeto da família'),
          escolha('HIS-001-CAP-04-D5-B', 'Recitar os nomes dos mortos.', 'Guo Tian. Tao Wei. Avó Nai Li. Sua família. A voz para de chamar.', { vars: { 'VAR-HUMANIDADE': 1 } }),
          escolha('HIS-001-CAP-04-D5-C', 'Admitir em voz alta que eles morreram.', 'A frase dói mais que a febre. E quebra a ilusão.', { vars: { 'VAR-VONTADE': 1 } }),
          escolha('HIS-001-CAP-04-D5-D', 'Seguir a voz — só mais um pouco.', 'É tão bom estar em casa. Você acorda à beira da ravina, horas depois, com uma lembrança que não consegue mais alcançar.', { vars: { 'VAR-RASTRO': 1 }, flags: { 'MEMORIA-BLOQUEADA': true } }),
        ],
      }),
    },
    {
      id: 'HIS-001-CAP-04-DIA-6',
      titulo: 'Dia 6 — O fôlego do animal',
      meses: 0,
      montar: (_c, n) => {
        const alcancado = v(n, 'VAR-RASTRO') >= LIMITE;
        const intro =
          'Encurralado entre a patrulha e um desfiladeiro, você observa uma **raposa branca** reduzir o ritmo do próprio coração antes de atravessar a neve. Sem entender, você repete a respiração. Algo nos seus meridianos grava o padrão, esconde seu calor por três batidas — e dói até o fundo dos ossos.';
        if (!alcancado) {
          return {
            texto: `${intro}\n\nA patrulha passa a poucos passos. Ninguém vê você.`,
            escolhas: [escolha('HIS-001-CAP-04-D6-A', 'Esperar a patrulha sumir.', 'Quando o silêncio volta, você ainda está respirando como a raposa.', { flags: { 'PRIMEIRO-PADRAO-VAZIO': true } })],
          };
        }
        return {
          texto: `${intro}\n\nMas seu rastro chegou longe demais: **Han Geng** vê você do outro lado da fenda.`,
          escolhas: [
            escolha('HIS-001-CAP-04-D6-B', 'Mostrar o rosto.', 'Você o encara. Ele guarda seu rosto.', { flags: { 'PRIMEIRO-PADRAO-VAZIO': true, 'HAN-GENG-VIU': 'rosto' } }),
            escolha('HIS-001-CAP-04-D6-C', 'Prometer vingança aos gritos.', 'O eco atravessa o desfiladeiro. Han Geng sorri.', { vars: { 'VAR-FURIA': 1 }, flags: { 'PRIMEIRO-PADRAO-VAZIO': true, 'HAN-GENG-VIU': 'promessa' } }),
            escolha('HIS-001-CAP-04-D6-D', 'Permanecer imóvel.', 'Vocês se olham por um tempo longo demais.', { flags: { 'PRIMEIRO-PADRAO-VAZIO': true, 'HAN-GENG-VIU': 'imovel' } }),
          ].map((e) => ({ ...e, resultado: { ...e.resultado, texto: `${e.resultado.texto} Ele escolhe não saltar — não por misericórdia, mas porque acredita que o inverno vai terminar o serviço.` } })),
        };
      },
    },
    {
      id: 'HIS-001-CAP-04-DIA-7',
      titulo: 'Dia 7 — A boca da montanha',
      meses: 0,
      montar: (_c, n) => {
        const pior = SOBREVIVENCIA.reduce((a, b) => (v(n, b) > v(n, a) ? b : a));
        const marca = v(n, pior) >= LIMITE ? { 'VAR-FOME': 'fome', 'VAR-FRIO': 'frio', 'VAR-FERIMENTO': 'ferimento', 'VAR-RASTRO': 'rastro' }[pior] : '';
        return {
          texto:
            'A neve vira chuva negra perto de uma parede sem entrada. A batida subterrânea responde ao que você salvou e ao padrão copiado da raposa. Uma **fenda** se abre. Dentro, não há calor nem alimento — apenas pedra seca e inscrições que parecem respirar.\n\n' +
            '"Se os céus têm olhos, então olharam enquanto todos morriam. Se a terra tem coração, bebeu o sangue deles e ficou calada. Eu amaldiçoo os dois."',
          escolhas: [
            escolha('HIS-001-CAP-04-D7-A', 'Fechar os olhos.', 'Você tenta ficar acordado, perde a força e adormece abraçado ao que salvou. O som da água desaparece.\n\nQuando abre os olhos, está de pé sobre um **mar negro**.', { flags: { 'SOBREVIVENCIA-CICATRIZ': marca || 'nenhuma', 'ENTROU-CAVERNA': true } }),
          ],
        };
      },
    },
  ],
};

export const CAPITULOS_HIS001: CapituloNarrativo[] = [CAPITULO_1, CAPITULO_2, CAPITULO_3, CAPITULO_4];

const NOME_ANCORA: Record<string, string> = { casa: 'Promessa da Casa Maior', sabor: 'Sabor do Retorno', mapa: 'Mapa das Montanhas', faca: 'Faca do Carpinteiro' };
const NOME_OBJETO: Record<string, string> = { ferramenta: 'Ferramenta do pai', caderno: 'Caderno da mãe', mapa: 'Mapa da irmã', tigela: 'Tigela da família' };
const NOME_COMPETENCIA: Record<string, string> = { corpo: 'Corpo Camponês', observador: 'Observador Mortal', cicatriz: 'Cicatriz no Meridiano', memoria: 'Memória Nítida aperfeiçoada' };
const NOME_PROMESSA: Record<string, string> = { vinganca: '"Eu vou me vingar."', verdade: '"Eu vou contar a verdade."', viver: '"Eu vou viver por todos nós."', voltar: '"Eu voltarei para buscar vocês."' };

/** Marcas que o jogador vê (memórias, âncoras, objetos, promessas); números ficam ocultos. */
export const MARCAS_VISIVEIS_HIS001: ((n: N) => string | null)[] = [
  (n) => (f(n, 'MEMORIA-NITIDA') ? `Memória Nítida: ${nomeMemoria[f(n, 'MEMORIA-NITIDA')]}${f(n, 'MEMORIA-GRAU') === '2' ? ' (grau 2)' : ''}` : null),
  (n) => (f(n, 'COMPETENCIA') ? `Competência da infância: ${NOME_COMPETENCIA[f(n, 'COMPETENCIA')]}` : null),
  (n) => (f(n, 'ANCORA-FAMILIAR') ? `Âncora Familiar: ${NOME_ANCORA[f(n, 'ANCORA-FAMILIAR')]}` : null),
  (n) => (f(n, 'OBJETO-FAMILIAR') ? `Objeto da família: ${NOME_OBJETO[f(n, 'OBJETO-FAMILIAR')]}` : null),
  (n) => (f(n, 'PROMESSA-FAMILIA') ? `Promessa: ${NOME_PROMESSA[f(n, 'PROMESSA-FAMILIA')]}` : null),
  (n) => (tem(n, 'ESBOCO-SELO') ? 'Esboço do Selo' : null),
  (n) => (tem(n, 'MEDALHAO-BRONZE') ? 'Medalhão de bronze de Ren Huo' : null),
  (n) => (f(n, 'PROVA-SALVA') ? `Prova do massacre: ${{ ordem: 'a ordem original', mapa: 'o mapa (Su Moye)', lista: 'a lista de executores' }[f(n, 'PROVA-SALVA')] ?? f(n, 'PROVA-SALVA')}` : null),
  (n) => (tem(n, 'PRIMEIRO-PADRAO-VAZIO') ? 'Primeiro padrão do Vazio: a respiração da raposa' : null),
];
