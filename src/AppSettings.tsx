import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Download, Monitor, Moon, Settings2, Sun, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { readAppearance, saveAppearance, type Appearance, type Mode, type Palette } from './appearance';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export default function AppSettings() {
  const [appearance, setAppearance] = useState<Appearance>(readAppearance);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(() => matchMedia('(display-mode: standalone)').matches);
  const dialog = useRef<HTMLDialogElement>(null);
  const [toolbar, setToolbar] = useState<Element | null>(null);
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({ immediate: true });
  useEffect(() => {
    const findToolbar = () => setToolbar(document.querySelector('.topbar-right'));
    findToolbar();
    const observer = new MutationObserver(findToolbar);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const available = (event: Event) => { event.preventDefault(); setInstall(event as InstallPrompt); };
    const complete = () => { setInstalled(true); setInstall(null); };
    window.addEventListener('beforeinstallprompt', available);
    window.addEventListener('appinstalled', complete);
    return () => { window.removeEventListener('beforeinstallprompt', available); window.removeEventListener('appinstalled', complete); };
  }, []);
  const change = (next: Appearance) => { setAppearance(next); saveAppearance(next); };
  const modes: { value: Mode; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Chiaro', icon: Sun }, { value: 'dark', label: 'Scuro', icon: Moon }, { value: 'system', label: 'Automatico', icon: Monitor },
  ];
  const palettes: { value: Palette; label: string; detail: string }[] = [
    { value: 'gold', label: 'Oro', detail: 'Bianco, nero e dettagli dorati' },
    { value: 'forest', label: 'Verde', detail: 'Verde profondo e toni neutri' },
    { value: 'ocean', label: 'Blu', detail: 'Blu notte e dettagli dorati' },
  ];
  const trigger = <button className={`appearance-trigger ${toolbar ? 'in-toolbar' : ''}`} aria-label="Impostazioni app" onClick={() => { setAppearance(readAppearance()); dialog.current?.showModal(); }}><Settings2 size={20} /><span>App e aspetto</span>{needRefresh && <span className="update-dot" />}</button>;
  return <>
    {toolbar ? createPortal(trigger, toolbar) : trigger}
    <dialog className="settings-dialog" ref={dialog} aria-labelledby="settings-title" onClick={event => { if (event.target === dialog.current) { const rect = dialog.current.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.current.close(); } }}>
      <div className="settings-heading"><div><span className="eyebrow">A MODO TUO</span><h2 id="settings-title">App e aspetto</h2></div><button className="icon-button" aria-label="Chiudi impostazioni" onClick={() => dialog.current?.close()}><X size={21} /></button></div>
      <fieldset className="settings-group"><legend>Modalità</legend><div className="mode-options">{modes.map(mode => <button key={mode.value} className={appearance.mode === mode.value ? 'selected' : ''} aria-pressed={appearance.mode === mode.value} onClick={() => change({ ...appearance, mode: mode.value })}><mode.icon size={21} />{mode.label}</button>)}</div></fieldset>
      <fieldset className="settings-group"><legend>Palette</legend><div className="palette-options">{palettes.map(palette => <button key={palette.value} aria-pressed={appearance.palette === palette.value} className={appearance.palette === palette.value ? 'selected' : ''} onClick={() => change({ ...appearance, palette: palette.value })}><span className={`palette-swatch swatch-${palette.value}`} /><span><strong>{palette.label}</strong><small>{palette.detail}</small></span>{appearance.palette === palette.value && <Check size={18} />}</button>)}</div></fieldset>
      <p className="settings-note">Le preferenze si salvano su questo dispositivo. Automatico segue l’aspetto del telefono.</p>
      <section className="install-section"><h3>FantaLaurea sul telefono</h3>{installed ? <p>L’app è già aperta in modalità installata.</p> : install ? <><p>La tua compagnia, a un tocco dalla schermata Home.</p><button className="button primary" onClick={async () => { await install.prompt(); await install.userChoice; setInstall(null); }}><Download size={18} /> Installa FantaLaurea</button></> : <><p>Su iPhone: apri il sito in Safari, premi <strong>Condividi → Aggiungi alla schermata Home</strong>.</p><p>Su Android: nel menu di Chrome scegli <strong>Installa app</strong> o <strong>Aggiungi a schermata Home</strong>, quando disponibile.</p></>}<p className="settings-note">Le partite condivise richiedono una connessione. La demo resta disponibile anche offline dopo il primo caricamento.</p></section>
      {needRefresh && <section className="install-section"><h3>C’è una nuova versione</h3><p>Puoi aggiornare quando hai finito l’operazione in corso.</p><button className="button primary" onClick={() => void updateServiceWorker(true)}>Aggiorna l’app</button></section>}
    </dialog>
  </>;
}
