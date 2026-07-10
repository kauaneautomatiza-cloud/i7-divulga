-- Painel de Postagem de Notícias — schema Supabase
-- Rode isso no SQL Editor do seu projeto Supabase (novo projeto, separado do Klippy)

create table if not exists paginas_facebook (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  page_id text not null,       -- identificador da página (o ID numérico real da Página no Facebook)
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists materias_postadas (
  id uuid primary key default gen_random_uuid(),
  link text not null,
  titulo_original text,
  titulo_truncado text not null,
  imagem_url text,
  paginas jsonb not null default '[]',   -- array com os page_id que foram selecionados
  status text not null default 'pendente', -- pendente | sucesso | erro
  detalhe_erro text,
  criado_em timestamptz not null default now()
);

-- Tabela separada e TRANCADA para os tokens de acesso das páginas.
-- RLS fica ATIVADO e sem nenhuma policy pública — só a service_role key
-- (usada dentro da function do servidor, nunca no navegador) consegue ler isso.
create table if not exists paginas_tokens (
  page_id text primary key,
  access_token text not null,
  atualizado_em timestamptz not null default now()
);
alter table paginas_tokens enable row level security;
-- (propositalmente sem "create policy" aqui — anon key não enxerga nada nesta tabela)

-- As outras duas tabelas continuam de leitura livre (só nome/id de página e histórico,
-- nada sensível), já que é o painel no navegador que lê elas direto.
alter table paginas_facebook disable row level security;
alter table materias_postadas disable row level security;

-- Cadastre suas 10 páginas de uma vez (page_id = o ID numérico real da Página no Facebook)
-- insert into paginas_facebook (nome, page_id) values
--   ('Nome da Página 1', '1234567890'),
--   ('Nome da Página 2', '2345678901');

-- E o token de longa duração de cada uma (faça isso pelo SQL Editor, nunca pelo painel no navegador)
-- insert into paginas_tokens (page_id, access_token) values
--   ('1234567890', 'EAAxxxxxxxxxxxxx...'),
--   ('2345678901', 'EAAyyyyyyyyyyyyy...');
