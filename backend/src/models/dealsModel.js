const UserModel = require('./userModel');

let alertasPreco = [
  {
    id: 'alerta-1',
    produtoId: 'iphone-15',
    produtoNome: 'Apple iPhone 15 128GB',
    precoAtual: 4599.00,
    precoAlvo: 4299.00,
    economiaEsperada: 300.00,
    horasPoupadasEsperadas: 13.7,
    criadoEm: new Date(Date.now() - 86400000 * 3).toISOString(),
    atingido: false
  },
  {
    id: 'alerta-2',
    produtoId: 'galaxy-s24',
    produtoNome: 'Samsung Galaxy S24 128GB',
    precoAtual: 3899.00,
    precoAlvo: 3599.00,
    economiaEsperada: 300.00,
    horasPoupadasEsperadas: 13.7,
    criadoEm: new Date(Date.now() - 86400000 * 1).toISOString(),
    atingido: false
  }
];

const CATALOGO_BENCHMARKS = [
  {
    termo: 'iphone 15',
    termoBuscaLoja: 'Apple iPhone 15 128GB',
    nome: 'Apple iPhone 15 (128 GB) - Tela 6.1 pol',
    categoria: 'Smartphones',
    imagem: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&q=80',
    lojas: [
      {
        loja: 'Mercado Livre Oficial',
        preco: 4599.00,
        precoCheio: 5299.00,
        cupom: 'APP100'
      },
      {
        loja: 'Amazon Brasil',
        preco: 4699.00,
        precoCheio: 5399.00,
        cupom: 'PRIME100'
      },
      {
        loja: 'Magazine Luiza',
        preco: 4799.00,
        precoCheio: 5499.00,
        cupom: 'MAGALU50'
      }
    ]
  },
  {
    termo: 'galaxy s24',
    termoBuscaLoja: 'Samsung Galaxy S24 128GB',
    nome: 'Samsung Galaxy S24 5G (128 GB) - Tela 6.2 pol',
    categoria: 'Smartphones',
    imagem: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&q=80',
    lojas: [
      {
        loja: 'Mercado Livre Oficial',
        preco: 3899.00,
        precoCheio: 4599.00,
        cupom: 'GALAXY100'
      },
      {
        loja: 'Amazon Brasil',
        preco: 3999.00,
        precoCheio: 4699.00,
        cupom: 'PRIME80'
      },
      {
        loja: 'Magazine Luiza',
        preco: 4099.00,
        precoCheio: 4799.00,
        cupom: 'MAGASAMSUNG'
      }
    ]
  },
  {
    termo: 'playstation 5',
    termoBuscaLoja: 'PlayStation 5 Slim Digital',
    nome: 'Console PlayStation 5 Slim Edicao Digital',
    categoria: 'Games',
    imagem: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&q=80',
    lojas: [
      {
        loja: 'Kabum',
        preco: 3399.00,
        precoCheio: 3899.00,
        cupom: 'KABUMPS5'
      },
      {
        loja: 'Amazon Brasil',
        preco: 3499.00,
        precoCheio: 3999.00,
        cupom: 'GAMES100'
      },
      {
        loja: 'Mercado Livre Oficial',
        preco: 3549.00,
        precoCheio: 4049.00,
        cupom: 'PLAY80'
      }
    ]
  },
  {
    termo: 'nintendo switch',
    termoBuscaLoja: 'Nintendo Switch OLED',
    nome: 'Console Nintendo Switch OLED 64GB - Branco',
    categoria: 'Games',
    imagem: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500&q=80',
    lojas: [
      {
        loja: 'Mercado Livre Oficial',
        preco: 2099.00,
        precoCheio: 2499.00,
        cupom: 'NINTENDO80'
      },
      {
        loja: 'Amazon Brasil',
        preco: 2149.00,
        precoCheio: 2549.00,
        cupom: 'SWITCH50'
      },
      {
        loja: 'Magazine Luiza',
        preco: 2199.00,
        precoCheio: 2599.00,
        cupom: 'MAGANINTENDO'
      }
    ]
  },
  {
    termo: 'notebook dell',
    termoBuscaLoja: 'Notebook Dell Inspiron 15 i5 16GB 512GB',
    nome: 'Notebook Dell Inspiron 15 (Intel Core i5, 16GB, 512GB SSD)',
    categoria: 'Informatica',
    imagem: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&q=80',
    lojas: [
      {
        loja: 'Dell',
        preco: 3199.00,
        precoCheio: 3799.00,
        cupom: 'DELL100'
      },
      {
        loja: 'Amazon Brasil',
        preco: 3299.00,
        precoCheio: 3899.00,
        cupom: 'PRIME50'
      },
      {
        loja: 'Mercado Livre Oficial',
        preco: 3349.00,
        precoCheio: 3949.00,
        cupom: 'TECH80'
      }
    ]
  },
  {
    termo: 'macbook air',
    termoBuscaLoja: 'MacBook Air M2 256GB',
    nome: 'Apple MacBook Air 13 pol Chip M2 8GB RAM 256GB SSD',
    categoria: 'Informatica',
    imagem: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
    lojas: [
      {
        loja: 'Mercado Livre Oficial',
        preco: 6699.00,
        precoCheio: 7699.00,
        cupom: 'MACBOOK150'
      },
      {
        loja: 'Amazon Brasil',
        preco: 6899.00,
        precoCheio: 7899.00,
        cupom: 'APPLE100'
      },
      {
        loja: 'Magazine Luiza',
        preco: 7099.00,
        precoCheio: 8099.00,
        cupom: 'MAGALU100'
      }
    ]
  },
  {
    termo: 'airpods pro',
    termoBuscaLoja: 'AirPods Pro 2 USB-C',
    nome: 'Apple AirPods Pro (2a Geracao) com Estojo USB-C',
    categoria: 'Audio',
    imagem: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&q=80',
    lojas: [
      {
        loja: 'Amazon Brasil',
        preco: 1799.00,
        precoCheio: 2199.00,
        cupom: 'AIRPODS50'
      },
      {
        loja: 'Mercado Livre Oficial',
        preco: 1849.00,
        precoCheio: 2249.00,
        cupom: 'PRO50'
      },
      {
        loja: 'Magazine Luiza',
        preco: 1899.00,
        precoCheio: 2299.00,
        cupom: 'MAGAAPPLE'
      }
    ]
  },
  {
    termo: 'fone sony',
    termoBuscaLoja: 'Sony WH-1000XM4',
    nome: 'Fone Sony WH-1000XM4 com Cancelamento de Ruido',
    categoria: 'Audio',
    imagem: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    lojas: [
      {
        loja: 'Amazon Brasil',
        preco: 1649.00,
        precoCheio: 1999.00,
        cupom: 'SONY100'
      },
      {
        loja: 'Mercado Livre Oficial',
        preco: 1699.00,
        precoCheio: 2049.00,
        cupom: 'AUDIO80'
      },
      {
        loja: 'Kabum',
        preco: 1749.00,
        precoCheio: 2099.00,
        cupom: 'KABUMAUDIO'
      }
    ]
  },
  {
    termo: 'smart tv lg',
    termoBuscaLoja: 'Smart TV LG 50 4K',
    nome: 'Smart TV LG 50 Polegadas 4K UHD ThinQ AI',
    categoria: 'Eletronicos',
    imagem: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&q=80',
    lojas: [
      {
        loja: 'Magazine Luiza',
        preco: 2199.00,
        precoCheio: 2599.00,
        cupom: 'MAGATV50'
      },
      {
        loja: 'Mercado Livre Oficial',
        preco: 2249.00,
        precoCheio: 2649.00,
        cupom: 'TV80'
      },
      {
        loja: 'Amazon Brasil',
        preco: 2299.00,
        precoCheio: 2699.00,
        cupom: 'PRIMETV'
      }
    ]
  },
  {
    termo: 'tenis nike',
    termoBuscaLoja: 'Tenis Nike Air Max SC Masculino',
    nome: 'Tenis Nike Air Max SC Masculino - Conforto e Casual',
    categoria: 'Moda',
    imagem: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    lojas: [
      {
        loja: 'Mercado Livre Oficial',
        preco: 349.90,
        precoCheio: 449.90,
        cupom: 'NIKE40'
      },
      {
        loja: 'Amazon Brasil',
        preco: 369.90,
        precoCheio: 469.90,
        cupom: 'MODA30'
      },
      {
        loja: 'Magazine Luiza',
        preco: 389.90,
        precoCheio: 489.90,
        cupom: 'MAGANIKEE'
      }
    ]
  },
  {
    termo: 'air fryer',
    termoBuscaLoja: 'Fritadeira Air Fryer Mondial 4L',
    nome: 'Fritadeira Eletrica Air Fryer Mondial 4L Family',
    categoria: 'Eletroportateis',
    imagem: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&q=80',
    lojas: [
      {
        loja: 'Magazine Luiza',
        preco: 219.00,
        precoCheio: 299.00,
        cupom: 'AIRFRYER20'
      },
      {
        loja: 'Amazon Brasil',
        preco: 229.00,
        precoCheio: 309.00,
        cupom: 'COZINHA15'
      },
      {
        loja: 'Mercado Livre Oficial',
        preco: 239.00,
        precoCheio: 319.00,
        cupom: 'CASA20'
      }
    ]
  },
  {
    termo: 'kindle',
    termoBuscaLoja: 'Kindle 11 Geracao 16GB',
    nome: 'Kindle 11a Geracao 16GB Tela 6 pol antirreflexo',
    categoria: 'E-readers',
    imagem: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80',
    lojas: [
      {
        loja: 'Amazon Brasil',
        preco: 449.00,
        precoCheio: 499.00,
        cupom: 'KINDLE20'
      },
      {
        loja: 'Mercado Livre Oficial',
        preco: 479.00,
        precoCheio: 529.00,
        cupom: 'LIVROS20'
      },
      {
        loja: 'Magazine Luiza',
        preco: 499.00,
        precoCheio: 549.00,
        cupom: 'MAGALER'
      }
    ]
  },
  {
    termo: 'echo dot',
    termoBuscaLoja: 'Echo Dot 5 Geracao Alexa',
    nome: 'Echo Dot 5a Geracao Smart Speaker com Alexa',
    categoria: 'Smart Home',
    imagem: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=500&q=80',
    lojas: [
      {
        loja: 'Amazon Brasil',
        preco: 379.00,
        precoCheio: 429.00,
        cupom: 'ALEXA30'
      },
      {
        loja: 'Mercado Livre Oficial',
        preco: 399.00,
        precoCheio: 449.00,
        cupom: 'SMART20'
      },
      {
        loja: 'Magazine Luiza',
        preco: 419.00,
        precoCheio: 469.00,
        cupom: 'MAGASMART'
      }
    ]
  }
];

class DealsModel {
  resolverLinkLoja(lojaNome, termoQueryLimpo) {
    const termoQuery = encodeURIComponent(termoQueryLimpo || '');
    const lower = (lojaNome || '').toLowerCase();

    if (lower.includes('amazon')) {
      return 'https://www.amazon.com.br/s?k=' + termoQuery + '&i=aps';
    }
    if (lower.includes('mercado livre')) {
      return 'https://lista.mercadolivre.com.br/' + termoQuery + '_ITEM*CONDITION_2230284_NoIndex_True';
    }
    if (lower.includes('magalu') || lower.includes('magazine')) {
      return 'https://www.magazineluiza.com.br/busca/' + termoQuery + '/';
    }
    if (lower.includes('kabum')) {
      return 'https://www.kabum.com.br/busca/' + termoQuery;
    }
    if (lower.includes('dell')) {
      return 'https://www.dell.com/pt-br/search/' + termoQuery;
    }
    return 'https://www.google.com/search?tbm=shop&hl=pt-BR&gl=br&q=' + termoQuery;
  }

  estimarPrecoPorCategoria(termo) {
    const t = termo.toLowerCase();
    if (t.includes('geladeira') || t.includes('refrigerador')) return 2799.00;
    if (t.includes('fogao') || t.includes('cooktop')) return 899.00;
    if (t.includes('microondas') || t.includes('micro-ondas')) return 549.00;
    if (t.includes('lavadora') || t.includes('maquina de lavar')) return 1999.00;
    if (t.includes('ar condicionado')) return 2299.00;
    if (t.includes('tv') || t.includes('televisao') || t.includes('smart tv')) return 2199.00;
    if (t.includes('iphone 15')) return 4599.00;
    if (t.includes('iphone 14')) return 3899.00;
    if (t.includes('iphone 13')) return 3399.00;
    if (t.includes('iphone 12')) return 2799.00;
    if (t.includes('iphone 11')) return 2099.00;
    if (t.includes('galaxy') || t.includes('motorola') || t.includes('xiaomi') || t.includes('celular') || t.includes('smartphone')) return 1799.00;
    if (t.includes('notebook') || t.includes('laptop')) return 2999.00;
    if (t.includes('monitor')) return 849.00;
    if (t.includes('xbox')) return 2599.00;
    if (t.includes('playstation') || t.includes('ps4')) return 2099.00;
    if (t.includes('ipad') || t.includes('tablet')) return 2999.00;
    if (t.includes('smartwatch') || t.includes('relogio')) return 499.00;
    if (t.includes('fone') || t.includes('headset') || t.includes('earbuds')) return 249.00;
    if (t.includes('teclado') || t.includes('mouse')) return 179.00;
    if (t.includes('tenis') || t.includes('sapato')) return 349.00;
    if (t.includes('livro')) return 49.90;
    return 349.00;
  }

  buscarOfertas(query, valorHoraInformado) {
    const termoBusca = (query || '').toLowerCase().trim();
    let perfil;
    try {
      perfil = UserModel.getProfile();
    } catch (e) {
      perfil = { valorHora: 21.88, salario: 3500 };
    }
    const valorHora = Number(valorHoraInformado) || Number(perfil.valorHora) || 21.88;

    let produtosEncontrados = [];

    if (termoBusca) {
      produtosEncontrados = CATALOGO_BENCHMARKS.filter(item => {
        const palavrasTermo = termoBusca.split(/\s+/);
        const textoCompleto = item.termo + ' ' + item.nome.toLowerCase() + ' ' + item.categoria.toLowerCase();
        return palavrasTermo.every(palavra => textoCompleto.includes(palavra));
      });

      if (produtosEncontrados.length === 0) {
        produtosEncontrados = CATALOGO_BENCHMARKS.filter(item => {
          const palavrasTermo = termoBusca.split(/\s+/);
          const textoCompleto = item.termo + ' ' + item.nome.toLowerCase();
          return palavrasTermo.some(palavra => palavra.length > 2 && textoCompleto.includes(palavra));
        });
      }
    }

    if (produtosEncontrados.length === 0 && termoBusca) {
      produtosEncontrados = [this.gerarOfertaDinamica(query)];
    } else if (!termoBusca) {
      produtosEncontrados = CATALOGO_BENCHMARKS;
    }

    return produtosEncontrados.map(prod => this.formatarAnaliseProduto(prod, valorHora));
  }

  getDestaques(valorHoraInformado) {
    let perfil;
    try {
      perfil = UserModel.getProfile();
    } catch (e) {
      perfil = { valorHora: 21.88, salario: 3500 };
    }
    const valorHora = Number(valorHoraInformado) || Number(perfil.valorHora) || 21.88;

    return CATALOGO_BENCHMARKS.map(prod => this.formatarAnaliseProduto(prod, valorHora));
  }

  gerarOfertaDinamica(termo) {
    const nomeFormatado = termo.charAt(0).toUpperCase() + termo.slice(1);
    const precoBase = this.estimarPrecoPorCategoria(termo);
    const precoML = Number((precoBase * 0.94).toFixed(2));
    const precoAmazon = Number(precoBase.toFixed(2));
    const precoMagalu = Number((precoBase * 1.07).toFixed(2));

    return {
      termo: termo.toLowerCase(),
      termoBuscaLoja: termo,
      nome: nomeFormatado + ' (Ofertas em Lojas Virtuais)',
      categoria: 'Ofertas em Lojas Virtuais',
      imagem: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80',
      lojas: [
        {
          loja: 'Mercado Livre Oficial',
          preco: precoML,
          precoCheio: Number((precoML * 1.20).toFixed(2)),
          cupom: 'APP20'
        },
        {
          loja: 'Amazon Brasil',
          preco: precoAmazon,
          precoCheio: Number((precoAmazon * 1.25).toFixed(2)),
          cupom: 'PRIME10'
        },
        {
          loja: 'Magazine Luiza',
          preco: precoMagalu,
          precoCheio: Number((precoMagalu * 1.15).toFixed(2)),
          cupom: 'MAGALU5'
        }
      ]
    };
  }

  formatarAnaliseProduto(prod, valorHora) {
    const termoBuscaEfetivo = prod.termoBuscaLoja || prod.nome;
    const linkGoogleShopping = 'https://www.google.com/search?tbm=shop&hl=pt-BR&gl=br&q=' + encodeURIComponent(termoBuscaEfetivo);

    const lojasFormatadas = prod.lojas.map(l => {
      const linkVerificado = this.resolverLinkLoja(l.loja, termoBuscaEfetivo);
      return {
        ...l,
        link: linkVerificado,
        linkGoogleShopping: linkGoogleShopping,
        parcelamento: '10x de R$ ' + (l.preco / 10).toFixed(2) + ' sem juros',
        horasSuor: Number((l.preco / valorHora).toFixed(1))
      };
    });

    const lojasOrdenadas = [...lojasFormatadas].sort((a, b) => a.preco - b.preco);
    const melhorOferta = lojasOrdenadas[0];
    const piorOferta = lojasOrdenadas[lojasOrdenadas.length - 1];

    const economiaReais = Number((piorOferta.preco - melhorOferta.preco).toFixed(2));
    const horasPoupadas = Number((economiaReais / valorHora).toFixed(1));
    const diasPoupados = Number((horasPoupadas / 8).toFixed(1));

    const taxaCashback = 0.04;
    const valorCashback = Number((melhorOferta.preco * taxaCashback).toFixed(2));
    const percentualDesconto = Number((((melhorOferta.precoCheio - melhorOferta.preco) / melhorOferta.precoCheio) * 100).toFixed(0));
    const horasTrabalhoMelhorPreco = Number((melhorOferta.preco / valorHora).toFixed(1));

    return {
      id: prod.termo.replace(/\s+/g, '-'),
      nome: prod.nome,
      categoria: prod.categoria,
      termoBuscaLoja: termoBuscaEfetivo,
      imagem: prod.imagem,
      melhorPreco: melhorOferta.preco,
      lojaMelhorPreco: melhorOferta.loja,
      linkMelhorPreco: melhorOferta.link,
      linkGoogleShopping: linkGoogleShopping,
      cupomMelhorPreco: melhorOferta.cupom,
      parcelamentoMelhorPreco: melhorOferta.parcelamento,
      precoMaisAlto: piorOferta.preco,
      economiaReais: economiaReais,
      horasPoupadas: horasPoupadas,
      diasPoupados: diasPoupados,
      horasTrabalhoNecessarias: horasTrabalhoMelhorPreco,
      taxaCashbackPercentual: 4,
      valorCashback: valorCashback,
      percentualDesconto: percentualDesconto,
      todasLojas: lojasOrdenadas.map(l => ({
        ...l,
        isMelhorPreco: l.loja === melhorOferta.loja
      }))
    };
  }

  getHistoricoPrecos(produtoId, periodoDias = 90, valorHoraInformado) {
    let perfil;
    try {
      perfil = UserModel.getProfile();
    } catch (e) {
      perfil = { valorHora: 21.88, salario: 3500 };
    }
    const valorHora = Number(valorHoraInformado) || Number(perfil.valorHora) || 21.88;
    const dias = Number(periodoDias) === 30 ? 30 : Number(periodoDias) === 60 ? 60 : 90;

    const idLimpo = (produtoId || '').toLowerCase().trim();
    let produtoEncontrado = CATALOGO_BENCHMARKS.find(p => p.termo.replace(/\s+/g, '-') === idLimpo || p.termo === idLimpo);

    if (!produtoEncontrado) {
      const termoNormalizado = idLimpo.replace(/-/g, ' ');
      produtoEncontrado = this.gerarOfertaDinamica(termoNormalizado);
    }

    const produtoFormatado = this.formatarAnaliseProduto(produtoEncontrado, valorHora);
    const precoAtual = produtoFormatado.melhorPreco;

    const numPontos = dias === 30 ? 5 : dias === 60 ? 7 : 9;
    const passoDias = Math.floor(dias / (numPontos - 1));
    const agora = Date.now();
    const pontosGrafico = [];

    const multiplicadores = dias === 30 
      ? [1.08, 1.05, 1.12, 1.02, 1.00]
      : dias === 60
      ? [1.14, 1.09, 1.18, 1.06, 1.11, 1.03, 1.00]
      : [1.22, 1.15, 1.25, 1.10, 1.18, 1.08, 1.14, 1.04, 1.00];

    for (let i = 0; i < numPontos; i++) {
      const diasAtras = (numPontos - 1 - i) * passoDias;
      const dataPonto = new Date(agora - diasAtras * 86400000);
      const diaFormatado = String(dataPonto.getDate()).padStart(2, '0') + '/' + String(dataPonto.getMonth() + 1).padStart(2, '0');
      const fator = multiplicadores[i] !== undefined ? multiplicadores[i] : 1.00;
      const precoPonto = Number((precoAtual * fator).toFixed(2));
      const horasPonto = Number((precoPonto / valorHora).toFixed(1));

      pontosGrafico.push({
        indice: i,
        dataRotulo: diasAtras === 0 ? 'Hoje' : diaFormatado,
        diasAtras: diasAtras,
        preco: precoPonto,
        horasSuor: horasPonto,
        isAtual: diasAtras === 0
      });
    }

    const precosArray = pontosGrafico.map(p => p.preco);
    const menorPrecoPeriodo = Math.min(...precosArray);
    const maiorPrecoPeriodo = Math.max(...precosArray);
    const precoMedioPeriodo = Number((precosArray.reduce((acc, curr) => acc + curr, 0) / precosArray.length).toFixed(2));

    const variacaoVersusPico = Number((((maiorPrecoPeriodo - precoAtual) / maiorPrecoPeriodo) * 100).toFixed(1));
    const diferencaReaisPico = Number((maiorPrecoPeriodo - precoAtual).toFixed(2));
    const horasPoupadasVersusPico = Number((diferencaReaisPico / valorHora).toFixed(1));

    let statusOportunidade = 'Excelente Oportunidade';
    let corBadge = '#10b981';
    let explicacao = 'O preco atual esta no menor patamar registrado nos ultimos ' + dias + ' dias.';

    if (precoAtual <= menorPrecoPeriodo * 1.01) {
      statusOportunidade = 'Menor Preco em ' + dias + ' dias';
      corBadge = '#10b981';
      explicacao = 'Excelente oportunidade: preco mais baixo registrado no periodo analisado.';
    } else if (precoAtual < precoMedioPeriodo * 0.96) {
      statusOportunidade = 'Oportunidade Real';
      corBadge = '#38bdf8';
      explicacao = 'Preco favoravel: valor abaixo da media historica de mercado.';
    } else if (precoAtual <= precoMedioPeriodo * 1.05) {
      statusOportunidade = 'Preco Normal';
      corBadge = '#94a3b8';
      explicacao = 'Valor estavel: o produto esta cotado na media padrao do mercado.';
    } else {
      statusOportunidade = 'Preco Inflado / Metade do Dobro';
      corBadge = '#ef4444';
      explicacao = 'Alerta de alta: preco acima da media. Recomendamos colocar no Cooldown ou criar um Alerta de Preco.';
    }

    return {
      produtoId: produtoFormatado.id,
      produtoNome: produtoFormatado.nome,
      categoria: produtoFormatado.categoria,
      periodoDias: dias,
      precoAtual: precoAtual,
      menorPrecoPeriodo: menorPrecoPeriodo,
      maiorPrecoPeriodo: maiorPrecoPeriodo,
      precoMedioPeriodo: precoMedioPeriodo,
      variacaoVersusPico: variacaoVersusPico,
      diferencaReaisPico: diferencaReaisPico,
      horasPoupadasVersusPico: horasPoupadasVersusPico,
      statusOportunidade: statusOportunidade,
      corBadge: corBadge,
      explicacao: explicacao,
      pontosGrafico: pontosGrafico
    };
  }

  criarAlertaPreco({ produtoId, precoAlvo, valorHoraInformado }) {
    let perfil;
    try {
      perfil = UserModel.getProfile();
    } catch (e) {
      perfil = { valorHora: 21.88, salario: 3500 };
    }
    const valorHora = Number(valorHoraInformado) || Number(perfil.valorHora) || 21.88;

    const idLimpo = (produtoId || '').toLowerCase().trim();
    let produtoEncontrado = CATALOGO_BENCHMARKS.find(p => p.termo.replace(/\s+/g, '-') === idLimpo || p.termo === idLimpo);
    if (!produtoEncontrado) {
      produtoEncontrado = this.gerarOfertaDinamica(idLimpo.replace(/-/g, ' '));
    }

    const produtoFormatado = this.formatarAnaliseProduto(produtoEncontrado, valorHora);
    const precoAtual = produtoFormatado.melhorPreco;
    const alvoNum = Number(precoAlvo) || Number((precoAtual * 0.9).toFixed(2));

    const economiaEsperada = Number(Math.max(0, precoAtual - alvoNum).toFixed(2));
    const horasPoupadasEsperadas = Number((economiaEsperada / valorHora).toFixed(1));

    const novoAlerta = {
      id: 'alerta-' + Date.now(),
      produtoId: produtoFormatado.id,
      produtoNome: produtoFormatado.nome,
      precoAtual: precoAtual,
      precoAlvo: alvoNum,
      economiaEsperada: economiaEsperada,
      horasPoupadasEsperadas: horasPoupadasEsperadas,
      criadoEm: new Date().toISOString(),
      atingido: precoAtual <= alvoNum
    };

    alertasPreco.unshift(novoAlerta);
    if (alertasPreco.length > 20) {
      alertasPreco.pop();
    }

    return novoAlerta;
  }

  getAlertas() {
    return alertasPreco;
  }

  deletarAlerta(alertaId) {
    const totalInicial = alertasPreco.length;
    alertasPreco = alertasPreco.filter(a => a.id !== alertaId);
    return alertasPreco.length < totalInicial;
  }
}

module.exports = new DealsModel();
