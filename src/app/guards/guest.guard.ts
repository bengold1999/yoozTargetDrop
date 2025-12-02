import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  
  return user(auth).pipe(
    take(1),
    map(currentUser => {
      if (!currentUser) {
        return true;
      }
      router.navigate(['/game']);
      return false;
    })
  );
};


