// Conteúdo do seed: perfis fictícios, posts, respostas, citações e DMs.
// Os horários são relativos ao momento em que o seed roda ("h" = horas atrás), então
// o feed sempre parece recente e os "Assuntos do momento" (últimas 24h) têm conteúdo.

export type SeedReply = { by: string; text: string };

export type SeedPost = {
  text: string;
  /** horas atrás */
  h: number;
  /** ids de fotos do Picsum */
  images?: number[];
  /** aparece com o selo "Editado" */
  edited?: boolean;
  replies?: SeedReply[];
  quotes?: SeedReply[];
};

export type SeedPersona = {
  username: string;
  name: string;
  /** retrato do randomuser.me ("women/44") ou foto do Picsum (número) */
  photo: string | number;
  /** foto do Picsum para o banner */
  banner: number;
  bio: string;
  location: string;
  joinedDaysAgo: number;
  /** 1 a 5: quanto mais popular, mais seguidores e curtidas recebe */
  popularity: number;
  posts: SeedPost[];
};

export const DEMO_USERNAME = 'visitante';

export const personas: SeedPersona[] = [
  {
    username: 'marinacodes',
    name: 'Marina Costa',
    photo: 'women/44',
    banner: 0,
    bio: 'Dev front-end. React, TypeScript e café sem açúcar ☕',
    location: 'São Paulo, SP',
    joinedDaysAgo: 1240,
    popularity: 5,
    posts: [
      {
        h: 2,
        text: 'Hot take: 90% dos useEffect que eu vejo em code review não deveriam existir. Se dá pra calcular durante o render, calcula durante o render. #react',
        replies: [
          {
            by: 'lucas_ferraz',
            text: 'E os outros 10% são fetch que deveria estar no TanStack Query 😅',
          },
          {
            by: 'matheus_dev',
            text: 'Acabei de apagar 3 useEffect do meu projeto depois de ler isso. Funcionou tudo igual. Medo.',
          },
          {
            by: 'marinacodes',
            text: '@matheus_dev esse é o melhor tipo de refactor: menos código e o mesmo comportamento 👏',
          },
        ],
        quotes: [
          {
            by: 'ana_ferreira',
            text: 'Vale pra pandas também: metade dos loops que eu vejo poderiam ser uma linha vetorizada.',
          },
        ],
      },
      {
        h: 5,
        text: 'Tem coisa mais satisfatória do que ver a suíte de testes inteira ficar verde depois de um refactor grande? #react',
      },
      {
        h: 20,
        text: 'Migrei um projeto pro TypeScript strict hoje. 214 erros. Cada um deles era um bug esperando pra acontecer. #typescript',
        replies: [
          { by: 'bia_lima', text: '214 😳 quanto tempo levou?' },
          {
            by: 'marinacodes',
            text: '@bia_lima uma tarde inteira e dois cafés. Valeu cada minuto.',
          },
        ],
      },
      {
        h: 50,
        images: [3],
        text: 'Setup de hoje: notebook, café e uma lista de issues que só cresce',
      },
      {
        h: 120,
        text: 'Dica pra quem tá começando no front: aprenda bem HTML semântico e acessibilidade antes do framework da moda. O framework muda, o <button> continua sendo <button>.',
        replies: [{ by: 'matheus_dev', text: 'Salvando esse aqui 🙏' }],
      },
    ],
  },
  {
    username: 'lucas_ferraz',
    name: 'Lucas Ferraz',
    photo: 'men/32',
    banner: 1031,
    bio: 'Backend em Node e Go. Escrevo sobre bancos de dados e sistemas distribuídos.',
    location: 'Belo Horizonte, MG',
    joinedDaysAgo: 980,
    popularity: 3,
    posts: [
      {
        h: 9,
        text: 'Índice composto em (author_id, id DESC) e a query do feed caiu de 380ms pra 4ms. Às vezes performance é só ler o EXPLAIN com calma.',
        replies: [
          {
            by: 'ana_ferreira',
            text: 'EXPLAIN ANALYZE é o melhor amigo de quem trabalha com dados',
          },
          { by: 'marinacodes', text: 'Thread sobre isso quando? 👀' },
        ],
      },
      {
        h: 14,
        text: 'Deploy na sexta? Não. Nunca. Nem que a vaca tussa.',
        quotes: [
          {
            by: 'diego_mendes',
            text: 'Na startup a gente fazia deploy na sexta às 18h. Não recomendo. Aprendi do jeito difícil.',
          },
        ],
      },
      {
        h: 30,
        text: 'Paginação por OFFSET em tabela grande é uma bomba-relógio. Use cursor. Seu banco agradece.',
      },
      { h: 75, images: [60], text: 'Finalmente organizei a mesa. Durou 2 horas.' },
      {
        h: 150,
        text: 'Go ou Node pro próximo projeto? Pergunta sincera, sem guerra santa por favor',
        replies: [
          {
            by: 'marinacodes',
            text: 'Node, porque aí front e back compartilham os tipos 😌',
          },
          { by: 'matheus_dev', text: 'Go! Quero ver você sofrer com o tratamento de erro' },
          { by: 'rafa_games', text: 'Assembly. Respeite o hardware.' },
        ],
      },
    ],
  },
  {
    username: 'juliaviaja',
    name: 'Júlia Ramos',
    photo: 'women/68',
    banner: 1015,
    bio: 'Viajando o Brasil de mochila 🎒 já são 19 estados',
    location: 'Florianópolis, SC',
    joinedDaysAgo: 760,
    popularity: 4,
    posts: [
      {
        h: 4,
        images: [1018, 1036],
        text: 'Cheguei! Depois de 9 horas de ônibus e 2 de trilha, essa foi a vista. Valeu cada passo 🏔️ #viagem',
        replies: [
          { by: 'thiago_foto', text: 'Que luz! Que horas foi essa foto?' },
          {
            by: 'juliaviaja',
            text: '@thiago_foto umas 7 da manhã, ainda tinha neblina no vale',
          },
          { by: 'fernanda_eco', text: 'Lugar lindo demais 😍' },
        ],
      },
      {
        h: 22,
        images: [215],
        text: 'Praia vazia em plena terça. A vida de quem trabalha remoto tem suas vantagens 🌊 #viagem',
      },
      {
        h: 60,
        text: 'Dica de mochileira: leve sempre um saco estanque. Já salvou meu celular três vezes.',
      },
      {
        h: 100,
        images: [49],
        edited: true,
        text: 'Bate-volta de 4 dias, 3 cidades e uma quantidade irresponsável de pão de queijo. Thread com o roteiro amanhã.',
      },
      {
        h: 160,
        text: 'Qual estado vocês acham que eu deveria visitar em seguida? Faltam 8!',
        replies: [
          { by: 'gabrielsilva', text: 'Ceará! Vem conhecer Jeri' },
          {
            by: 'larissa_musica',
            text: 'Pará, sem dúvida. Vem pra Belém tomar açaí de verdade',
          },
          { by: 'fernanda_eco', text: 'Amazonas! Te levo pra ver o encontro das águas' },
        ],
      },
    ],
  },
  {
    username: 'chef_renato',
    name: 'Renato Alves',
    photo: 'men/75',
    banner: 292,
    bio: 'Cozinheiro de fim de semana. Receita boa é receita testada.',
    location: 'Salvador, BA',
    joinedDaysAgo: 530,
    popularity: 3,
    posts: [
      {
        h: 6,
        images: [292],
        text: 'Domingo é dia de moqueca. O segredo é não ter pressa e não economizar no coentro (sim, eu sei que vocês odeiam) #receita',
        replies: [
          { by: 'juliaviaja', text: 'Eu sou do time que ama coentro!' },
          { by: 'vinicius_cafe', text: 'Já tô com fome e são 10 da manhã' },
          {
            by: 'chef_renato',
            text: '@vinicius_cafe moqueca no café da manhã é permitido, eu deixo',
          },
        ],
      },
      {
        h: 18,
        text: 'Pão de fermentação natural: dia 4. O fermento se chama Kevin e está mais vivo do que eu.',
      },
      {
        h: 40,
        images: [488],
        text: 'Salada que não é triste existe. Grão-de-bico tostado, manga, castanha e limão. #receita',
      },
      {
        h: 90,
        text: 'Opinião impopular: arroz de panela de pressão fica melhor. Pode vir.',
        replies: [
          { by: 'carol_cine', text: 'Isso é crime em pelo menos 12 estados' },
          { by: 'bruno_fit', text: 'Arroz é arroz, o importante é o frango' },
        ],
      },
      {
        h: 130,
        images: [999],
        text: 'Testando fotografar a comida antes de comer. Ainda não consegui esperar mais de 30 segundos.',
      },
    ],
  },
  {
    username: 'bia_lima',
    name: 'Beatriz Lima',
    photo: 'women/21',
    banner: 526,
    bio: 'Designer de produto | UI, UX e muito Figma',
    location: 'Recife, PE',
    joinedDaysAgo: 610,
    popularity: 3,
    posts: [
      {
        h: 3,
        text: 'Alguém mais tem 47 abas do Figma abertas ou é só eu?',
        replies: [
          {
            by: 'isabela_art',
            text: '47 é pouco, você ainda tem controle da sua vida',
          },
          {
            by: 'marinacodes',
            text: 'Eu tenho 47 abas do navegador, cada uma com seu vício',
          },
        ],
      },
      {
        h: 11,
        images: [20],
        text: 'Moodboard do projeto novo. Paleta fria, tipografia grotesca e muito respiro. #design',
      },
      {
        h: 45,
        text: 'Um bom design system não é uma biblioteca de componentes. É um acordo entre pessoas. #design',
        quotes: [
          {
            by: 'marinacodes',
            text: 'E esse acordo precisa estar no código também, senão em 3 meses cada tela tem um botão diferente.',
          },
        ],
      },
      {
        h: 80,
        text: 'Contraste de 4.5:1 não é sugestão, é o mínimo. Seu cinza clarinho em fundo branco não está passando.',
      },
      {
        h: 140,
        text: 'Hoje aprendi que dá pra fazer um protótipo navegável inteiro sem uma linha de código. E também que eu não devia ter feito 84 telas.',
      },
    ],
  },
  {
    username: 'pedrohenrique',
    name: 'Pedro Henrique',
    photo: 'men/11',
    banner: 563,
    bio: 'Corredor amador 🏃 rumo à primeira maratona',
    location: 'Curitiba, PR',
    joinedDaysAgo: 340,
    popularity: 2,
    posts: [
      {
        h: 7,
        images: [563],
        text: '21 km hoje! Primeira meia maratona completa. Pace 5:42, joelho intacto e um sorriso que não sai do rosto 🏃‍♂️ #corrida',
        replies: [
          { by: 'bruno_fit', text: 'Monstro! Agora é descansar direito e hidratar' },
          { by: 'ana_ferreira', text: 'Parabéns!! Qual vai ser a próxima?' },
          {
            by: 'pedrohenrique',
            text: '@ana_ferreira a maratona de Curitiba em novembro. Deus me ajude',
          },
        ],
      },
      {
        h: 52,
        text: 'Corredor iniciante: o tênis caro não vai te fazer correr mais rápido. Consistência vai. #corrida',
      },
      { h: 110, images: [389], text: 'Treino de escada. Minhas pernas vão me processar.' },
      {
        h: 170,
        text: 'Acordei 5h pra correr e choveu. O universo mandou um sinal e eu voltei pra cama.',
      },
    ],
  },
  {
    username: 'camila_reads',
    name: 'Camila Duarte',
    photo: 'women/90',
    banner: 1073,
    bio: 'Leio uns 50 livros por ano e falo de todos aqui 📚',
    location: 'Porto Alegre, RS',
    joinedDaysAgo: 870,
    popularity: 3,
    posts: [
      {
        h: 8,
        images: [24],
        text: "Terminei 'Torto Arado' ontem à noite e ainda não sei o que fazer com meus sentimentos. Leiam. #livros",
        replies: [
          { by: 'larissa_musica', text: 'Esse livro me destruiu da melhor forma possível' },
          {
            by: 'patricia_prof',
            text: 'Adotei na minha turma do 3º ano e foi um sucesso',
          },
          { by: 'camila_reads', text: '@patricia_prof que professora incrível 🥹' },
        ],
      },
      {
        h: 23,
        text: 'Meta do ano: 50 livros. Status atual: 43. Status da minha pilha de não lidos: 61. #livros',
        quotes: [
          {
            by: 'matheus_dev',
            text: 'Meta do ano: terminar 1 livro de algoritmos. Status: capítulo 2.',
          },
        ],
      },
      {
        h: 70,
        images: [1010],
        text: 'Domingo ideal: cama, chá e um livro de 600 páginas',
      },
      {
        h: 125,
        text: 'Releitura é subestimada. Aos 30 anos, Dom Casmurro é outro livro.',
      },
      {
        h: 175,
        text: 'Kindle ou livro físico? Eu sou dos dois e me recuso a escolher',
      },
    ],
  },
  {
    username: 'thiago_foto',
    name: 'Thiago Moreira',
    photo: 'men/46',
    banner: 43,
    bio: 'Fotógrafo de rua. Luz, sombra e gente.',
    location: 'Rio de Janeiro, RJ',
    joinedDaysAgo: 1100,
    popularity: 4,
    posts: [
      {
        h: 10,
        images: [22, 57],
        text: 'Centro da cidade, 7h da manhã. A melhor luz é sempre a que ninguém acorda pra ver. #fotografia',
        replies: [
          { by: 'juliaviaja', text: 'Essa primeira foto é absurda' },
          { by: 'isabela_art', text: 'Dá vontade de desenhar essa cena' },
        ],
      },
      {
        h: 16,
        images: [320],
        text: 'Pôr do sol entre os prédios. Dois minutos depois a luz tinha ido embora. #fotografia',
      },
      {
        h: 35,
        images: [342],
        text: 'Feira de sábado. Cores, gente e gritaria. #fotografia',
      },
      {
        h: 85,
        images: [454],
        text: 'Câmera nova (usada, de 1987). Primeiro filme revelado amanhã. Ansioso.',
      },
      {
        h: 145,
        text: 'Fotografia de rua tem uma regra só: respeito. Se a pessoa não quer foto, não tem foto.',
      },
    ],
  },
  {
    username: 'ana_ferreira',
    name: 'Ana Ferreira',
    photo: 'women/33',
    banner: 1076,
    bio: 'Cientista de dados. Python, SQL e gráficos que contam histórias.',
    location: 'Campinas, SP',
    joinedDaysAgo: 690,
    popularity: 3,
    posts: [
      {
        h: 13,
        text: "Antes de treinar qualquer modelo, plote os dados. Sério. Metade dos 'insights' some quando você vê o histograma. #dados #python",
        replies: [
          {
            by: 'lucas_ferraz',
            text: 'E metade dos dados some quando você vê quantos nulos tem',
          },
          { by: 'ana_ferreira', text: '@lucas_ferraz a outra metade é duplicada 🙃' },
        ],
      },
      {
        h: 55,
        text: 'SQL é a habilidade mais subestimada em dados. Você vai usar todo santo dia. #dados',
      },
      {
        h: 95,
        images: [6],
        text: 'Sexta-feira, 17h, rodando um modelo que leva 3 horas. Vejo vocês na segunda.',
      },
      {
        h: 165,
        text: 'Gráfico de pizza com 14 fatias não é visualização, é pedido de socorro.',
      },
    ],
  },
  {
    username: 'gabrielsilva',
    name: 'Gabriel Silva',
    photo: 'men/52',
    banner: 1058,
    bio: 'Torcedor sofredor e comentarista de sofá ⚽',
    location: 'Fortaleza, CE',
    joinedDaysAgo: 450,
    popularity: 3,
    posts: [
      {
        h: 1.5,
        images: [1058],
        text: 'Estádio cheio, jogo decisivo e eu aqui só na base do coração. Bora!! ⚽ #futebol',
        replies: [
          { by: 'rafa_games', text: 'Hoje vai!' },
          {
            by: 'carol_cine',
            text: 'Me avisa se ganhar que aí eu finjo que acompanhei',
          },
        ],
      },
      {
        h: 12,
        text: 'O VAR demorou 6 minutos pra decidir um lance que todo mundo viu em casa em 2 segundos. #futebol',
        replies: [{ by: 'bruno_fit', text: 'Pior que isso só o juiz que nem foi olhar' }],
      },
      {
        h: 19,
        text: 'Torcer pro meu time é aprender a lidar com frustração desde cedo. Melhor terapia que existe. #futebol',
      },
      {
        h: 120,
        text: 'Escalação dos sonhos: o goleiro de 2005, a zaga de 2012 e o ataque que eu ainda espero ver.',
      },
    ],
  },
  {
    username: 'larissa_musica',
    name: 'Larissa Nunes',
    photo: 'women/57',
    banner: 1082,
    bio: 'Violonista e professora de música 🎸',
    location: 'Belém, PA',
    joinedDaysAgo: 400,
    popularity: 2,
    posts: [
      {
        h: 15,
        images: [145],
        text: 'Violão novo chegou! Já tô com os dedos doendo e não consigo parar de tocar 🎸 #musica',
      },
      {
        h: 48,
        text: 'Aula de hoje: um aluno de 8 anos tocou a primeira música completa. Professora de música vive dessas coisas. #musica',
        replies: [{ by: 'patricia_prof', text: 'Esses momentos fazem tudo valer a pena 🥰' }],
      },
      { h: 100, images: [452], text: 'Show ontem. Ainda sem voz.' },
      {
        h: 155,
        text: 'Playlist pra estudar: só choro e bossa nova. Aceito sugestões.',
        replies: [
          { by: 'vinicius_cafe', text: 'Pixinguinha no repeat. Vai por mim' },
          { by: 'camila_reads', text: 'Uso a mesma pra ler!' },
        ],
      },
    ],
  },
  {
    username: 'rafa_games',
    name: 'Rafael Souza',
    photo: 'men/22',
    banner: 274,
    bio: 'Jogo de tudo um pouco. Streams às quartas 🎮',
    location: 'Goiânia, GO',
    joinedDaysAgo: 300,
    popularity: 2,
    posts: [
      {
        h: 21,
        text: 'Zerei o jogo em 62 horas. Agora vou começar de novo no difícil porque eu claramente odeio a mim mesmo #games',
      },
      {
        h: 58,
        text: 'Stream hoje às 21h! Vamos tentar vencer o chefe que me humilhou semana passada #games',
      },
      {
        h: 105,
        text: 'Jogos indie estão carregando a indústria nas costas e ninguém me convence do contrário',
        quotes: [
          {
            by: 'isabela_art',
            text: 'E muitos com a arte inteira feita por uma pessoa só. Respeito máximo.',
          },
        ],
      },
      {
        h: 180,
        text: 'Meu backlog na Steam tem 140 jogos. Comprei mais 2 na promoção. Socorro.',
      },
    ],
  },
  {
    username: 'fernanda_eco',
    name: 'Fernanda Rocha',
    photo: 'women/12',
    banner: 1039,
    bio: 'Bióloga. Falo de clima, bichos e plantas 🌱',
    location: 'Manaus, AM',
    joinedDaysAgo: 560,
    popularity: 2,
    posts: [
      {
        h: 17,
        images: [1024],
        text: 'Avistamento de hoje no trabalho de campo: um gavião enorme. Fiquei 10 minutos sem respirar. #natureza',
      },
      {
        h: 44,
        text: 'Plantar árvore é ótimo. Proteger a floresta que já está de pé é ainda melhor. As duas coisas, por favor. #clima',
      },
      {
        h: 115,
        images: [400],
        text: 'Viveiro de mudas nativas pronto pra temporada de chuva 🌱',
      },
      {
        h: 168,
        text: 'Sim, as abelhas nativas sem ferrão existem e são incríveis. Thread? 🐝',
        replies: [
          { by: 'camila_reads', text: 'Thread sim, por favor!' },
          { by: 'juliaviaja', text: 'Quero!' },
        ],
      },
    ],
  },
  {
    username: 'diego_mendes',
    name: 'Diego Mendes',
    photo: 'men/64',
    banner: 513,
    bio: 'Empreendedor, 2 startups e muitos erros. Compartilho o que aprendi.',
    location: 'São Paulo, SP',
    joinedDaysAgo: 1400,
    popularity: 4,
    posts: [
      {
        h: 21.5,
        text: 'Lição de 2 startups: o problema quase nunca é a tecnologia. É falar com cliente de menos e construir coisa demais. #startups',
        replies: [
          {
            by: 'bia_lima',
            text: 'Isso aqui deveria ser tatuado na testa de todo PM',
          },
          {
            by: 'lucas_ferraz',
            text: 'E quando é a tecnologia, geralmente é porque escolheram a mais nova e não a mais chata',
          },
        ],
      },
      {
        h: 62,
        text: 'Contrate pessoas melhores do que você e saia da frente. Parece fácil, é a coisa mais difícil que existe.',
      },
      {
        h: 140,
        images: [1],
        text: "Escritório novo. Por 'escritório' entenda: minha cozinha com uma luz melhor.",
      },
      {
        h: 190,
        text: 'MVP não é produto ruim. É o menor produto que testa a hipótese mais arriscada.',
      },
    ],
  },
  {
    username: 'isabela_art',
    name: 'Isabela Martins',
    photo: 'women/29',
    banner: 464,
    bio: 'Ilustradora. Encomendas abertas ✏️',
    location: 'Niterói, RJ',
    joinedDaysAgo: 480,
    popularity: 2,
    posts: [
      {
        h: 25,
        images: [464],
        text: 'Página do sketchbook de hoje. Treinando mãos, que continuam sendo minha nêmesis ✏️ #arte',
      },
      {
        h: 66,
        text: 'Encomendas abertas pra novembro! 3 vagas. Retratos, pets e capas. Chamem na DM 💌',
      },
      {
        h: 130,
        images: [528],
        text: 'Bancada organizada. Durou o tempo de tirar essa foto.',
      },
      {
        h: 185,
        text: 'Artista iniciante: copiar referência pra estudar não é trapaça. É assim que todo mundo aprende.',
      },
    ],
  },
  {
    username: 'matheus_dev',
    name: 'Matheus Oliveira',
    photo: 'men/85',
    banner: 180,
    bio: 'Estudando programação de madrugada. Júnior em construção 🚧',
    location: 'Natal, RN',
    joinedDaysAgo: 120,
    popularity: 1,
    posts: [
      {
        h: 2.5,
        text: 'Primeiro PR aceito em projeto open source!!! Era só corrigir um typo na documentação, mas EU CONTO COMO VITÓRIA 🎉',
        replies: [
          { by: 'marinacodes', text: 'Conta sim! Todo mundo começa assim 👏' },
          { by: 'lucas_ferraz', text: 'Parabéns! Agora vicia' },
          { by: 'diego_mendes', text: 'Esse é o começo de tudo. Bora!' },
        ],
      },
      {
        h: 30,
        text: 'Dia 87 estudando programação: hoje entendi closure. Amanhã provavelmente esqueço.',
      },
      {
        h: 77,
        text: 'Alguém tem dica de projeto pra portfólio que não seja lista de tarefas?',
        replies: [
          {
            by: 'marinacodes',
            text: 'Faz um clone de alguma rede social. Você aprende auth, banco, tempo real, upload… tudo',
          },
          {
            by: 'bia_lima',
            text: 'Faz algo que resolva um problema seu. Fica muito mais fácil de explicar na entrevista',
          },
        ],
      },
      {
        h: 135,
        text: 'Programar de madrugada é ótimo até você abrir o código de manhã e não entender nada',
      },
    ],
  },
  {
    username: 'carol_cine',
    name: 'Carolina Pires',
    photo: 'women/79',
    banner: 274,
    bio: 'Cinema, séries e opiniões que ninguém pediu 🎬',
    location: 'Brasília, DF',
    joinedDaysAgo: 820,
    popularity: 3,
    posts: [
      {
        h: 3.5,
        text: 'Saí do cinema agora e precisava contar pra alguém: que filme. Que trilha. Que final. Sem spoilers, só vão. #cinema',
        replies: [
          { by: 'rafa_games', text: 'Qual filme?? Não deixa a gente assim' },
          {
            by: 'carol_cine',
            text: '@rafa_games o que todo mundo tá comentando 👀 vai sem saber nada',
          },
        ],
      },
      {
        h: 4.5,
        text: 'Pergunta pra @visitante e pra todo mundo que chegou agora: qual foi o último filme que vocês viram no cinema? #cinema',
      },
      {
        h: 28,
        text: 'Série com 8 episódios de 1 hora > série com 22 episódios de enrolação. #séries',
      },
      {
        h: 82,
        text: 'Reassistindo um clássico dos anos 90 e percebendo que o vilão tinha razão o tempo todo #cinema',
      },
      {
        h: 150,
        text: 'Minha opinião sobre aquele final polêmico: era o único final possível. Podem me xingar nas respostas.',
        replies: [
          { by: 'gabrielsilva', text: 'Discordo com todas as forças' },
          { by: 'camila_reads', text: 'Concordo! O livro também termina assim' },
        ],
      },
    ],
  },
  {
    username: 'bruno_fit',
    name: 'Bruno Cardoso',
    photo: 'men/41',
    banner: 1035,
    bio: 'Personal trainer. Treino bom é treino feito 💪',
    location: 'Vitória, ES',
    joinedDaysAgo: 650,
    popularity: 2,
    posts: [
      {
        h: 9.5,
        text: 'Lembrete: ninguém precisa treinar perfeito. Precisa treinar. #treino',
      },
      {
        h: 46,
        text: 'Agachamento é o exercício mais honesto que existe: ou você faz, ou não faz. #treino',
      },
      {
        h: 120,
        text: 'Proteína é importante, mas dormir 8 horas faz mais pelo seu resultado do que qualquer suplemento.',
      },
      {
        h: 175,
        text: 'Aluno perguntou se podia pular o dia de perna. Não respondi. Só olhei.',
        replies: [{ by: 'pedrohenrique', text: 'Esse olhar eu conheço 😂' }],
      },
    ],
  },
  {
    username: 'patricia_prof',
    name: 'Patrícia Gomes',
    photo: 'women/8',
    banner: 119,
    bio: 'Professora de matemática do ensino médio. Sim, vai cair na prova.',
    location: 'João Pessoa, PB',
    joinedDaysAgo: 720,
    popularity: 2,
    posts: [
      {
        h: 27,
        text: "Aluno: 'Pra que serve matemática?' Eu: abro a fatura do cartão dele de exemplo na aula de juros compostos. Silêncio na sala. #matematica",
        replies: [
          { by: 'diego_mendes', text: 'Melhor aula de educação financeira que existe' },
          { by: 'ana_ferreira', text: 'Professora do ano' },
        ],
      },
      {
        h: 70,
        text: 'Corrigindo 120 provas. Se alguém me ver chorando na padaria, é normal.',
      },
      {
        h: 160,
        text: 'A melhor coisa de ensinar é quando o aluno explica pro colega e fica melhor que a minha explicação.',
      },
    ],
  },
  {
    username: 'vinicius_cafe',
    name: 'Vinícius Araújo',
    photo: 'men/18',
    banner: 425,
    bio: 'Barista e torrador de café. Pergunte sobre métodos de preparo ☕',
    location: 'Sul de Minas, MG',
    joinedDaysAgo: 590,
    popularity: 3,
    posts: [
      {
        h: 1,
        text: 'Café coado na V60, 15g pra 250ml, água a 92°C. Bom dia pra quem respeita a proporção ☕ #café',
        replies: [
          { by: 'marinacodes', text: "Eu boto 'uma colher bem cheia'. Desculpa." },
          { by: 'vinicius_cafe', text: '@marinacodes a gente trabalha com o que tem 😂' },
        ],
      },
      {
        h: 13.5,
        images: [431],
        text: 'Latte art de hoje. Pelo menos dá pra ver que é uma folha. #café',
      },
      {
        h: 21,
        images: [1060],
        text: 'Torra nova chegando: um natural do Sul de Minas com notas de caramelo e frutas amarelas. Cheiro de casa. #café',
        quotes: [
          {
            by: 'chef_renato',
            text: 'Já quero pra servir com o bolo de fubá de domingo',
          },
        ],
      },
      {
        h: 98,
        text: 'Café de supermercado não é crime. Mas experimenta um especial uma vez só, por mim.',
      },
    ],
  },
];

/** Conta de visitante: o botão "Entrar como visitante" da landing loga nela. */
export const demoPersona: SeedPersona = {
  username: DEMO_USERNAME,
  name: 'Visitante',
  photo: 1025,
  banner: 1043,
  bio: 'Conta de demonstração 👋 Fique à vontade: curta, poste, responda e mande mensagens.',
  location: 'Internet',
  joinedDaysAgo: 40,
  popularity: 3,
  posts: [
    {
      h: 6,
      text: 'Testando o tema escuro dessa rede. Aprovado 🌙',
      quotes: [
        {
          by: 'bia_lima',
          text: 'Tema escuro bem feito é aquele que não é só preto puro. Esse tá bom mesmo.',
        },
      ],
    },
    {
      h: 31,
      text: 'Oi, pessoal! Primeira vez por aqui 👋 Me recomendem perfis bons pra seguir',
      replies: [
        {
          by: 'marinacodes',
          text: 'Bem-vindo(a)! Segue a @juliaviaja, as fotos de viagem dela são incríveis',
        },
        { by: 'vinicius_cafe', text: 'Se gostar de café, você tá no lugar certo ☕' },
        { by: 'thiago_foto', text: 'Seja bem-vindo(a)!' },
      ],
    },
    {
      h: 50,
      text: 'Todo café da manhã fica melhor com pão de queijo. Não aceito discordância.',
      replies: [
        { by: 'chef_renato', text: 'Todo café da manhã, almoço e janta' },
        { by: 'juliaviaja', text: 'Concordo e assino embaixo' },
      ],
    },
  ],
};

/** Quem a conta demo segue e quem segue a conta demo (notificações de "seguiu você"). */
export const demoFollows = [
  'marinacodes',
  'juliaviaja',
  'thiago_foto',
  'chef_renato',
  'vinicius_cafe',
  'camila_reads',
  'carol_cine',
  'gabrielsilva',
  'bia_lima',
  'diego_mendes',
  'lucas_ferraz',
  'larissa_musica',
];
export const demoFollowers = [
  'marinacodes',
  'juliaviaja',
  'vinicius_cafe',
  'thiago_foto',
  'chef_renato',
  'bia_lima',
  'carol_cine',
  'matheus_dev',
  'isabela_art',
];

export type SeedMessage = {
  /** true = mensagem enviada pela conta demo */
  fromDemo?: boolean;
  text?: string;
  image?: number;
  /** minutos atrás */
  m: number;
};

/** Conversas da conta demo. `read`: a demo já leu tudo (senão as últimas ficam como não lidas). */
export const demoConversations: { with: string; read: boolean; messages: SeedMessage[] }[] = [
  {
    with: 'marinacodes',
    read: false,
    messages: [
      { m: 190, text: 'Oi! Vi que você chegou agora por aqui 👋' },
      { m: 189, text: 'Se tiver qualquer dúvida sobre como as coisas funcionam, é só chamar' },
      { fromDemo: true, m: 120, text: 'Valeu, Marina! Ainda tô explorando' },
      { m: 25, text: 'Dica: dá uma olhada no tema escuro, ficou muito bom 😎' },
    ],
  },
  {
    with: 'chef_renato',
    read: false,
    messages: [
      { m: 75, text: 'Sobremesa de hoje: iogurte, morango e granola caseira' },
      { m: 74, image: 493 },
      { m: 73, text: 'Se quiser a receita da granola, te mando' },
    ],
  },
  {
    with: 'juliaviaja',
    read: true,
    messages: [
      { m: 2900, text: 'Obrigada por seguir! Já foi pra Floripa?' },
      { fromDemo: true, m: 2860, text: 'Ainda não! Alguma dica?' },
      {
        m: 2850,
        text: 'Lagoinha do Leste. Trilha de 1h30, mas a praia vale cada minuto',
      },
      { m: 2849, image: 1043 },
      { fromDemo: true, m: 2700, text: 'Anotado! Obrigado(a) 🙌' },
    ],
  },
  {
    with: 'thiago_foto',
    read: true,
    messages: [
      { m: 4300, text: 'Obrigado por curtir as fotos! 📷' },
      { fromDemo: true, m: 4200, text: 'São muito boas! Você usa que câmera?' },
      {
        m: 4100,
        text: 'Uma analógica de 1987 e o celular. A melhor câmera é a que tá com você 😄',
      },
    ],
  },
];
