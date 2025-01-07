import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = (): boolean => {
  const router = inject(Router);

  // Hämta admin-status från localStorage
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  if (!isAdmin) {
    console.warn('Access denied: Redirecting to login');
    router.navigate(['/']); // Omdirigera till login
    return false;
  }

  console.log('Access granted: User is admin');
  return true;
};
