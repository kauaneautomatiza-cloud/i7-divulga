// /api/logout — limpa o cookie de sessão.

import { NOME_COOKIE } from './_lib/auth.js';

export default function handler(req, res) {
  res.setHeader('Set-Cookie', `${NOME_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  return res.status(200).json({ ok: true });
}
