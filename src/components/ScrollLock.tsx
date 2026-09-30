import { useEffect } from 'react';

export default function ScrollLock() {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    return () => {
      document.body.style.overflow = originalOverflow || '';
      document.body.classList.remove('modal-open');
    };
  }, []);

  return null;
}

