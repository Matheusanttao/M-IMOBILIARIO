# Checklist de entrega ao cliente

Use este checklist antes de publicar ou entregar o site para uma imobiliaria.

## Ambiente de producao

- Criar ou conferir o projeto Supabase de producao.
- Aplicar todas as migrations em `supabase/migrations`.
- Configurar as variaveis na Vercel ou no servidor:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_DEFAULT_TENANT_SLUG`
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_WHATSAPP_NUMBER`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`, se a IA estiver habilitada
- Configurar dominio final e atualizar `NEXT_PUBLIC_SITE_URL`.

## Dados reais do cliente

- Cadastrar a empresa/imobiliaria com nome, slug, e-mail, WhatsApp, cidade, estado e status ativo.
- Criar usuarios no Supabase Auth e vincular em `public.usuarios`.
- Definir plano e status da assinatura manualmente.
- Cadastrar corretores/equipe.
- Cadastrar imoveis reais com fotos, preco, finalidade, localizacao e status.
- Publicar posts do blog e revisar paginas institucionais.

## Testes obrigatorios

- Acessar a pagina inicial e conferir marca, menu, rodape e contatos.
- Buscar/listar imoveis em `/imoveis`.
- Abrir um detalhe de imovel e testar WhatsApp, favorito e formulario de lead.
- Enviar formulario de contato.
- Entrar no painel admin.
- Criar, editar, publicar/ocultar e excluir um imovel de teste.
- Fazer upload de fotos via Cloudinary.
- Criar/editar empresa e plano no painel master.
- Testar em celular e desktop.

## Antes da entrega

- Rodar `pnpm run lint`.
- Rodar `pnpm test`.
- Rodar `pnpm run build`.
- Conferir sitemap, robots, favicon, titulo e descricao.
- Remover dados de teste que nao devem ir para o cliente.
- Confirmar que o arquivo `.env` local nao sera enviado ao repositorio.
