import { describe, expect, it } from 'vitest';
import { authFailureMessage, readAuthReturn, safeAuthDestination } from '../src/authReturn';

describe('ritorno di autenticazione', () => {
  it('riconosce sessioni ed errori sia nella query che nel frammento', () => {
    expect(readAuthReturn('https://example.com/organizza#access_token=test&refresh_token=test').callback).toBe(true);
    expect(readAuthReturn('https://example.com/?error=server_error&error_description=Unable+to+exchange+external+code').failed).toBe(true);
    expect(readAuthReturn('https://example.com/#error=access_denied').failed).toBe(true);
    expect(readAuthReturn('https://example.com/organizza').callback).toBe(false);
  });
  it('spiega gli errori senza mostrare codici OAuth o descrizioni riservate', () => {
    const message = authFailureMessage('Unable to exchange external code: private-authorization-code');
    expect(message).toContain('Client Secret');
    expect(message).not.toContain('private-authorization-code');
  });
  it('ammette solo destinazioni interne previste', () => {
    expect(safeAuthDestination('/invito/ABC123')).toBe('/invito/ABC123');
    expect(safeAuthDestination('//attacker.example')).toBe('/organizza');
    expect(safeAuthDestination('https://attacker.example')).toBe('/organizza');
    expect(safeAuthDestination(null)).toBe('/organizza');
  });
});
