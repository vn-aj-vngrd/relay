/** Block only recognizable credentials before any chat text reaches a provider. */
const obviousSecret =
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bsk-or-v1-[a-f0-9]{32,}\b|\bsb_secret_[a-zA-Z0-9]{20,}\b|\bghp_[a-zA-Z0-9]{30,}\b|\bsk_live_[a-zA-Z0-9]{20,}\b/i;

export function containsObviousSecret(text: string) {
  return obviousSecret.test(text);
}
