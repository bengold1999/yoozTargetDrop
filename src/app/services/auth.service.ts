import { Injectable, inject, signal, computed } from '@angular/core';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  user,
  User
} from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export interface AuthError {
  code: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  
  // Convert Firebase user observable to signal
  private user$ = user(this.auth);
  currentUser = toSignal(this.user$, { initialValue: null });
  
  isAuthenticated = computed(() => !!this.currentUser());
  loading = signal(false);
  error = signal<AuthError | null>(null);

  async register(email: string, password: string): Promise<User | null> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      return credential.user;
    } catch (err: any) {
      this.error.set({
        code: err.code,
        message: this.getErrorMessage(err.code)
      });
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async login(email: string, password: string): Promise<User | null> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      return credential.user;
    } catch (err: any) {
      this.error.set({
        code: err.code,
        message: this.getErrorMessage(err.code)
      });
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async signInWithGoogle(): Promise<User | null> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.auth, provider);
      return credential.user;
    } catch (err: any) {
      this.error.set({
        code: err.code,
        message: this.getErrorMessage(err.code)
      });
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async logout(): Promise<void> {
    this.loading.set(true);
    try {
      await signOut(this.auth);
    } catch (err: any) {
      this.error.set({
        code: err.code,
        message: this.getErrorMessage(err.code)
      });
    } finally {
      this.loading.set(false);
    }
  }

  clearError(): void {
    this.error.set(null);
  }

  private getErrorMessage(code: string): string {
    const errorMessages: Record<string, string> = {
      'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed before completing.',
      'auth/cancelled-popup-request': 'Sign-in was cancelled.',
      'auth/popup-blocked': 'Sign-in popup was blocked by the browser.',
      'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.'
    };
    
    return errorMessages[code] || 'An unexpected error occurred. Please try again.';
  }
}


