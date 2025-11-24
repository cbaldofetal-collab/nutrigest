/**
 * Formats gestational age from weeks to weeks and days format
 * @param semanas - Number of weeks (can be decimal like 24.5)
 * @returns Formatted string like "24 semanas e 3 dias"
 */
export const formatGestationalAge = (semanas: number): string => {
  if (!semanas || semanas <= 0) return 'Semana 0';
  
  const semanasInt = Math.floor(semanas);
  const dias = Math.round((semanas - semanasInt) * 7);
  
  if (dias === 0) {
    return `${semanasInt} semana${semanasInt === 1 ? '' : 's'}`;
  }
  
  return `${semanasInt} semana${semanasInt === 1 ? '' : 's'} e ${dias} dia${dias === 1 ? '' : 's'}`;
};

/**
 * Formats gestational age for display in the dashboard
 * @param semanas - Number of weeks (can be decimal like 24.5)
 * @returns Formatted string like "24 semanas e 3 dias de gestação"
 */
export const formatGestationalAgeForDashboard = (semanas: number): string => {
  if (!semanas || semanas <= 0) return 'Gestação não informada';
  
  return `${formatGestationalAge(semanas)} de gestação`;
};