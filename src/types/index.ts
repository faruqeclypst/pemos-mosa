export interface Candidate {
  id: string;
  name: string;
  photo: string;
  photoFile?: File; // For image upload
  vision: string;
  mission: string;
  class?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Token {
  id: string;
  code: string;
  type: 'student' | 'teacher';
  class?: string;
  teacher?: string;
  isUsed: boolean;
  usedAt?: Date;
  createdAt: Date;
}

export interface Vote {
  id: string;
  candidateId: string;
  tokenId: string;
  points: number;
  createdAt: Date;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  password: string; // Add password field
  role: 'super' | 'admin';
  createdAt: Date;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}


