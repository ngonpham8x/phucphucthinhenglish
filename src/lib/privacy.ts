export function maskEmail(email: string | null | undefined): string {
  if (!email) return 'Tài khoản nội bộ';

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return 'Tài khoản nội bộ';

  const visiblePrefix = localPart.slice(0, 1);
  return `${visiblePrefix}•••@${domain}`;
}
