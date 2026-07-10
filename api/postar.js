// /api/postar
// Recebe { link, titulo, imagem_url, paginas: [page_id, ...] }
// Para cada página: posta a foto com o título como legenda, depois comenta o link.
// Chama a Graph API direto — sem Make, sem limite de operações pagas.

import { createClient } from '@supabase/supabase-js';

const GRAPH_VERSION = 'v23.0';

// Usa a service_role key — só existe aqui no servidor, nunca no navegador.
const supa = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function postarFoto(pageId, token, imagemUrl, legenda) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/photos`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: imagemUrl,
      caption: legenda,
      access_token: token,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Erro ao postar foto');
  // a resposta do endpoint /photos traz post_id (o ID do post no feed, não da foto isolada)
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
    return res.status(405).json({ error: 'Use POST.' });
  }

  const { link, titulo, imagem_url, paginas } = req.body || {};
  if (!link || !titulo || !imagem_url || !Array.isArray(paginas) || paginas.length === 0) {
    return res.status(400).json({ error: 'Campos obrigatórios: link, titulo, imagem_url, paginas[].' });
  }

  const resultados = [];

  for (const pageId of paginas) {
    try {
      const { data: tokenRow, error: tokenErr } = await supa
        .from('paginas_tokens')
        .select('access_token')
        .eq('page_id', pageId)
        .single();

      if (tokenErr || !tokenRow) throw new Error('Token não encontrado para esta página.');

      const postId = await postarFoto(pageId, tokenRow.access_token, imagem_url, titulo);
      await comentarLink(postId, tokenRow.access_token, link);

      resultados.push({ page_id: pageId, status: 'sucesso' });
    } catch (err) {
      resultados.push({ page_id: pageId, status: 'erro', detalhe: String(err.message || err) });
    }
    // pequena pausa entre páginas pra não tomar rate limit
    await new Promise((r) => setTimeout(r, 400));
  }

  const houveErro = resultados.some((r) => r.status === 'erro');

  await supa.from('materias_postadas').insert({
    link,
    titulo_truncado: titulo,
    imagem_url,
    paginas,
    status: houveErro ? (resultados.every((r) => r.status === 'erro') ? 'erro' : 'sucesso') : 'sucesso',
    detalhe_erro: houveErro
      ? JSON.stringify(resultados.filter((r) => r.status === 'erro'))
      : null,
  });

  return res.status(200).json({ resultados });
}
