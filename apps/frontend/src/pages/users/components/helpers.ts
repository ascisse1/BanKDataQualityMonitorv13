export const formatDate = (dateString: string) => {
  if (!dateString) return 'Jamais';
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-primary-100 text-primary-800';
    case 'AUDITOR':
      return 'bg-secondary-100 text-secondary-800';
    case 'AGENCY_USER':
      return 'bg-success-100 text-success-800';
    case 'USER':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getRoleLabel = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'Administrateur';
    case 'AUDITOR':
      return 'Auditeur';
    case 'AGENCY_USER':
      return 'Utilisateur Agence';
    case 'USER':
      return 'Utilisateur';
    default:
      return role;
  }
};

export const getStatusColor = (status: string) => {
  return status === 'ACTIVE'
    ? 'bg-success-100 text-success-800'
    : 'bg-error-100 text-error-800';
};
