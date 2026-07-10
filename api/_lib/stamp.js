// Adiciona uma faixa padrão LOGO ABAIXO da imagem (aumentando a altura, não sobrepondo)
// com o texto "LEIA MAIS NOS COMENTÁRIOS" + uma seta apontando pra baixo.
//
// Usa "sharp" (lê WebP, AVIF, PNG, JPEG etc.) e embute a fonte (Inter Bold) direto
// no SVG como base64 — isso evita o problema de "caixinhas" no lugar do texto, que
// acontece quando o servidor (Vercel) não tem nenhuma fonte de sistema instalada.

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTE_BASE64 = fs
  .readFileSync(path.join(__dirname, 'fonts', 'Inter-Bold.ttf'))
  .toString('base64');

const TEXTO_SELO = 'LEIA MAIS NOS COMENTÁRIOS';
const ALTURA_FAIXA_PROPORCAO = 0.2; // faixa um pouco mais alta pra caber texto + seta
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

  const fontSize = Math.round(alturaFaixa * 0.24);
  const centroX = largura / 2;
  const yTexto = Math.round(alturaFaixa * 0.42);
  const ySeta = Math.round(alturaFaixa * 0.72);
  const tamanhoSeta = Math.round(alturaFaixa * 0.16);

  const svgFaixa = `
    <svg width="${largura}" height="${alturaFaixa}" xmlns="http://www.w3.org/2000/svg">
      <style>
        @font-face {
          font-family: 'InterBold';
          src: url(data:font/truetype;base64,${FONTE_BASE64}) format('truetype');
          font-weight: 700;
        }
        text {
          font-family: 'InterBold', sans-serif;
          font-weight: 700;
        }
      </style>
      <rect x="0" y="0" width="${largura}" height="${alturaFaixa}" fill="rgb(18,14,31)" />
      <text x="${centroX}" y="${yTexto}" font-size="${fontSize}" fill="white"
            text-anchor="middle" dominant-baseline="middle">${TEXTO_SELO}</text>
      <path d="M ${centroX - tamanhoSeta} ${ySeta - tamanhoSeta / 2}
               L ${centroX} ${ySeta + tamanhoSeta / 2}
               L ${centroX + tamanhoSeta} ${ySeta - tamanhoSeta / 2}"
            stroke="white" stroke-width="${Math.max(3, Math.round(tamanhoSeta * 0.18))}"
            fill="none" stroke-linecap="round" stroke-linejoin="round" />
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
