export default function Brand({ light = false, navigate }: { light?: boolean; navigate: (path: string) => void }) {
  return <a className={`brand ${light ? 'brand-light' : ''}`} href="/" onClick={e => { e.preventDefault(); navigate('/'); }} aria-label="FantaLaurea, pagina iniziale">
    <svg className="brand-symbol" viewBox="0 0 120 120" width="42" height="42" aria-hidden="true">
      <path d="m11 37 47-21 47 21-47 21Z" fill="currentColor" />
      <path d="M30 53v23q28 17 56 0V53L58 66Z" fill="currentColor" />
      <path d="M100 40v35c0 17-15 23-26 16l-8-5" stroke="var(--brand-ribbon)" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="m63 80-2 22 10-5 8 7 1-14Z" fill="var(--brand-ribbon)" />
    </svg>
    <span className="brand-wordmark">Fanta<span>Laurea</span></span>
  </a>;
}
