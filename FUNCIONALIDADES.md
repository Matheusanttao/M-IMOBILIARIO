# Funcionalidades do M. Imobiliario

Este documento lista as principais funcionalidades existentes no projeto, separadas por area do sistema.

## Visao geral

O M. Imobiliario e uma plataforma SaaS multi-tenant para imobiliarias. Cada imobiliaria pode ter seu site publico, painel administrativo, catalogo de imoveis, captacao de leads, agenda, blog e configuracoes proprias. Tambem existe um painel master para gerenciar empresas, planos e pagamentos.

## Areas do sistema

| Area | Rotas principais | Descricao |
| --- | --- | --- |
| Site publico | `/`, `/imoveis`, `/imoveis/[slug]`, `/blog`, `/sobre`, `/contato`, `/corretores`, `/favoritos`, `/comparar`, `/planos` | Site da imobiliaria para visitantes e clientes |
| Painel admin | `/admin`, `/admin/login`, `/admin/imoveis/novo`, `/admin/imoveis/[id]`, `/admin/leads`, `/admin/agenda`, `/admin/equipe`, `/admin/relatorios`, `/admin/blog`, `/admin/configuracoes` | Gestao da imobiliaria |
| Painel master | `/master`, `/master/empresas`, `/master/planos`, `/master/pagamentos` | Administracao SaaS da plataforma |
| APIs | `/api/ai/descricao`, `/api/mercadopago/checkout`, `/api/webhooks/mercadopago` | Integracoes de IA, checkout e webhooks |

## Multi-tenant

- Separacao de dados por empresa/imobiliaria.
- Identificacao do tenant por slug.
- Middleware para definir o `tenant_slug`.
- Suporte a subdominio em producao via `NEXT_PUBLIC_BASE_DOMAIN`.
- Tenant padrao em desenvolvimento via `NEXT_PUBLIC_DEFAULT_TENANT_SLUG`.
- Politicas de Row Level Security no Supabase previstas pelas migrations.

## Site publico

### Pagina inicial

- Hero com busca rapida de imoveis.
- Busca por finalidade, tipo, cidade ou bairro.
- Redirecionamento para a listagem com filtros.
- Secao de imoveis em destaque.
- Secao de beneficios/recursos da imobiliaria.
- Chamadas para ver imoveis e acessar o painel.

### Catalogo de imoveis

- Listagem publica de imoveis disponiveis.
- Cards com imagem, finalidade, tipo, titulo, bairro, cidade, preco e atributos.
- Filtros por:
  - finalidade: venda ou aluguel;
  - tipo: casa, apartamento, terreno ou sala comercial;
  - cidade;
  - bairro;
  - preco minimo e maximo;
  - quantidade minima de quartos;
  - quantidade minima de suites;
  - quantidade minima de banheiros;
  - quantidade minima de vagas.
- Filtro em sidebar no desktop.
- Filtro em modal no mobile.
- Botao para limpar filtros.
- Paginacao baseada em tamanho de pagina configurado.

### Detalhe do imovel

- Pagina individual por slug ou ID.
- Galeria de imagens.
- Exibicao de finalidade e tipo.
- Preco formatado em BRL.
- Localizacao textual com endereco, bairro e cidade.
- Caracteristicas principais:
  - area;
  - quartos;
  - banheiros;
  - vagas.
- Descricao completa.
- Botao para favoritar imovel.
- Botao para compartilhar usando API nativa do navegador ou copiar link.
- QR Code da pagina do imovel.
- Link para o comparador.
- Botao de contato via WhatsApp.
- Formulario de interesse vinculado ao imovel.
- Bloco de mapa previsto como funcionalidade futura.

### Leads publicos

- Formulario de interesse no detalhe do imovel.
- Formulario de contato geral.
- Captura de:
  - nome;
  - telefone;
  - e-mail;
  - mensagem;
  - origem;
  - imovel relacionado, quando existir.
- Salvamento dos leads no Supabase.
- Status inicial como `novo`.

### Contato

- Formulario de mensagem para visitantes.
- Validacao dos campos com React Hook Form e Zod.
- Feedback de sucesso e erro.
- Botao/link para WhatsApp quando configurado.
- Uso do WhatsApp da empresa/tenant.

### Blog publico

- Listagem de posts publicados.
- Pagina individual de post por slug.
- Metadados de SEO por post quando configurados.
- Imagem de capa quando informada.

### Corretores

- Pagina publica de corretores.
- Exibicao de membros/equipe vinculados a empresa.
- Suporte a dados como nome, papel, avatar e CRECI.

### Favoritos

- Pagina `/favoritos`.
- Armazenamento anonimo no navegador usando `localStorage`.
- Busca dos imoveis favoritados pelo tenant atual.
- Exibicao em grid de imoveis.

### Comparador

- Pagina `/comparar`.
- Armazenamento anonimo no navegador usando `localStorage`.
- Suporte a ate 3 imoveis para comparacao.
- Exibicao dos imoveis selecionados em grid.
- Funcionalidade marcada no proprio texto da tela como em evolucao.

### Planos publicos

- Pagina publica de planos.
- Exibicao de planos cadastrados no banco.
- Possibilidade de iniciar fluxo de assinatura/checkout quando integrado.

## Painel administrativo da imobiliaria

### Autenticacao

- Tela de login em `/admin/login`.
- Login via Supabase Auth.
- Logout no menu lateral.
- Protecao das rotas administrativas via Supabase/middleware.
- Perfis previstos:
  - `admin`;
  - `gerente`;
  - `corretor`;
  - `master`.

### Dashboard admin

- Indicadores:
  - total de imoveis;
  - imoveis disponiveis;
  - leads recebidos.
- Grafico de visualizacoes dos imoveis.
- Tabela de imoveis cadastrados.
- Acoes rapidas:
  - criar novo imovel;
  - publicar/ocultar imovel;
  - editar imovel;
  - excluir imovel.
- Exibicao de tipo, finalidade, preco, status e data de atualizacao.

### Gestao de imoveis

- Criacao de imovel.
- Edicao de imovel.
- Exclusao de imovel e imagens vinculadas.
- Campos principais:
  - titulo;
  - descricao;
  - tipo;
  - finalidade;
  - preco;
  - area;
  - cidade;
  - bairro;
  - endereco;
  - quartos;
  - suites;
  - banheiros;
  - vagas;
  - status;
  - destaque na pagina inicial.
- Status suportados:
  - disponivel;
  - reservado;
  - vendido;
  - alugado;
  - oculto.
- Upload de multiplas fotos via Cloudinary.
- Definicao automatica da primeira imagem como capa.
- Remocao de imagens existentes.
- Preview de imagens novas antes de salvar.
- Geracao de descricao com IA via rota `/api/ai/descricao`.

### Leads

- Tela de leads em `/admin/leads`.
- Kanban por status:
  - novo;
  - contatado;
  - qualificado;
  - negociacao;
  - convertido;
  - perdido.
- Alteracao de status dos leads.
- Visualizacao do imovel relacionado.
- Origem do lead.
- Dados de contato do lead.
- Notificacoes realtime previstas pelo Supabase.

### Agenda

- Calendario mensal de visitas.
- Navegacao entre meses.
- Indicadores por status:
  - total;
  - agendadas;
  - realizadas;
  - canceladas.
- Criacao de nova visita.
- Selecao de imovel disponivel.
- Vinculo opcional com lead.
- Definicao de horario.
- Observacoes da visita.
- Detalhes de visitas existentes.
- Atualizacao de status da visita.
- Edicao de observacoes.
- Exclusao de visita.

### Equipe

- Gestao de membros da imobiliaria.
- Cadastro de usuarios na tabela `usuarios`.
- Edicao e remocao de membros.
- Papeis suportados:
  - admin;
  - gerente;
  - corretor.
- Campos como nome, e-mail, papel e CRECI.

### Relatorios

- Exportacao rapida de leads em CSV.
- Gera arquivo `leads.csv`.
- Exporta:
  - nome;
  - telefone;
  - e-mail;
  - status;
  - data de criacao.

### Blog admin

- Criacao de artigos.
- Edicao de artigos.
- Exclusao de artigos.
- Listagem dos posts por data de criacao.
- Campos:
  - titulo;
  - slug;
  - conteudo;
  - URL da imagem de capa;
  - status publicado/rascunho;
  - titulo SEO;
  - descricao SEO.
- Geracao automatica de slug ao criar novo post.
- Alternancia entre publicado e rascunho.

### Configuracoes da imobiliaria

- Edicao dos dados gerais da empresa.
- Campos:
  - nome;
  - slug somente leitura;
  - documento/CNPJ;
  - e-mail;
  - telefone;
  - WhatsApp;
  - endereco;
  - cidade;
  - estado;
  - logo;
  - Instagram;
  - Facebook.
- Personalizacao visual:
  - cor primaria;
  - cor secundaria;
  - preview das cores.
- Validacao dos campos com Zod.
- Feedback visual ao salvar.

## Painel master SaaS

### Dashboard master

- Visao geral da plataforma.
- Indicadores de:
  - empresas cadastradas;
  - assinaturas ativas;
  - receita mensal recorrente estimada;
  - crescimento por mes.
- Graficos com dados de empresas e receita.

### Gestao de imobiliarias

- Listagem de empresas/imobiliarias.
- Busca por nome, slug ou e-mail.
- Criacao de empresa.
- Edicao de empresa.
- Ativacao/inativacao de empresa.
- Exclusao de empresa.
- Exibicao do plano vinculado.
- Contadores por empresa:
  - quantidade de imoveis;
  - quantidade de leads.
- Campos da empresa:
  - nome;
  - slug;
  - e-mail;
  - telefone;
  - documento;
  - endereco;
  - cidade;
  - estado;
  - WhatsApp;
  - Instagram;
  - Facebook;
  - cor primaria;
  - cor secundaria.

### Gestao de planos

- Listagem de planos.
- Criacao de plano.
- Edicao de plano.
- Exclusao de plano.
- Campos:
  - nome;
  - slug;
  - preco mensal;
  - limite de imoveis;
  - limite de corretores;
  - limite de leads;
  - recursos em JSON.
- Exibicao de preco mensal formatado.
- Exibicao de limites como numero ou ilimitado.
- Status ativo/inativo.

### Pagamentos

- Listagem de pagamentos.
- Integracao prevista com Mercado Pago.
- Resumo financeiro por filtros:
  - recebidos;
  - pendentes;
  - recusados.
- Filtros por:
  - status;
  - data inicial;
  - data final.
- Tabela com:
  - empresa;
  - valor;
  - status;
  - metodo;
  - data de pagamento;
  - data de criacao.
- Status previstos:
  - aprovado;
  - pendente;
  - recusado;
  - estornado.

## APIs e integracoes

### Supabase

- Banco PostgreSQL.
- Autenticacao.
- Row Level Security.
- Tabelas principais:
  - empresas;
  - usuarios;
  - imoveis;
  - imovel_imagens;
  - leads;
  - visitas;
  - blog_posts;
  - planos;
  - assinaturas;
  - pagamentos.
- Realtime para notificacoes.

### Cloudinary

- Upload de imagens de imoveis.
- Uso de upload preset unsigned.
- Armazenamento de URL segura e `public_id`.
- Upload multiplo com progresso.

### OpenAI

- Rota `/api/ai/descricao`.
- Gera sugestao de descricao de imovel.
- Usa dados do imovel como titulo, tipo, finalidade, cidade, bairro, quartos, banheiros, vagas e area.
- Requer `OPENAI_API_KEY`.

### Mercado Pago

- Rota de checkout em `/api/mercadopago/checkout`.
- Webhook em `/api/webhooks/mercadopago`.
- Edge Function de referencia em `supabase/functions/mercadopago-webhook`.
- Requer:
  - `MERCADOPAGO_ACCESS_TOKEN`;
  - `MERCADOPAGO_WEBHOOK_SECRET`;
  - `SUPABASE_SERVICE_ROLE_KEY`.

### WhatsApp

- Link direto para contato via WhatsApp.
- Usa o WhatsApp configurado na imobiliaria.
- Fallback via `NEXT_PUBLIC_WHATSAPP_NUMBER`.

## SEO e infraestrutura

- App Router do Next.js.
- Sitemap em `/sitemap.xml`.
- Robots em `/robots.txt`.
- Metadados por pagina.
- SEO para blog e detalhes de imovel.
- Configuracao para deploy na Vercel.
- Variaveis de ambiente via `.env.local`.

## Componentes reutilizaveis

- Button.
- Input.
- Textarea.
- Select.
- Modal.
- Card.
- Badge.
- Spinner.
- Layout publico.
- Layout administrativo.
- Sidebar admin.
- Sidebar master.
- Header e footer publicos.

## Testes

- Testes com Vitest.
- Testes de validadores.
- Testes de utilitarios.
- Testes de componentes de UI:
  - Button;
  - Input;
  - Modal;
  - Badge.

## Funcionalidades em evolucao ou parciais

- Mapa no detalhe do imovel aparece como "em breve".
- Comparador depende de IDs salvos no `localStorage` e esta indicado na tela como funcionalidade em evolucao.
- Logs aparecem no menu master, mas nao ha rota correspondente encontrada no projeto.
- Campos SEO do blog aparecem no formulario, mas o salvamento atual envia apenas titulo, slug, conteudo, imagem de capa e status publicado.
- Checkout e webhook do Mercado Pago dependem das credenciais e configuracao externa.
- Upload de fotos depende das credenciais do Cloudinary.
- Geracao com IA depende de `OPENAI_API_KEY`.
