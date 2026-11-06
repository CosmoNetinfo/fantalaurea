export default function Brand({ light = false, navigate }: { light?: boolean; navigate: (path: string) => void }) {
  return <a className={`brand ${light ? 'brand-light' : ''}`} href="/" onClick={e => { e.preventDefault(); navigate('/'); }} aria-label="FantaLaurea, pagina iniziale">
    <img className="brand-symbol" src="/brand/app-icon.svg" width="42" height="42" alt="" />
    <span className="brand-wordmark">Fanta<span>Laurea</span></span>
  </a>;
}
