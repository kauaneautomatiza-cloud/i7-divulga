// Adiciona uma faixa padrão LOGO ABAIXO da imagem (aumentando a altura, não sobrepondo)
// com o texto "LEIA MAIS NOS COMENTÁRIOS". Usa "sharp" em vez de Jimp porque sharp lê
// WebP, AVIF, PNG, JPEG etc. — a maioria dos sites de notícia serve as fotos em WebP.

import sharp from 'sharp';

const TEXTO_SELO = 'LEIA MAIS NOS COMENTÁRIOS';
const ALTURA_FAIXA_PROPORCAO = 0.14; // a faixa extra é ~14% da altura original da foto
const COR_FAIXA = { r: 0x12, g: 0x0e, b: 0x1f, alpha: 1 }; // roxo escuro, combina com a identidade visual

export async function stamparImagem(imagemUrl) {
  const resposta = await fetch(imagemUrl);
  if (!resposta.ok) throw new Error('Não consegui baixar a imagem original.');
  const bufferOriginal = Buffer.from(await resposta.arrayBuffer());

  const fotoSharp = sharp(bufferOriginal);
  const metadata = await fotoSharp.metadata();
  const largura = metadata.width;
  const alturaOriginal = metadata.height;
  const alturaFaixa = Math.round(alturaOriginal * ALTURA_FAIXA_PROPORCAO);
  const alturaFinal = alturaOriginal + alturaFaixa;

  // normaliza a foto original pra JPEG (resolve WebP, AVIF, PNG, o que vier)
  const fotoNormalizada = await fotoSharp.jpeg().toBuffer();

  const fontSize = Math.round(alturaFaixa * 0.42);
  const svgFaixa = `
    <svg width="${largura}" height="${alturaFaixa}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${largura}" height="${alturaFaixa}" fill="rgb(18,14,31)" />
      <text x="50%" y="50%" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}"
            font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${TEXTO_SELO}</text>
    </svg>
  `;
  const faixaBuffer = Buffer.from(svgFaixa);

  const imagemFinal = await sharp({
    create: {
      width: largura,
      height: alturaFinal,
      channels: 4,
      background: COR_FAIXA,
    },
  })
    .composite([
      { input: fotoNormalizada, top: 0, left: 0 },
      { input: faixaBuffer, top: alturaOriginal, left: 0 },
    ])
    .jpeg()
    .toBuffer();

  return imagemFinal;
}
