// Adiciona uma faixa padrão LOGO ABAIXO da imagem (aumentando a altura, não sobrepondo)
// com o texto "LEIA MAIS NOS COMENTÁRIOS" + uma seta apontando pra baixo.
//
// Usa "sharp" (lê WebP, AVIF, PNG, JPEG etc.) pra imagem, e "opentype.js" pra converter
// o texto em contornos vetoriais (paths) nós mesmos — assim o desenho final não depende
// de o servidor ter alguma fonte instalada nem de suportar @font-face embutido no SVG,
// que foi a causa dos problemas anteriores (texto aparecendo como caixinhas vazias).

import sharp from 'sharp';
import opentype from 'opentype.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fontBuffer = fs.readFileSync(path.join(__dirname, 'fonts', 'Inter-Bold.ttf'));
const arrayBuffer = fontBuffer.buffer.slice(
  fontBuffer.byteOffset,
  fontBuffer.byteOffset + fontBuffer.byteLength
);
const fonte = opentype.parse(arrayBuffer);

const TEXTO_SELO = 'LEIA MAIS NOS COMENTÁRIOS';
const ALTURA_FAIXA_PROPORCAO = 0.2; // faixa um pouco mais alta pra caber texto + seta
const COR_FAIXA = { r: 0x12, g: 0x0e, b: 0x1f, alpha: 1 }; // roxo escuro, combina com a identidade visual

// Gera o "d" (path data) do texto inteiro, glifo por glifo, sem depender de
// nenhuma etapa de composição tipográfica do opentype.js (que dava erro com
// alguns fonts/caracteres) — só o desenho puro de cada letra, lado a lado.
function gerarPathTexto(texto, fontSize, xInicial, yBase) {
  let x = xInicial;
  let dCompleto = '';
  for (const caractere of texto) {
    const glifo = fonte.charToGlyph(caractere);
    dCompleto += glifo.getPath(x, yBase, fontSize).toPathData(2) + ' ';
    x += (glifo.advanceWidth * fontSize) / fonte.unitsPerEm;
  }
  return { d: dCompleto, larguraTotal: x - xInicial };
}

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
  const yTexto = Math.round(alturaFaixa * 0.46);
  const ySeta = Math.round(alturaFaixa * 0.76);
  const tamanhoSeta = Math.round(alturaFaixa * 0.16);

  // gera o texto uma vez só (numa posição temporária) pra medir a largura total
  const medida = gerarPathTexto(TEXTO_SELO, fontSize, 0, yTexto);
  const xInicial = centroX - medida.larguraTotal / 2;
  const { d: pathTexto } = gerarPathTexto(TEXTO_SELO, fontSize, xInicial, yTexto);

  const svgFaixa = `
    <svg width="${largura}" height="${alturaFaixa}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${largura}" height="${alturaFaixa}" fill="rgb(18,14,31)" />
      <path d="${pathTexto}" fill="white" />
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
