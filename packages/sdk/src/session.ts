/** Generates a fake payment session id, e.g. `sess_8f3a7c2d91`. Not cryptographically
 * meaningful — this stands in for a session id a real payment backend would issue. */
export function createSessionId(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `sess_${hex}`;
}
