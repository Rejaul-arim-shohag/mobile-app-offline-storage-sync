export const formatToday = () =>
  new Date().toLocaleDateString('en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
