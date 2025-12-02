import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'game',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'game',
    loadComponent: () => import('./components/game/game.component').then(m => m.GameComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'game'
  }
];


