import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  mode = signal<AuthMode>('login');
  email = '';
  password = '';
  confirmPassword = '';
  
  loading = this.authService.loading;
  error = this.authService.error;

  get isLogin(): boolean {
    return this.mode() === 'login';
  }

  toggleMode(): void {
    this.mode.update(m => m === 'login' ? 'register' : 'login');
    this.authService.clearError();
    this.password = '';
    this.confirmPassword = '';
  }

  async submit(): Promise<void> {
    if (!this.validateForm()) return;
    
    const result = this.isLogin
      ? await this.authService.login(this.email, this.password)
      : await this.authService.register(this.email, this.password);
    
    if (result) {
      this.router.navigate(['/game']);
    }
  }

  async signInWithGoogle(): Promise<void> {
    const result = await this.authService.signInWithGoogle();
    
    if (result) {
      this.router.navigate(['/game']);
    }
  }

  private validateForm(): boolean {
    if (!this.email || !this.password) {
      return false;
    }
    
    if (!this.isLogin && this.password !== this.confirmPassword) {
      this.authService.error.set({
        code: 'validation-error',
        message: 'Passwords do not match.'
      });
      return false;
    }
    
    return true;
  }
}


