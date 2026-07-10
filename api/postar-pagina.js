// /api/postar-pagina
// Posta em UMA página por chamada (em vez de todas de uma vez). Isso existe por
// dois motivos: (1) evita estourar o tempo limite da function na Vercel quando
// há muitas páginas, já que cada chamada fica bem curta; (2) permite ao painel
// mostrar o progresso em tempo real, página por página.
//
// Recebe { page_id, titulo, link, imagem_base64 } — a imagem já vem pronta
// (com o selo aplicado), gerada uma única vez no navegador via /api/preview-stamp,
// evitando reprocessar a imagem a cada página.

import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 30 };

const GRAPH_VERSION = 'v23.0';

const supa = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function postarFoto(pageId, token, imagemBuffer, legenda) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/photos`;
  const formData = new FormData();
  formData.append('caption', legenda);
  formData.append('access_token', token);
  formData.append('source', new Blob([imagemBuffer], { type: 'image/jpeg' }), 'post.jpg');

  const res = await fetch(url, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Erro ao postar foto');
  return data.post_id || data.id;
}

async function comentarLink(postId, token, link) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${postId}/comments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: link, access_token: token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Erro ao comentar');
  return data.id;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'erro', detalhe: 'Use POST.' });
  }

  const { page_id, titulo, link, imagem_base64 } = req.body || {};
  if (!page_id || !titulo || !link || !imagem_base64) {
    return res.status(200).json({
      status: 'erro',
      detalhe: 'Campos obrigatórios: page_id, titulo, link, imagem_base64.',
    });
  }

  try {
    const { data: tokenRow, error: tokenErr } = await supa
      .from('paginas_tokens')
      .select('access_token')
      .eq('page_id', page_id)
      .single();

    if (tokenErr || !tokenRow) throw new Error('Token não encontrado para esta página.');

    const imagemBuffer = Buffer.from(imagem_base64, 'base64');
    const postId = await postarFoto(page_id, tokenRow.access_token, imagemBuffer, titulo);
    await comentarLink(postId, tokenRow.access_token, link);

    return res.status(200).json({ status: 'sucesso' });
  } catch (err) {
    // Sempre respondemos 200 com o detalhe do erro dentro do JSON — assim o
    // navegador nunca recebe uma página de erro em HTML (que quebrava o
    // JSON.parse antes), sempre um JSON que dá pra ler.
    return res.status(200).json({ status: 'erro', detalhe: String(err.message || err) });
  }
}
