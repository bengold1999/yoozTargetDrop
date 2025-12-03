# 🎯 Drop Target

A timing-based skill game built with Angular 17 and Firebase. Test your reflexes by dropping a ball and trying to hit the target!

![Drop Target Game](https://img.shields.io/badge/Angular-17-red?style=flat-square&logo=angular)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-orange?style=flat-square&logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)

---

## 📋 About This Project

This project was developed as a **homework assignment for a Developer position at Yooz (2025)**.

### Assignment Requirements

The task was designed to evaluate proficiency in:
- **Angular** framework for frontend development
- **Firebase Authentication** for user management
- **Cloud Firestore** for data persistence
- Game logic implementation with physics simulation

### Core Requirements Fulfilled

**1. Client-Side Game Development**
- ✅ Ball animation using HTML/CSS/SCSS rendered through Angular components
- ✅ Horizontal movement of the ball across the screen
- ✅ Drop mechanism triggered by user button press
- ✅ Gravity-based physics simulation (accelerating downward velocity)
- ✅ Collision detection and distance calculation between ball landing position and target center
- ✅ Dynamic scoring system based on accuracy (distance from target)

**2. User Management with Firebase Auth**
- ✅ User registration with email and password
- ✅ User login/authentication flow
- ✅ Protected game access (authenticated users only)
- ✅ Personal score tracking per user

**3. Data Persistence with Firestore**
- ✅ Each game attempt is saved to Firestore with:
  - User ID (UID)
  - Score (calculated based on accuracy)
  - Timestamp (date and time of attempt)
- ✅ Retrieval and display of user's game history
- ✅ Calculation of statistics (best score, average, total games played)

### Additional Features Beyond Requirements

To provide a polished and production-ready experience, the following enhancements were added:
- Modern, responsive dark-themed UI design
- Real-time statistics dashboard (best score, average, total attempts)
- Attempt history with detailed breakdown
- Route guards for security (auth and guest guards)
- Smooth animations and visual feedback
- Mobile-responsive layout
- Comprehensive error handling and user feedback

### Development Approach

As recommended in the assignment brief, **AI-assisted development tools** were utilized throughout the project to optimize the development process, including:
- Code generation and scaffolding
- Problem-solving and debugging
- Best practices implementation
- Documentation

---

## 🎮 Game Features

- **Simple but addictive gameplay**: Watch the ball move across the screen and press DROP at the right moment
- **Physics-based falling**: Ball accelerates with gravity for realistic movement
- **Scoring system**: 
  - Perfect hit (center) = 1000 points
  - Score decreases based on distance from target center
- **Personal stats**: Track your best score, average, and total plays
- **Attempt history**: View your recent game attempts with timestamps
- **Beautiful UI**: Modern dark theme with smooth animations

## 🛠️ Tech Stack

- **Frontend**: Angular 17 (Standalone Components)
- **Styling**: SCSS with CSS Variables
- **Authentication**: Firebase Auth (Email/Password)
- **Database**: Cloud Firestore
- **State Management**: Angular Signals

## 📋 Prerequisites

- Node.js 18+ 
- npm 9+
- A Firebase project with:
  - Authentication (Email/Password provider enabled)
  - Cloud Firestore database

## 🚀 Quick Start

```bash
npm install
```

**⚠️ Important**: Before running the app, you need to configure Firebase credentials.  
👉 **See [SETUP.md](./SETUP.md) for detailed setup instructions.**

## 🔒 Firestore Security Rules

In Firebase Console > Firestore > Rules, set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own game attempts
    match /game_attempts/{attemptId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## 📑 Firestore Index

Create a composite index for the `game_attempts` collection:
- Collection: `game_attempts`
- Fields: `userId` (Ascending), `timestamp` (Descending)

Or simply run the app and click the link in the console error to auto-create the index.

## 🏃 Running the App

```bash
npm start
```

Navigate to `http://localhost:4200`

## 🎯 How to Play

1. **Register/Login**: Create an account or sign in
2. **Press START**: The ball begins moving left to right
3. **Press DROP**: Release the ball at the right moment
4. **Watch it fall**: The ball accelerates downward with gravity
5. **Score points**: The closer to the target center, the higher your score!

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── auth/           # Login/Register component
│   │   └── game/           # Main game component
│   ├── guards/
│   │   ├── auth.guard.ts   # Protects game route
│   │   └── guest.guard.ts  # Redirects logged-in users
│   ├── services/
│   │   ├── auth.service.ts # Firebase Auth wrapper
│   │   └── game.service.ts # Game logic & Firestore
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── environments/
│   └── environment.ts      # Firebase config
├── styles.scss             # Global styles
└── index.html
```

## 🎨 Customization

### Adjust Game Difficulty

In `game.component.ts`, modify these constants:

```typescript
private readonly BALL_SPEED = 4;     // Horizontal movement speed
private readonly GRAVITY = 0.5;       // Falling acceleration
private readonly MAX_VELOCITY = 20;   // Maximum fall speed
```

### Change Scoring

In `game.service.ts`, modify the `calculateScore` method to adjust scoring curves.

### Theme Colors

Edit CSS variables in `styles.scss`:

```scss
:root {
  --color-accent-primary: #06b6d4;   // Main accent color
  --color-accent-secondary: #8b5cf6; // Secondary accent
  // ... more variables
}
```

## 📊 Firestore Data Structure

```typescript
// Collection: game_attempts
{
  id: string;           // Auto-generated
  userId: string;       // Firebase Auth UID
  score: number;        // 0-1000
  timestamp: Timestamp; // When the attempt was made
}
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run unit tests |

## 📱 Responsive Design

The game is fully responsive and works on:
- Desktop (recommended for best experience)
- Tablet
- Mobile (portrait & landscape)

## 🎓 Project Context

This application was created as part of a technical assessment for **Yooz**, demonstrating:
- Full-stack development capabilities with modern web technologies
- Understanding of game mechanics and physics simulation
- Ability to integrate third-party services (Firebase)
- Clean code architecture and best practices
- User experience design and responsive interfaces

**Note**: AI tools (ChatGPT, Google AI Studio, etc.) were used as recommended in the assignment guidelines to enhance development efficiency, mirroring real-world professional workflows.

---

Built with ❤️ using Angular and Firebase | Homework Assignment for Yooz 2025


