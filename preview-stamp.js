// /api/preview-stamp?url=https://site.com/imagem.jpg
// Devolve a imagem já com a faixa "LEIA MAIS NOS COMENTÁRIOS", pra o dashboard
// mostrar exatamente o que vai ser postado no Facebook.

import { stamparImagem } from './_lib/stamp.js';

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Parâmetro "url" é obrigatório.' });

  try {
    const bufferFinal = await stamparImagem(url);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(bufferFinal);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao gerar prévia carimbada.', detalhe: String(err) });
  }
}
