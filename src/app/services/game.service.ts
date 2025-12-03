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
  doc,
  setDoc,
  getDoc,
  Timestamp
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';

export interface GameAttempt {
  id?: string;
  userId: string;
  score: number;
  timestamp: Date;
}

export interface GameStats {
  totalAttempts: number;
  bestScore: number;
  recentAttempts: GameAttempt[];
}

export interface UserGameProfile {
  userId: string;
  bestScore: number;
  totalPlays: number;
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  
  private readonly COLLECTION_NAME = 'game_attempts';
  private readonly USER_PROFILES_COLLECTION = 'user_game_profiles';
  
  loading = signal(false);
  stats = signal<GameStats>({
    totalAttempts: 0,
    bestScore: 0,
    recentAttempts: []
  });
  
  currentScore = signal<number | null>(null);

  async saveAttempt(score: number): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) {
      console.error('❌ Cannot save attempt: user not authenticated');
      return;
    }

    console.log('💾 Saving attempt - Score:', score);
    this.loading.set(true);
    
    try {
      const attempt: Omit<GameAttempt, 'id'> = {
        userId: user.uid,
        score,
        timestamp: new Date()
      };

      // Save the attempt to game_attempts collection
      const attemptsCollection = collection(this.firestore, this.COLLECTION_NAME);
      console.log('💾 Saving to', this.COLLECTION_NAME, 'collection...');
      await addDoc(attemptsCollection, {
        ...attempt,
        timestamp: Timestamp.fromDate(attempt.timestamp)
      });
      console.log('✅ Attempt saved successfully');

      this.currentScore.set(score);
      
      // Update user profile with best score and total plays
      console.log('📝 Updating user profile...');
      await this.updateUserProfile(user.uid, score);
      console.log('✅ Profile updated');
      
      // Refresh stats after saving
      console.log('🔄 Refreshing stats...');
      await this.loadUserStats();
    } catch (error: any) {
      console.error('❌ Error saving game attempt:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      
      if (error?.code === 'permission-denied') {
        console.error('🔒 PERMISSION DENIED - Check Firestore security rules!');
        alert('Cannot save game - please check Firebase permissions');
      }
    } finally {
      this.loading.set(false);
    }
  }

  private async updateUserProfile(userId: string, newScore: number): Promise<void> {
    try {
      const profileRef = doc(this.firestore, this.USER_PROFILES_COLLECTION, userId);
      console.log('🔍 Checking existing profile...');
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const currentData = profileSnap.data() as UserGameProfile;
        const newBestScore = Math.max(currentData.bestScore, newScore);
        const newTotalPlays = currentData.totalPlays + 1;

        console.log('📝 Updating existing profile - Best:', newBestScore, 'Total Plays:', newTotalPlays);
        await setDoc(profileRef, {
          userId,
          bestScore: newBestScore,
          totalPlays: newTotalPlays,
          lastUpdated: Timestamp.fromDate(new Date())
        });
        console.log('✅ Profile updated successfully');
      } else {
        // Create new profile
        console.log('🆕 Creating new profile - Score:', newScore);
        await setDoc(profileRef, {
          userId,
          bestScore: newScore,
          totalPlays: 1,
          lastUpdated: Timestamp.fromDate(new Date())
        });
        console.log('✅ New profile created successfully');
      }
    } catch (error: any) {
      console.error('❌ Error updating user profile:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      throw error; // Re-throw to be caught by parent
    }
  }

  async loadUserStats(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) {
      console.log('❌ Cannot load stats - user not authenticated');
      return;
    }

    console.log('📊 Loading user stats for:', user.uid);
    this.loading.set(true);
    
    try {
      // Get user profile for best score and total plays
      const profileRef = doc(this.firestore, this.USER_PROFILES_COLLECTION, user.uid);
      console.log('🔍 Fetching profile from:', this.USER_PROFILES_COLLECTION);
      const profileSnap = await getDoc(profileRef);
      
      let bestScore = 0;
      let totalAttempts = 0;
      
      if (profileSnap.exists()) {
        const profile = profileSnap.data() as UserGameProfile;
        bestScore = profile.bestScore;
        totalAttempts = profile.totalPlays;
        console.log('✅ Profile found - Best:', bestScore, 'Plays:', totalAttempts);
      } else {
        console.log('⚠️ No profile found yet - user needs to play first game');
      }
      
      // Get recent attempts for history display
      const attemptsCollection = collection(this.firestore, this.COLLECTION_NAME);
      console.log('🔍 Fetching recent attempts...');
      
      let recentAttempts: GameAttempt[] = [];
      
      try {
        // Try with orderBy (requires index)
        const q = query(
          attemptsCollection,
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        recentAttempts = snapshot.docs.map(doc => ({
          id: doc.id,
          userId: doc.data()['userId'],
          score: doc.data()['score'],
          timestamp: (doc.data()['timestamp'] as Timestamp).toDate()
        }));
        console.log('✅ Found', recentAttempts.length, 'recent attempts');
      } catch (indexError: any) {
        console.warn('⚠️ Index not ready, using simple query and sorting in memory');
        // Fallback: simple query without orderBy, sort in memory
        const simpleQuery = query(
          attemptsCollection,
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(simpleQuery);
        recentAttempts = snapshot.docs
          .map(doc => ({
            id: doc.id,
            userId: doc.data()['userId'],
            score: doc.data()['score'],
            timestamp: (doc.data()['timestamp'] as Timestamp).toDate()
          }))
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 10);
        console.log('✅ Found', recentAttempts.length, 'recent attempts (sorted in memory)');
      }

      this.stats.set({
        totalAttempts,
        bestScore,
        recentAttempts
      });
      
      console.log('✅ Stats updated successfully!');
    } catch (error: any) {
      console.error('❌ Error loading user stats:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      
      // Show user-friendly error
      if (error?.code === 'permission-denied') {
        console.error('🔒 PERMISSION DENIED - Check Firestore security rules!');
      }
    } finally {
      this.loading.set(false);
    }
  }

  calculateScore(distance: number, maxDistance: number): number {
    // Scoring based on horizontal distance from target center
    // Perfect zone (within 10px) gives exactly 1000 points
    // Within target radius gives high scores
    // Uses exponential decay for forgiving scoring
    
    if (distance >= maxDistance) return 0;
    
    // Perfect zone - if within 10 pixels of center, give 1000
    if (distance <= 10) {
      return 1000;
    }
    
    // Target radius is 40px (half of 80px target size)
    const targetRadius = 40;
    
    // If ball center is within target radius, give very high scores
    if (distance <= targetRadius) {
      // Use exponential curve for smoother scoring within target
      const normalizedDistance = (distance - 10) / (targetRadius - 10);
      // This gives ~950-999 for close to center, ~850 for edge of target
      const score = Math.round(940 * Math.pow(1 - normalizedDistance, 0.5) + 60);
      return Math.max(850, Math.min(999, score));
    }
    
    // Outside target: linear decay to 0
    const remainingDistance = distance - targetRadius;
    const remainingMaxDistance = maxDistance - targetRadius;
    const normalizedRemaining = remainingDistance / remainingMaxDistance;
    const score = Math.round(850 * (1 - normalizedRemaining));
    
    return Math.max(0, score);
  }

  resetCurrentScore(): void {
    this.currentScore.set(null);
  }
}


