/**
 * RBAC — papéis e permissões por módulo (fallback quando não há overrides em `permissoes`).
 */

export type Papel =
  | 'master'
  | 'admin'
  | 'gerente'
  | 'corretor'
  | 'financeiro'
  | 'captador'
  | 'atendente'

export type ModuloRBAC =
  | 'dashboard'
  | 'imoveis'
  | 'leads'
  | 'crm'
  | 'proprietarios'
  | 'financeiro'
  | 'contratos'
  | 'mapa'
  | 'equipe'
  | 'relatorios'
  | 'blog'
  | 'configuracoes'
  | 'notificacoes'
  | 'agenda'

export type AcaoRBAC =
  | 'visualizar'
  | 'criar'
  | 'editar'
  | 'excluir'
  | 'exportar'
  | 'aprovar'

/** Matriz padrão por papel (enterprise). */
export const PERMISSOES_PADRAO: Record<
  Papel,
  Partial<Record<ModuloRBAC, AcaoRBAC[]>>
> = {
  master: {
    dashboard: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
    imoveis: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
    leads: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
    crm: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
    proprietarios: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
    financeiro: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
    contratos: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
    mapa: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
    equipe: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
    relatorios: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
    blog: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
    configuracoes: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
    notificacoes: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
    agenda: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
  },
  admin: {
    dashboard: ['visualizar', 'exportar'],
    imoveis: ['visualizar', 'criar', 'editar', 'excluir', 'exportar'],
    leads: ['visualizar', 'criar', 'editar', 'excluir', 'exportar'],
    crm: ['visualizar', 'criar', 'editar', 'excluir', 'exportar'],
    proprietarios: ['visualizar', 'criar', 'editar', 'excluir', 'exportar'],
    financeiro: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
    contratos: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
    mapa: ['visualizar', 'criar', 'editar', 'excluir'],
    equipe: ['visualizar', 'criar', 'editar', 'excluir'],
    relatorios: ['visualizar', 'exportar'],
    blog: ['visualizar', 'criar', 'editar', 'excluir'],
    configuracoes: ['visualizar', 'editar'],
    notificacoes: ['visualizar', 'editar'],
    agenda: ['visualizar', 'criar', 'editar', 'excluir'],
  },
  gerente: {
    dashboard: ['visualizar', 'exportar'],
    imoveis: ['visualizar', 'criar', 'editar', 'exportar'],
    leads: ['visualizar', 'criar', 'editar', 'exportar'],
    crm: ['visualizar', 'criar', 'editar', 'exportar'],
    proprietarios: ['visualizar', 'criar', 'editar', 'exportar'],
    financeiro: ['visualizar', 'criar', 'editar', 'exportar', 'aprovar'],
    contratos: ['visualizar', 'criar', 'editar', 'exportar', 'aprovar'],
    mapa: ['visualizar', 'criar', 'editar'],
    equipe: ['visualizar', 'criar', 'editar'],
    relatorios: ['visualizar', 'exportar'],
    blog: ['visualizar', 'criar', 'editar'],
    configuracoes: ['visualizar'],
    notificacoes: ['visualizar', 'editar'],
    agenda: ['visualizar', 'criar', 'editar', 'excluir'],
  },
  corretor: {
    dashboard: ['visualizar'],
    imoveis: ['visualizar', 'criar', 'editar'],
    leads: ['visualizar', 'criar', 'editar'],
    crm: ['visualizar', 'criar', 'editar'],
    proprietarios: ['visualizar', 'criar', 'editar'],
    financeiro: ['visualizar'],
    contratos: ['visualizar', 'criar', 'editar'],
    mapa: ['visualizar', 'criar', 'editar'],
    equipe: ['visualizar'],
    relatorios: ['visualizar', 'exportar'],
    blog: ['visualizar', 'criar', 'editar'],
    configuracoes: ['visualizar'],
    notificacoes: ['visualizar'],
    agenda: ['visualizar', 'criar', 'editar'],
  },
  financeiro: {
    dashboard: ['visualizar'],
    imoveis: ['visualizar'],
    leads: ['visualizar'],
    crm: ['visualizar'],
    proprietarios: ['visualizar'],
    financeiro: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'],
    contratos: ['visualizar', 'exportar'],
    mapa: ['visualizar'],
    equipe: ['visualizar'],
    relatorios: ['visualizar', 'exportar'],
    blog: [],
    configuracoes: ['visualizar'],
    notificacoes: ['visualizar'],
    agenda: ['visualizar'],
  },
  captador: {
    dashboard: ['visualizar'],
    imoveis: ['visualizar', 'criar', 'editar'],
    leads: ['visualizar', 'criar', 'editar'],
    crm: ['visualizar', 'criar', 'editar'],
    proprietarios: ['visualizar', 'criar', 'editar'],
    financeiro: [],
    contratos: ['visualizar'],
    mapa: ['visualizar', 'criar', 'editar'],
    equipe: ['visualizar'],
    relatorios: ['visualizar'],
    blog: [],
    configuracoes: ['visualizar'],
    notificacoes: ['visualizar'],
    agenda: ['visualizar', 'criar', 'editar'],
  },
  atendente: {
    dashboard: ['visualizar'],
    imoveis: ['visualizar'],
    leads: ['visualizar', 'criar', 'editar'],
    crm: ['visualizar', 'criar', 'editar'],
    proprietarios: ['visualizar'],
    financeiro: [],
    contratos: ['visualizar'],
    mapa: ['visualizar'],
    equipe: ['visualizar'],
    relatorios: [],
    blog: [],
    configuracoes: ['visualizar'],
    notificacoes: ['visualizar'],
    agenda: ['visualizar', 'criar', 'editar'],
  },
}

export function papelTemAcao(
  papel: string | null | undefined,
  modulo: ModuloRBAC,
  acao: AcaoRBAC,
): boolean {
  if (!papel) return false
  const p = papel as Papel
  const modulos = PERMISSOES_PADRAO[p]
  if (!modulos) return false
  const acoes = modulos[modulo]
  return acoes?.includes(acao) ?? false
}

export function podeVisualizarModulo(
  papel: string | null | undefined,
  modulo: ModuloRBAC,
): boolean {
  return papelTemAcao(papel, modulo, 'visualizar')
}
