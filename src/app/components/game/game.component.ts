import { Component, inject, signal, computed, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GameService, GameAttempt } from '../../services/game.service';

type GameState = 'ready' | 'moving' | 'falling' | 'landed';

interface BallPosition {
  x: number;
  y: number;
}

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('gameArea') gameAreaRef!: ElementRef<HTMLDivElement>;
  
  private authService = inject(AuthService);
  private gameService = inject(GameService);
  private router = inject(Router);
  
  // Game constants
  private readonly BALL_SIZE = 30;
  private readonly TARGET_SIZE = 80;
  private readonly BALL_SPEED = 4; // pixels per frame
  private readonly GRAVITY = 0.5;
  private readonly MAX_VELOCITY = 20;
  
  // Game dimensions (will be set based on container)
  private gameWidth = 800;
  private gameHeight = 600;
  
  // Animation
  private animationFrameId: number | null = null;
  private velocity = 0;
  private direction = 1; // 1 = right, -1 = left
  
  // Signals
  gameState = signal<GameState>('ready');
  ballPosition = signal<BallPosition>({ x: 0, y: 50 });
  targetPosition = signal<BallPosition>({ x: 0, y: 0 });
  lastScore = signal<number | null>(null);
  isNewBest = signal(false);
  showScoreAnimation = signal(false);
  
  // User data
  currentUser = this.authService.currentUser;
  stats = this.gameService.stats;
  loading = this.gameService.loading;
  
  // Computed
  userEmail = computed(() => {
    const user = this.currentUser();
    return user?.email?.split('@')[0] || 'Player';
  });

  ngOnInit(): void {
    this.gameService.loadUserStats();
  }

  ngAfterViewInit(): void {
    this.setupGameDimensions();
    this.resetGame();
    
    // Handle window resize
    window.addEventListener('resize', () => this.setupGameDimensions());
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', () => this.setupGameDimensions());
  }

  private setupGameDimensions(): void {
    if (this.gameAreaRef) {
      const rect = this.gameAreaRef.nativeElement.getBoundingClientRect();
      this.gameWidth = rect.width;
      this.gameHeight = rect.height;
      
      // Set target position at bottom center
      this.targetPosition.set({
        x: (this.gameWidth - this.TARGET_SIZE) / 2,
        y: this.gameHeight - this.TARGET_SIZE - 5
      });
    }
  }

  startGame(): void {
    if (this.gameState() !== 'ready') return;
    
    this.gameState.set('moving');
    this.lastScore.set(null);
    this.isNewBest.set(false);
    this.showScoreAnimation.set(false);
    this.velocity = 0;
    this.gameService.resetCurrentScore();
    
    this.animate();
  }

  dropBall(): void {
    if (this.gameState() !== 'moving') return;
    
    this.gameState.set('falling');
  }

  private animate = (): void => {
    const state = this.gameState();
    
    if (state === 'moving') {
      this.moveBallHorizontally();
    } else if (state === 'falling') {
      this.moveBallDown();
    }
    
    if (state === 'moving' || state === 'falling') {
      this.animationFrameId = requestAnimationFrame(this.animate);
    }
  };

  private moveBallHorizontally(): void {
    const pos = this.ballPosition();
    let newX = pos.x + (this.BALL_SPEED * this.direction);
    
    // Bounce off walls
    if (newX <= 0) {
      newX = 0;
      this.direction = 1;
    } else if (newX >= this.gameWidth - this.BALL_SIZE) {
      newX = this.gameWidth - this.BALL_SIZE;
      this.direction = -1;
    }
    
    this.ballPosition.set({ ...pos, x: newX });
  }

  private moveBallDown(): void {
    const pos = this.ballPosition();
    
    // Apply gravity
    this.velocity = Math.min(this.velocity + this.GRAVITY, this.MAX_VELOCITY);
    const newY = pos.y + this.velocity;
    
    // Check if ball has landed
    // Position ball so its center aligns with target center
    const targetCenterY = this.gameHeight - this.TARGET_SIZE - 5 + (this.TARGET_SIZE / 2);
    const landingY = targetCenterY - (this.BALL_SIZE / 2);
    
    if (newY >= landingY) {
      this.ballPosition.set({ ...pos, y: landingY });
      this.handleLanding();
    } else {
      this.ballPosition.set({ ...pos, y: newY });
    }
  }

  private async handleLanding(): Promise<void> {
    this.gameState.set('landed');
    
    const ballPos = this.ballPosition();
    const targetPos = this.targetPosition();
    
    // Calculate center points
    const ballCenterX = ballPos.x + this.BALL_SIZE / 2;
    const targetCenterX = targetPos.x + this.TARGET_SIZE / 2;
    
    // Calculate distance
    const distance = Math.abs(ballCenterX - targetCenterX);
    
    // Calculate score (max distance is half the game width)
    const maxDistance = this.gameWidth / 2;
    const score = this.gameService.calculateScore(distance, maxDistance);
    
    // Check if new best
    const currentBest = this.stats().bestScore;
    if (score > currentBest) {
      this.isNewBest.set(true);
    }
    
    this.lastScore.set(score);
    this.showScoreAnimation.set(true);
    
    // Save attempt to Firestore
    await this.gameService.saveAttempt(score, distance);
  }

  resetGame(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.gameState.set('ready');
    this.velocity = 0;
    this.direction = 1;
    this.showScoreAnimation.set(false);
    
    // Reset ball to top-left
    this.ballPosition.set({ x: 50, y: 50 });
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/auth']);
  }

  getScoreClass(score: number): string {
    if (score >= 995) return 'score-perfect';
    if (score >= 900) return 'score-great';
    if (score >= 750) return 'score-good';
    if (score >= 500) return 'score-ok';
    return 'score-miss';
  }

  getScoreLabel(score: number): string {
    if (score >= 995) return 'PERFECT!';
    if (score >= 900) return 'GREAT!';
    if (score >= 750) return 'GOOD!';
    if (score >= 500) return 'OK';
    return 'MISS';
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}


