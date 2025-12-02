# Setup Instructions

## Environment Configuration

1. Copy the example environment files:
   ```bash
   cp src/environments/environment.example.ts src/environments/environment.ts
   cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts
   ```

2. Update the environment files with your Firebase credentials:
   - Get your Firebase config from [Firebase Console](https://console.firebase.google.com/)
   - Replace all `YOUR_*` placeholders with your actual Firebase project values

## Installation

```bash
npm install
```

## Development

```bash
npm start
```

## Build

```bash
npm run build
```

## Security Note

⚠️ **Never commit the actual `environment.ts` or `environment.prod.ts` files** - they contain sensitive Firebase credentials and are already in `.gitignore`.

