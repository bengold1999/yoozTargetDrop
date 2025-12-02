import { Injectable, inject, signal, computed } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  Timestamp
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';

export interface GameAttempt {
  id?: string;
  userId: string;
  score: number;
  distance: number;
  timestamp: Date;
}

export interface GameStats {
  totalAttempts: number;
  bestScore: number;
  averageScore: number;
  recentAttempts: GameAttempt[];
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  
  private readonly COLLECTION_NAME = 'game_attempts';
  
  loading = signal(false);
  stats = signal<GameStats>({
    totalAttempts: 0,
    bestScore: 0,
    averageScore: 0,
    recentAttempts: []
  });
  
  currentScore = signal<number | null>(null);

  async saveAttempt(score: number, distance: number): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) {
      console.error('Cannot save attempt: user not authenticated');
      return;
    }

    this.loading.set(true);
    
    try {
      const attempt: Omit<GameAttempt, 'id'> = {
        userId: user.uid,
        score,
        distance,
        timestamp: new Date()
      };

      const attemptsCollection = collection(this.firestore, this.COLLECTION_NAME);
      await addDoc(attemptsCollection, {
        ...attempt,
        timestamp: Timestamp.fromDate(attempt.timestamp)
      });

      this.currentScore.set(score);
      
      // Refresh stats after saving
      await this.loadUserStats();
    } catch (error) {
      console.error('Error saving game attempt:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadUserStats(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    this.loading.set(true);
    
    try {
      const attemptsCollection = collection(this.firestore, this.COLLECTION_NAME);
      
      // Get all attempts for the user
      const q = query(
        attemptsCollection,
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const attempts: GameAttempt[] = snapshot.docs.map(doc => ({
        id: doc.id,
        userId: doc.data()['userId'],
        score: doc.data()['score'],
        distance: doc.data()['distance'],
        timestamp: (doc.data()['timestamp'] as Timestamp).toDate()
      }));

      if (attempts.length > 0) {
        const scores = attempts.map(a => a.score);
        const bestScore = Math.max(...scores);
        const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        
        this.stats.set({
          totalAttempts: attempts.length,
          bestScore,
          averageScore,
          recentAttempts: attempts.slice(0, 10) // Last 10 attempts
        });
      } else {
        this.stats.set({
          totalAttempts: 0,
          bestScore: 0,
          averageScore: 0,
          recentAttempts: []
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      this.loading.set(false);
    }
  }

  calculateScore(distance: number, maxDistance: number): number {
    // Perfect hit (distance = 0) gives 1000 points
    // Score decreases linearly based on distance
    // Minimum score is 0 when distance >= maxDistance
    if (distance >= maxDistance) return 0;
    
    const normalizedDistance = distance / maxDistance;
    const score = Math.round(1000 * (1 - normalizedDistance));
    
    return Math.max(0, score);
  }

  resetCurrentScore(): void {
    this.currentScore.set(null);
  }
}


