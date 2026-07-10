// Adiciona uma faixa padrão LOGO ABAIXO da imagem (aumentando a altura da imagem,
// não sobrepondo) com o texto "LEIA MAIS NOS COMENTÁRIOS" — assim a foto original
// fica 100% visível, sem nada coberto.

import Jimp from 'jimp';

const TEXTO_SELO = 'LEIA MAIS NOS COMENTÁRIOS';
const ALTURA_FAIXA_PROPORCAO = 0.14; // a faixa extra é ~14% da altura original da foto
const COR_FAIXA = 0x120e1fff; // cor sólida (roxo escuro, combina com a identidade visual)

export async function stamparImagem(imagemUrl) {
  const resposta = await fetch(imagemUrl);
  if (!resposta.ok) throw new Error('Não consegui baixar a imagem original.');
  const buffer = Buffer.from(await resposta.arrayBuffer());

  const fotoOriginal = await Jimp.read(buffer);
  const largura = fotoOriginal.bitmap.width;
  const alturaOriginal = fotoOriginal.bitmap.height;
  const alturaFaixa = Math.round(alturaOriginal * ALTURA_FAIXA_PROPORCAO);

  // tela nova, mais alta: foto original em cima + faixa sólida embaixo
  const imagemFinal = new Jimp(largura, alturaOriginal + alturaFaixa, COR_FAIXA);
  imagemFinal.composite(fotoOriginal, 0, 0);

  const fonte = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
  imagemFinal.print(
    fonte,
    0,
    alturaOriginal,
    {
      text: TEXTO_SELO,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    },
    largura,
    alturaFaixa
  );

  return imagemFinal.getBufferAsync(Jimp.MIME_JPEG);
}
