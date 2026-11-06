export const AUTH_DESTINATION_KEY = 'fantalaurea.auth-destination';

export function readAuthReturn(href: string) {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const value = (key: string) => url.searchParams.get(key) || hash.get(key);
  return {
    callback: ['access_token', 'refresh_token', 'code', 'error', 'error_description', 'error_code'].some(key => !!value(key)),
    failed: !!(value('error') || value('error_code') || value('error_description')),
    description: value('error_description') || value('error_code') || value('error') || '',
  };
}

export function authFailureMessage(description: string) {
  if (/exchange.*external|invalid_client|client.secret/i.test(description)) {
    return 'Google non ha completato l’accesso con Supabase. Il gestore deve verificare che Client ID e Client Secret del provider Google siano copiati direttamente dalla console Google Cloud.';
  }
  if (/access_denied|denied|cancel/i.test(description)) return 'L’accesso Google è stato annullato o non autorizzato. Puoi riprovare oppure usare il link via email.';
  return 'Non è stato possibile completare l’accesso. Riprova dallo stesso browser in cui lo hai iniziato. Se il problema continua, il gestore deve controllare la configurazione Google e gli indirizzi di ritorno su Supabase.';
}

export function safeAuthDestination(path: string | null) {
  if (path === '/organizza' || path === '/partecipa' || /^\/invito\/[a-zA-Z0-9-]+$/.test(path || '')) return path!;
  return '/organizza';
}

export function rememberAuthDestination(path: string) {
  try { sessionStorage.setItem(AUTH_DESTINATION_KEY, safeAuthDestination(path)); } catch { /* explicit redirect remains available without browser storage */ }
}

export function consumeAuthDestination() {
  try { const value = sessionStorage.getItem(AUTH_DESTINATION_KEY); sessionStorage.removeItem(AUTH_DESTINATION_KEY); return safeAuthDestination(value); } catch { return '/organizza'; }
}
