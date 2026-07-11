// /api/login — recebe { usuario, senha } via POST, confere com PAINEL_USUARIO e
// PAINEL_SENHA (variáveis de ambiente) e, se baterem, seta o cookie de sessão.

import { hashCredenciais, NOME_COOKIE } from './_lib/auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, erro: 'Use POST.' });
  }

  const usuarioCorreto = process.env.PAINEL_USUARIO;
  const senhaCorreta = process.env.PAINEL_SENHA;
  const { usuario, senha } = req.body || {};

  if (!usuarioCorreto || !senhaCorreta) {
    return res.status(500).json({ ok: false, erro: 'PAINEL_USUARIO/PAINEL_SENHA não configuradas no servidor.' });
  }

  if (usuario !== usuarioCorreto || senha !== senhaCorreta) {
    return res.status(200).json({ ok: false, erro: 'Usuário ou senha incorretos.' });
  }

  const token = hashCredenciais(usuarioCorreto, senhaCorreta);
  // 30 dias, httpOnly (não acessível via JS no navegador), secure (só https)
  res.setHeader(
    'Set-Cookie',
    `${NOME_COOKIE}=${token}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`
  );
  return res.status(200).json({ ok: true });
}
