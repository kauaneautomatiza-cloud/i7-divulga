// /api/painel — a "porta de entrada" do site. Serve o formulário de senha
// se a pessoa não estiver autenticada, ou o conteúdo do painel se já estiver.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { estaAutenticado } from './_lib/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PAGINA_LOGIN = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Painel de Postagem — Login</title>
<style>
  body {
    background: #08060F;
    color: #F1EEFA;
    font-family: 'Segoe UI', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    margin: 0;
  }
  .card {
    background: #120E1F;
    border: 1px solid #241E38;
    border-radius: 14px;
    padding: 32px;
    width: 280px;
  }
  h1 { font-size: 18px; margin: 0 0 20px; }
  input {
    width: 100%;
    background: #0D0A18;
    border: 1px solid #241E38;
    border-radius: 8px;
    padding: 10px 12px;
    color: #F1EEFA;
    font-size: 14px;
    margin-bottom: 14px;
    box-sizing: border-box;
  }
  button {
    width: 100%;
    background: linear-gradient(90deg, #8B5CF6, #EC4899);
    border: none;
    color: white;
    font-weight: 600;
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
  }
  .erro { color: #F87171; font-size: 13px; margin-top: 10px; }
</style>
</head>
<body>
  <div class="card">
    <h1>Painel de Postagem</h1>
    <input type="text" id="usuario" placeholder="Usuário" autofocus />
    <input type="password" id="senha" placeholder="Senha" />
    <button id="btn-entrar">Entrar</button>
    <div class="erro" id="erro"></div>
  </div>
  <script>
    async function tentarLogin() {
      const usuario = document.getElementById('usuario').value;
      const senha = document.getElementById('senha').value;
      const erroEl = document.getElementById('erro');
      erroEl.textContent = '';
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario, senha }),
        });
        const data = await res.json();
        if (data.ok) {
          window.location.reload();
        } else {
          erroEl.textContent = data.erro || 'Usuário ou senha incorretos.';
        }
      } catch (e) {
        erroEl.textContent = 'Erro ao tentar entrar.';
      }
    }
    document.getElementById('btn-entrar').addEventListener('click', tentarLogin);
    document.getElementById('senha').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tentarLogin();
    });
  </script>
</body>
</html>
`;

export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!estaAutenticado(req)) {
    return res.status(200).send(PAGINA_LOGIN);
  }

  const htmlPainel = fs.readFileSync(path.join(__dirname, '_lib', 'painel-conteudo.html'), 'utf-8');
  return res.status(200).send(htmlPainel);
}
