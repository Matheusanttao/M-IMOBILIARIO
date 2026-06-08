-- Remove dados de demonstracao que nao devem aparecer no ambiente do cliente.
delete from public.empresas
where slug = 'demo'
  and nome = 'Imobiliaria Demo'
  and email = 'contato@demo.local';

delete from public.planos
where slug = 'enterprise'
  and nome = 'Enterprise'
  and preco_mensal = 0
  and limite_imoveis is null
  and limite_corretores is null
  and limite_leads is null
  and not exists (
    select 1
    from public.assinaturas a
    where a.plano_id = public.planos.id
  );
