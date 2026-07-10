// /api/preview?url=https://site-de-noticia.com/materia
// Busca a página e extrai og:title e og:image (com fallbacks) para o dashboard.

function extractMeta(html, property) {
  // cobre tanto property="og:x" quanto name="og:x", em qualquer ordem de atributos
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`,
    'i'
  );
  const match = html.match(regex);
  if (!match) return null;
  const value = match[1] || match[2] || null;
  return value ? value.trim() : null;
}

function extractTitleTag(html) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
}

function truncarTitulo(titulo, limite = 60) {
  if (!titulo) return '';
  if (titulo.length <= limite) return titulo;
  return titulo.slice(0, limite).trim() + '...Ver mais';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Parâmetro "url" é obrigatório.' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        // alguns sites de notícia bloqueiam user-agents "de robô"
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Não consegui abrir o link (status ${response.status}).` });
    }

    const html = await response.text();

    const ogTitle = extractMeta(html, 'og:title');
    const ogImage = extractMeta(html, 'og:image');
    const tituloOriginal = ogTitle || extractTitleTag(html) || '';

    return res.status(200).json({
      titulo_original: tituloOriginal,
      titulo_truncado: truncarTitulo(tituloOriginal),
      imagem_url: ogImage,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar o preview do link.', detalhe: String(err) });
  }
}
