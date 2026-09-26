const UserModel = require('./userModel');

const CATALOGO_BENCHMARKS = [
  {
    termo: 'iphone 15',
    nome: 'Apple iPhone 15 (128 GB) - Preto',
    categoria: 'Smartphones',
    imagem: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&q=80',
    lojas: [
      {
        loja: 'Mercado Livre Oficial',
        preco: 4199.00,
        precoCheio: 4799.00,
        cupom: 'APP100'
      },
      {
        loja: 'Amazon Brasil',
        preco: 4299.00,
        precoCheio: 4899.00,
        cupom: 'PRIME100'
      },
      {
        loja: 'Magazine Luiza',
        preco: 4399.00,
        precoCheio: 4999.00,
        cupom: 'MAGALU50'
      }
    ]
  },
  {
    termo: 'galaxy s24',
    nome: 'Samsung Galaxy S24 5G (128 GB) - Cinza',
    categoria: 'Smartphones',
    imagem: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&q=80',
    lojas: [
      {
        loja: 'Mercado Livre Oficial',
        preco: 3399.00,
        precoCheio: 4199.00,
        cupom: 'GALAXY100'
      },
      {
        loja: 'Amazon Brasil',
        preco: 3499.00,
        precoCheio: 4299.00,
        cupom: 'PRIME80'
      },
      {
        loja: 'Magazine Luiza',
        preco: 3699.00,
        precoCheio: 4499.00,
        cupom: 'MAGASAMSUNG'
      }
    ]
  },
  {
    termo: 'playstation 5',
    nome: 'Console PlayStation 5 Slim Edicao Digital',
    categoria: 'Games',
    imagem: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&q=80',
    lojas: [
      {
        loja: 'Kabum',
        preco: 3299.00,
        precoCheio: 3899.00,
        cupom: 'KABUMPS5'
      },
      {
        loja: 'Amazon Brasil',
        preco: 3399.00,
        precoCheio: 3999.00,
        cupom: 'GAMES100'
      },
      {
        loja: 'Mercado Livre Oficial',
        preco: 3499.00,
        precoCheio: 4099.00,
        cupom: 'PLAY80'
      }
    ]
  },
  {
    termo: 'nintendo switch',
    nome: 'Console Nintendo Switch OLED 64GB - Branco',
    categoria: 'Games',
    imagem: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500&q=80',
    lojas: [
      {
        loja: 'Mercado Livre Oficial',
        preco: 1899.00,
        precoCheio: 2399.00,
        cupom: 'NINTENDO80'
      },
      {
        loja: 'Amazon Brasil',
        preco: 1999.00,
        precoCheio: 2499.00,
        cupom: 'SWITCH50'
      },
      {
        loja: 'Magazine Luiza',
        preco: 2149.00,
        precoCheio: 2599.00,
        cupom: 'MAGASWITCH'
      }
    ]
  },
  {
    termo: 'notebook dell',
    nome: 'Notebook Dell Inspiron 15 (Intel Core i5, 16GB RAM, 512GB SSD)',
    categoria: 'Informatica',
    imagem: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&q=80',
    lojas: [
      {
        loja: 'Mercado Livre Oficial',
        preco: 2899.00,
        precoCheio: 3499.00,
        cupom: 'DELL100'
      },
      {
        loja: 'Amazon Brasil',
        preco: 2999.00,
        precoCheio: 3599.00,
        cupom: 'NOTE100'
      },
      {
        loja: 'Dell Loja Oficial',
        preco: 3199.00,
        precoCheio: 3799.00,
        cupom: 'DELLDIRECT'
      }
    ]
  },
  {
    termo: 'macbook air',
    nome: 'Apple MacBook Air 13 polegadas Chip M2 8GB 256GB SSD',
    categoria: 'Informatica',
    imagem: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
    lojas: [
      {
        loja: 'Amazon Brasil',
        preco: 6299.00,
        precoCheio: 7499.00,
        cupom: 'MAC150'
      },
      {
        loja: 'Mercado Livre Oficial',
        preco: 6499.00,
        precoCheio: 7699.00,
        cupom: 'APP150'
      },
      {
        loja: 'Magazine Luiza',
        preco: 6799.00,
        precoCheio: 7999.00,
        cupom: 'MAGAMAC'
      }
    ]
  },
  {
    termo: 'airpods pro',
    nome: 'Apple AirPods Pro (2a Geracao) com Estojo MagSafe USB-C',
    categoria: 'Audio',
    imagem: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&q=80',
    lojas: [
      {
        loja: 'Amazon Brasil',
        preco: 1649.00,
        precoCheio: 2099.00,
        cupom: 'AIRPODS50'
      },
      {
        loja: 'Mercado Livre Oficial',
        preco: 1699.00,
        precoCheio: 2149.00,
        cupom: 'APP50'
      },
      {
        loja: 'Magazine Luiza',
        preco: 1849.00,
        precoCheio: 2299.00,
        cupom: 'MAGAPRO'
      }
    ]
  },
  {
    termo: 'fone sony',
    nome: 'Fone de Ouvido Sony WH-1000XM4 com Cancelamento de Ruido',
    categoria: 'Audio',
    imagem: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    lojas: [
      {
        loja: 'Amazon Brasil',
        preco: 1499.00,
        precoCheio: 1849.00,
        cupom: 'SONY100'
      },
      {
        loja: 'Mercado Livre Oficial',
        preco: 1549.00,
        precoCheio: 1899.00,
        cupom: 'XM4PROMO'
      },
      {
        loja: 'Kabum',
        preco: 1649.00,
        precoCheio: 1999.00,
        cupom: 'KABUMAUDIO'
      }
    ]
  },
  {
    termo: 'smart tv lg',
    nome: 'Smart TV LG 50 Polegadas 4K UHD ThinQ AI',
    categoria: 'Televisores',
    imagem: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&q=80',
    lojas: [
      {
        loja: 'Mercado Livre Oficial',
        preco: 1999.00,
        precoCheio: 2499.00,
        cupom: 'TVLG80'
      },
      {
        loja: 'Amazon Brasil',
        preco: 2099.00,
        precoCheio: 2599.00,
        cupom: 'LGPRIME50'
      },
      {
        loja: 'Magazine Luiza',
        preco: 2199.00,
        precoCheio: 2699.00,
        cupom: 'MAGATV'
      }
    ]
  },
  {
    termo: 'tenis nike',
    nome: 'Tenis Nike Air Max Masculino - Corrida e Conforto',
    categoria: 'Calcados',
    imagem: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    lojas: [
      {
        loja: 'Mercado Livre Oficial',
        preco: 299.90,
        precoCheio: 449.90,
        cupom: 'MODA30'
      },
      {
        loja: 'Amazon Brasil',
        preco: 329.90,
        precoCheio: 479.90,
        cupom: 'NIKE20'
      },
      {
        loja: 'Magazine Luiza',
        preco: 369.90,
        precoCheio: 519.90,
        cupom: 'MAGAMODA'
      }
    ]
  },
  {
    termo: 'air fryer',
    nome: 'Fritadeira Eletrica Air Fryer Mondial 4L Family - Inox Black',
    categoria: 'Eletrodomesticos',
    imagem: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&q=80',
    lojas: [
      {
        loja: 'Amazon Brasil',
        preco: 199.90,
        precoCheio: 289.90,
        cupom: 'CASA20'
      },
      {
        loja: 'Mercado Livre Oficial',
        preco: 219.00,
        precoCheio: 299.00,
        cupom: 'MONDIAL10'
      },
      {
        loja: 'Magazine Luiza',
        preco: 239.90,
        precoCheio: 319.00,
        cupom: 'MAGACASA'
      }
    ]
  },
  {
    termo: 'kindle',
    nome: 'Kindle 11a Geracao 16GB Tela 6 polegadas antirreflexo',
    categoria: 'Leitores Digitais',
    imagem: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80',
    lojas: [
      {
        loja: 'Amazon Brasil',
        preco: 449.00,
        precoCheio: 499.00,
        cupom: 'KINDLE30'
      },
      {
        loja: 'Mercado Livre Oficial',
        preco: 479.00,
        precoCheio: 529.00,
        cupom: 'APP20'
      },
      {
        loja: 'Magazine Luiza',
        preco: 499.00,
        precoCheio: 549.00,
        cupom: 'MAGAKINDLE'
      }
    ]
  },
  {
    termo: 'echo dot',
    nome: 'Echo Dot 5a Geracao Smart Speaker com Alexa',
    categoria: 'Casa Inteligente',
    imagem: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=500&q=80',
    lojas: [
      {
        loja: 'Amazon Brasil',
        preco: 349.00,
        precoCheio: 429.00,
        cupom: 'ALEXA30'
      },
      {
        loja: 'Mercado Livre Oficial',
        preco: 369.00,
        precoCheio: 449.00,
        cupom: 'CASA20'
      },
      {
        loja: 'Magazine Luiza',
        preco: 399.00,
        precoCheio: 479.00,
        cupom: 'MAGALEXA'
      }
    ]
  }
];

class DealsModel {
  resolverLinkLoja(lojaNome, nomeProduto) {
    const termoQuery = encodeURIComponent(nomeProduto);
    const lower = (lojaNome || '').toLowerCase();
    if (lower.includes('amazon')) {
      return 'https://www.amazon.com.br/s?k=' + termoQuery;
    }
    if (lower.includes('mercado livre')) {
      return 'https://lista.mercadolivre.com.br/' + termoQuery;
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
    return 'https://www.google.com/search?tbm=shop&q=' + termoQuery;
  }

  estimarPrecoPorCategoria(termo) {
    const t = termo.toLowerCase();
    if (t.includes('geladeira') || t.includes('refrigerador')) return 2599.00;
    if (t.includes('fogao') || t.includes('cooktop')) return 899.00;
    if (t.includes('microondas') || t.includes('micro-ondas')) return 549.00;
    if (t.includes('lavadora') || t.includes('maquina de lavar')) return 1899.00;
    if (t.includes('ar condicionado')) return 2199.00;
    if (t.includes('tv') || t.includes('televisao') || t.includes('smart tv')) return 2099.00;
    if (t.includes('iphone 14')) return 3799.00;
    if (t.includes('iphone 13')) return 3299.00;
    if (t.includes('iphone 12')) return 2699.00;
    if (t.includes('iphone 11')) return 1999.00;
    if (t.includes('galaxy') || t.includes('motorola') || t.includes('xiaomi') || t.includes('celular') || t.includes('smartphone')) return 1699.00;
    if (t.includes('notebook') || t.includes('laptop')) return 2899.00;
    if (t.includes('monitor')) return 849.00;
    if (t.includes('xbox')) return 2499.00;
    if (t.includes('playstation') || t.includes('ps4')) return 1999.00;
    if (t.includes('ipad') || t.includes('tablet')) return 2899.00;
    if (t.includes('smartwatch') || t.includes('relogio')) return 499.00;
    if (t.includes('fone') || t.includes('headset') || t.includes('earbuds')) return 249.00;
    if (t.includes('teclado') || t.includes('mouse')) return 179.00;
    if (t.includes('tenis') || t.includes('sapato')) return 289.00;
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
    const linkGoogleShopping = 'https://www.google.com/search?tbm=shop&q=' + encodeURIComponent(prod.nome);

    const lojasFormatadas = prod.lojas.map(l => {
      const linkVerificado = this.resolverLinkLoja(l.loja, prod.nome);
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
}

module.exports = new DealsModel();
