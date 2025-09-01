import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

export const authGuard = (route?: ActivatedRouteSnapshot): boolean => {
  const router = inject(Router);

  // Hämta användarens roll och admin-status från localStorage
  const userRole = localStorage.getItem('userRole'); // Exempel: 'admin', 'manager', 'developer'
  const isAdmin = localStorage.getItem('isAdmin') === 'true'; // För backward compatibility

  // Hämta de förväntade rollerna från route-data
  let expectedRoles = route?.data?.['role'];

  // Om användaren är admin, tillåt alltid åtkomst
  if (isAdmin) {
    return true;
  }

  // Om expectedRoles är en sträng, konvertera den till en array
  if (typeof expectedRoles === 'string') {
    expectedRoles = [expectedRoles];
  }

  // Om ingen roll krävs, tillåt åtkomst
  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  // Kontrollera om användarens roll finns i listan över tillåtna roller
  if (!expectedRoles.includes(userRole)) {
    console.warn(`Access denied: User role "${userRole}" is not in allowed roles: ${expectedRoles.join(', ')}`);
    router.navigate(['/']); // Omdirigera vid obehörig åtkomst
    return false;
  }

  // Om rollen matchar, tillåt åtkomst
  return true;
};
