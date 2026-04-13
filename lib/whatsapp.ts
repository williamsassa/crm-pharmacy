export function generateWhatsAppUrl(
  phone: string,
  patientName: string,
  pharmacyName: string,
): string {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const formattedPhone = cleanPhone.startsWith('+')
    ? cleanPhone.slice(1)
    : cleanPhone;

  const message = `Bonjour ${patientName || ''}, c'est la ${pharmacyName || 'Pharmacie FATIMA'}. Nous espérons que vous allez bien. Cela fait un moment que nous ne vous avons pas vu. N'hésitez pas à passer pour un suivi de votre traitement. A bientôt !`;

  const encodedMessage = encodeURIComponent(message.trim());

  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

export function generateCustomWhatsAppUrl(
  phone: string,
  message: string,
): string {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const formattedPhone = cleanPhone.startsWith('+')
    ? cleanPhone.slice(1)
    : cleanPhone;
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}
