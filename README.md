# Pilkosis Mosa - Sistem Voting Digital

Sistem voting digital untuk pemilihan ketua OSIS dengan fitur token unik dan interface Tinder-like.

## 🚀 Fitur

### Landing Page
- Desain modern dan responsif
- Informasi tentang sistem voting
- Tombol untuk mulai voting dan login admin

### Admin Dashboard
- **CRUD Kandidat**: Tambah, edit, hapus kandidat dengan foto, visi, dan misi
- **Generate Token**: Buat token 5 karakter alfanumerik untuk siswa/guru
- **Manajemen Admin**: Tambah dan kelola admin
- **Hasil Voting**: Lihat hasil voting secara real-time

### Sistem Voting
- **Token Authentication**: Input token 5 karakter sebelum voting
- **Tinder-like Interface**: Swipe kanan/kiri untuk memilih kandidat
- **Mobile-first Design**: Optimized untuk perangkat mobile
- **Point System**: Token siswa = 1 poin, Token guru = 2 poin
- **Konfirmasi**: Konfirmasi pilihan sebelum submit

### Database (Firebase Realtime Database)
- `admins`: Data admin
- `candidates`: Data kandidat
- `tokens`: Token voting
- `votes`: Data voting

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Realtime Database)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Swipe**: React Swipeable

## 📦 Instalasi

### Prerequisites
- Node.js (v16 atau lebih baru)
- npm atau yarn
- Firebase project

### Setup

1. **Clone repository**
```bash
git clone <repository-url>
cd pilkosis-mosa
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup Firebase**
   - Buat project di [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Enable Realtime Database
   - Enable Storage (opsional untuk upload foto)
   - Copy config ke `src/config/firebase.ts`

4. **Update Firebase Config**
```typescript
// src/config/firebase.ts
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

5. **Setup Realtime Database Rules**
```json
{
  "rules": {
    "admins": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "candidates": {
      ".read": true,
      ".write": "auth != null"
    },
    "tokens": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "votes": {
      ".read": "auth != null",
      ".write": true
    }
  }
}
```

6. **Run development server**
```bash
npm run dev
```

7. **Build for production**
```bash
npm run build
```

## 🗂️ Struktur Project

```
src/
├── components/          # Reusable components
│   └── ProtectedRoute.tsx
├── config/             # Configuration files
│   └── firebase.ts
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── pages/              # Page components
│   ├── LandingPage.tsx
│   ├── AdminLogin.tsx
│   ├── AdminDashboard.tsx
│   └── VotingPage.tsx
├── types/              # TypeScript types
│   └── index.ts
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## 🔐 Authentication

### Admin Login
- Email dan password authentication
- Redirect ke dashboard setelah login
- Protected routes untuk admin pages

### Token System
- Token 5 karakter alfanumerik
- Validasi token sebelum voting
- Token hanya bisa digunakan sekali
- Point system: siswa (1 poin), guru (2 poin)

## 📱 Mobile-First Design

- Responsive design untuk semua ukuran layar
- Touch-friendly interface
- Swipe gestures untuk voting
- Optimized untuk mobile devices

## 🎨 UI/UX Features

- Modern gradient backgrounds
- Smooth animations dan transitions
- Toast notifications
- Loading states
- Error handling
- Confirmation dialogs

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- TypeScript untuk type safety
- ESLint untuk code quality
- Prettier untuk formatting
- Tailwind CSS untuk styling

## 🚀 Deployment

### Vercel (Recommended)
1. Push code ke GitHub
2. Connect repository ke Vercel
3. Set environment variables
4. Deploy

### Netlify
1. Build project: `npm run build`
2. Upload `dist` folder ke Netlify
3. Set environment variables

### Firebase Hosting
1. Install Firebase CLI
2. `firebase init hosting`
3. `npm run build`
4. `firebase deploy`

## 📊 Database Schema

### Admins Collection
```typescript
{
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super';
  createdAt: Date;
}
```

### Candidates Collection
```typescript
{
  id: string;
  name: string;
  photo: string;
  vision: string;
  mission: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Tokens Collection
```typescript
{
  id: string;
  code: string; // 5 characters
  type: 'student' | 'teacher';
  class?: string;
  teacher?: string;
  isUsed: boolean;
  usedAt?: Date;
  createdAt: Date;
}
```

### Votes Collection
```typescript
{
  id: string;
  candidateId: string;
  tokenId: string;
  points: number; // 1 for student, 2 for teacher
  createdAt: Date;
}
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

Untuk bantuan dan pertanyaan:
- Buat issue di GitHub
- Hubungi developer

---

**Pilkosis Mosa** - Sistem Voting Digital yang Aman dan Transparan 🗳️



"# pemos-mosa" 
