import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

export const authGuard = (route?: ActivatedRouteSnapshot): boolean => {
  const router = inject(Router);

  // Hämta användarens roll och admin-status från localStorage
  const userRole = localStorage.getItem('userRole'); // Exempel: 'admin', 'manager', etc.
  const isAdmin = localStorage.getItem('isAdmin') === 'true'; // För backward compatibility

  // Om route-data innehåller en förväntad roll, kontrollera åtkomst
  const expectedRole = route?.data?.['role'];

  // Logga roller för debug

  // Kontrollera om användaren är admin (alltid tillåten)
  if (isAdmin) {
    return true;
  }

  // Kontrollera om användarens roll matchar den förväntade rollen
  if (expectedRole && userRole !== expectedRole) {
    console.warn(`Access denied: User role "${userRole}" does not match required role "${expectedRole}"`);
    router.navigate(['/']); // Omdirigera vid obehörig åtkomst
    return false;
  }

  // Om ingen roll krävs eller om roll matchar
  return true;
};
