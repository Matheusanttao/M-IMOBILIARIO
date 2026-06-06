'use client'

import Link from 'next/link'
import { Building2, Mail, Phone } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'

export function Footer() {
  const { empresaNome, whatsapp, email, cidade, estado } = useTenant()
  const phoneDigits = whatsapp?.replace(/\D/g, '')
  const location = [cidade, estado].filter(Boolean).join(' — ')

  return (
    <footer className="border-t border-white/10 bg-[#050d18] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl font-semibold uppercase tracking-[0.2em]">
              {empresaNome}
            </p>
            <p className="mt-3 text-sm text-white/80">
              Encontre imóveis selecionados com curadoria, transparência e
              atendimento de excelência.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">
              Navegação
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-white/90">
              <li>
                <Link href="/" className="hover:text-accent">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/imoveis" className="hover:text-accent">
                  Imóveis
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="hover:text-accent">
                  Sobre nós
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-accent">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contato" className="hover:text-accent">
                  Contato
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">
              Contato
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/90">
              {phoneDigits ? (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0 text-accent" />
                  <a href={`tel:+${phoneDigits}`} className="hover:text-accent">
                    WhatsApp
                  </a>
                </li>
              ) : null}
              {email ? (
                <li className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0 text-accent" />
                  <a href={`mailto:${email}`} className="hover:text-accent">
                    {email}
                  </a>
                </li>
              ) : null}
              {location ? (
                <li className="flex items-center gap-2">
                  <Building2 className="size-4 shrink-0 text-accent" />
                  <span>{location}</span>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-8 text-center text-xs text-white/60">
          © {new Date().getFullYear()} {empresaNome}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
