import { cn } from '@/lib/utils'

export function Spinner({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const s =
    size === 'sm' ? 'size-5 border' : size === 'lg' ? 'size-12 border-2' : 'size-8 border-2'
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={cn(
        'animate-spin rounded-full border-primary border-t-transparent',
        s,
        className,
      )}
    />
  )
}
