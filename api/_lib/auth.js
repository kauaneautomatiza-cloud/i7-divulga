// Autenticação simples por senha única (uso pessoal). A senha fica só como
// variável de ambiente no Vercel (PAINEL_SENHA) — nunca no código, nunca no navegador.
// O cookie guarda um hash da senha, não a senha em texto puro.

import crypto from 'crypto';

export const NOME_COOKIE = 'painel_auth';

export function hashCredenciais(usuario, senha) {
  return crypto.createHash('sha256').update(`${usuario}:${senha}`).digest('hex');
}

export function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').filter(Boolean).map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    })
  );
}

export function estaAutenticado(req) {
  const usuarioCorreto = process.env.PAINEL_USUARIO;
  const senhaCorreta = process.env.PAINEL_SENHA;
  if (!usuarioCorreto || !senhaCorreta) return false; // se as variáveis não estiverem configuradas, nega tudo por segurança
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies[NOME_COOKIE] === hashCredenciais(usuarioCorreto, senhaCorreta);
}
