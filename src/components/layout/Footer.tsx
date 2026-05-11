import { Link } from 'react-router-dom'
import { Building2, Mail, Phone } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl font-semibold">
              M<span className="text-accent">.</span> Imobiliário
            </p>
            <p className="mt-3 text-sm text-white/80">
              Sua plataforma para encontrar o imóvel ideal com transparência e
              atendimento de excelência.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">
              Navegação
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-white/90">
              <li>
                <Link to="/" className="hover:text-accent">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/imoveis" className="hover:text-accent">
                  Imóveis
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-accent">
                  Admin
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">
              Contato
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/90">
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-accent" />
                <span>(11) 99999-0000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-accent" />
                <span>contato@mimobiliario.com.br</span>
              </li>
              <li className="flex items-center gap-2">
                <Building2 className="size-4 shrink-0 text-accent" />
                <span>São Paulo — SP</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-8 text-center text-xs text-white/60">
          © {new Date().getFullYear()} M Imobiliário. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
