// src/utils/helpers.js
export const formatDate = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };
  
  export const getStatusColor = (status) => {
    const colors = {
      pending: 'yellow',
      processing: 'blue',
      completed: 'green',
      cancelled: 'red',
      picked_up: 'purple'
    };
    return colors[status] || 'gray';
  };
  
  export const generatePickupCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };