import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { ref, push, remove, update, onValue, get } from 'firebase/database';
import { 
  Users, 
  Key, 
  Settings, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  BarChart3,
  Copy,
  CheckCircle,
  PieChart,
  TrendingUp,
  Download,
  RefreshCw,
  Lightbulb,
  X
} from 'lucide-react';
import { Candidate, Token, Admin } from '../types';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('candidates');
  const [tokenTab, setTokenTab] = useState('all');
  const [resultsTab, setResultsTab] = useState('ranking');

  const [chartType, setChartType] = useState('bar');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  // const [admins, setAdmins] = useState<Admin[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isConnected, setIsConnected] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [tokensPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'code' | 'type' | 'class' | 'isUsed' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();

  // Fast lookup of existing token codes to avoid duplicates
  const existingTokenCodeSet = useMemo(() => {
    const set = new Set<string>();
    tokens.forEach(t => set.add(t.code));
    return set;
  }, [tokens]);

  // Reset current page when token tab or search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tokenTab, searchTerm]);

  // Form states
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [showEditCandidate, setShowEditCandidate] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showDeleteAllDropdown, setShowDeleteAllDropdown] = useState(false);
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [deleteClassSelected, setDeleteClassSelected] = useState('');
  const [showQuickGenerate, setShowQuickGenerate] = useState(false);
  const [quickScope, setQuickScope] = useState<'all_classes' | 'selected_classes' | 'teachers'>('all_classes');
  const [quickPerClassCount, setQuickPerClassCount] = useState(1);
  const [quickSelectedClasses, setQuickSelectedClasses] = useState<string[]>([]);
  const [quickPreset, setQuickPreset] = useState('');
  const [addingCandidate, setAddingCandidate] = useState(false);
  const [jumpToPage, setJumpToPage] = useState('');
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  } | null>(null);

  // Candidate form
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    photo: '',
    photoFile: null as File | null,
    vision: '',
    mission: '',
    class: ''
  });

  // Edit candidate state
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  // Token form
  const [tokenForm, setTokenForm] = useState({
    type: 'student' as 'student' | 'teacher',
    class: '',
    customClass: '',
    count: '1'
  });

  // Admin form
  const [adminForm, setAdminForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'admin' as 'admin' | 'super'
  });

  // Timer for current time updates with debouncing
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 2000); // Reduced from 1 second to 2 seconds for better performance

    return () => clearInterval(timer);
  }, []);



  useEffect(() => {
    // Set up real-time listeners
    const candidatesRef = ref(db, 'candidates');
    const tokensRef = ref(db, 'tokens');
    const adminsRef = ref(db, 'admins');
    const votesRef = ref(db, 'votes');

    // Real-time listener for candidates
    const candidatesUnsubscribe = onValue(candidatesRef, (snapshot) => {
      const candidatesData: Candidate[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          candidatesData.push({
            id: childSnapshot.key!,
            ...data,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
          });
        });
      }
      setCandidates(candidatesData);
      setLastUpdate(new Date());
      setIsConnected(true);
    }, (error) => {
      console.error('Candidates listener error:', error);
      setIsConnected(false);
    });

    // Real-time listener for tokens
    const tokensUnsubscribe = onValue(tokensRef, (snapshot) => {
      const tokensData: Token[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          tokensData.push({
            id: childSnapshot.key!,
            ...data,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            usedAt: data.usedAt ? new Date(data.usedAt) : undefined
          });
        });
      }
      setTokens(tokensData);
      setLastUpdate(new Date());
      setIsConnected(true);
    }, (error) => {
      console.error('Tokens listener error:', error);
      setIsConnected(false);
    });

    // Real-time listener for admins
    const adminsUnsubscribe = onValue(adminsRef, (snapshot) => {
      const adminsData: Admin[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          adminsData.push({
            id: childSnapshot.key!,
            ...data,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
          });
        });
      }
      // setAdmins(adminsData);
      setLastUpdate(new Date());
      setIsConnected(true);
    }, (error) => {
      console.error('Admins listener error:', error);
      setIsConnected(false);
    });

    // Real-time listener for votes with debouncing
    const votesUnsubscribe = onValue(votesRef, (snapshot) => {
      const votesData: any[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          votesData.push({
            id: childSnapshot.key!,
            ...data,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
          });
        });
      }
      
      // Only update if votes data actually changed to prevent unnecessary re-renders
      setVotes(prevVotes => {
        const prevVotesString = JSON.stringify(prevVotes.map(v => ({ id: v.id, points: v.points, candidateId: v.candidateId })));
        const newVotesString = JSON.stringify(votesData.map(v => ({ id: v.id, points: v.points, candidateId: v.candidateId })));
        
        if (prevVotesString !== newVotesString) {
          // Debounce last update to reduce chart re-renders
          setTimeout(() => {
            setLastUpdate(new Date());
          }, 1000);
          return votesData;
        }
        return prevVotes;
      });
      
      setIsConnected(true);
    }, (error) => {
      console.error('Votes listener error:', error);
      setIsConnected(false);
    });

    setLoading(false);

    // Cleanup listeners on unmount
    return () => {
      candidatesUnsubscribe();
      tokensUnsubscribe();
      adminsUnsubscribe();
      votesUnsubscribe();
    };
  }, []);

  // fetchData function removed - replaced with real-time listeners

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Generate a unique token code that doesn't exist in current set
  const generateUniqueToken = () => {
    let code = generateToken();
    let attempts = 0;
    while (existingTokenCodeSet.has(code) && attempts < 50) {
      code = generateToken();
      attempts++;
    }
    return code;
  };

  // Compress image to WebP (returns data URL)
  const compressImageToWebP = (
    file: File,
    maxWidth = 1024,
    quality = 0.9
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          const scale = Math.min(1, maxWidth / img.width);
          const width = Math.round(img.width * scale);
          const height = Math.round(img.height * scale);

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas not supported'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const dataUrl = canvas.toDataURL('image/webp', quality);
            resolve(dataUrl);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddingCandidate(true);
      let photoUrl = candidateForm.photo;
      
      // If there's a file uploaded, convert it to base64
      if (candidateForm.photoFile) {
        photoUrl = await compressImageToWebP(candidateForm.photoFile, 1024, 0.9);
      }
      
      const newCandidate = {
        ...candidateForm,
        photo: photoUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const candidatesRef = ref(db, 'candidates');
      await push(candidatesRef, newCandidate);
      setCandidateForm({ name: '', photo: '', photoFile: null, vision: '', mission: '', class: '' });
      toast.success('Kandidat berhasil ditambahkan');
      setShowAddCandidate(false);
    } catch (error) {
      console.error('Error adding candidate:', error);
      toast.error('Gagal menambahkan kandidat');
    } finally {
      setAddingCandidate(false);
    }
  };

  const handleAddTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tokensRef = ref(db, 'tokens');
      const updates: Record<string, any> = {};
      const count = Math.max(1, Math.min(100, Number(tokenForm.count) || 1));
      for (let i = 0; i < count; i++) {
        const newKey = push(tokensRef).key as string;
        const token: any = {
          code: generateUniqueToken(),
          type: tokenForm.type,
          isUsed: false,
          createdAt: new Date().toISOString()
        };
        if (tokenForm.type === 'student') {
          const classValue = tokenForm.class === '__custom' ? (tokenForm.customClass || '') : (tokenForm.class || '');
          token.class = classValue;
        }
        updates[newKey] = token;
      }
      await update(tokensRef, updates);
      
      setTokenForm({ type: 'student', class: '', customClass: '', count: '1' });
      setShowAddToken(false);
      toast.success(`${tokenForm.count} token berhasil dibuat`);
    } catch (error) {
      console.error('Error adding tokens:', error);
      toast.error('Gagal membuat token');
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAdmin = {
        ...adminForm,
        createdAt: new Date().toISOString()
      };
      const adminsRef = ref(db, 'admins');
      await push(adminsRef, newAdmin);
      setAdminForm({ email: '', name: '', password: '', role: 'admin' });
      setShowAddAdmin(false);
      toast.success('Admin berhasil ditambahkan');
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error('Gagal menambahkan admin');
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    showConfirmDialog({
      title: 'Hapus Kandidat',
      message: 'Apakah Anda yakin ingin menghapus kandidat ini? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Hapus Kandidat',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          const candidateRef = ref(db, `candidates/${id}`);
          await remove(candidateRef);
          toast.success('Kandidat berhasil dihapus');
        } catch (error) {
          console.error('Error deleting candidate:', error);
          toast.error('Gagal menghapus kandidat');
        }
        setShowConfirmModal(false);
      },
      type: 'danger'
    });
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setEditingCandidate(candidate);
          setCandidateForm({
        name: candidate.name,
        photo: candidate.photo,
        photoFile: null,
        vision: candidate.vision,
        mission: candidate.mission,
        class: candidate.class || ''
      });
    setShowEditCandidate(true);
  };

  const handleUpdateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;

    try {
      let photoUrl = candidateForm.photo;
      
      // If there's a file uploaded, convert it to base64
      if (candidateForm.photoFile) {
        photoUrl = await compressImageToWebP(candidateForm.photoFile, 1024, 0.9);
      }
      
      const candidateRef = ref(db, `candidates/${editingCandidate.id}`);
      await update(candidateRef, {
        ...candidateForm,
        photo: photoUrl,
        updatedAt: new Date().toISOString()
      });
      
      setCandidateForm({ name: '', photo: '', photoFile: null, vision: '', mission: '', class: '' });
      setEditingCandidate(null);
      setShowEditCandidate(false);
      toast.success('Kandidat berhasil diperbarui');
    } catch (error) {
      console.error('Error updating candidate:', error);
      toast.error('Gagal memperbarui kandidat');
    }
  };

  // Admin deletion functionality hidden with Admin tab

  const handleDeleteToken = async (id: string) => {
    const token = tokens.find(t => t.id === id);
    const isUsed = token?.isUsed;
    
    if (isUsed) {
      showConfirmDialog({
        title: 'Hapus Token Terpakai',
        message: 'Token ini sudah terpakai untuk voting. Jika dihapus, data voting juga akan terhapus. Apakah Anda yakin ingin melanjutkan?',
        confirmText: 'Hapus Token & Vote',
        cancelText: 'Batal',
        onConfirm: async () => {
          try {
            // Find and remove the vote first
            const voteToRemove = votes.find(vote => vote.tokenId === id);
            if (voteToRemove) {
              const voteRef = ref(db, `votes/${voteToRemove.id}`);
              await remove(voteRef);
            }
            
            // Then remove the token
            const tokenRef = ref(db, `tokens/${id}`);
            await remove(tokenRef);
            toast.success('Token dan vote berhasil dihapus');
          } catch (error) {
            console.error('Error deleting token:', error);
            toast.error('Gagal menghapus token');
          }
          setShowConfirmModal(false);
        },
        type: 'danger'
      });
    } else {
      showConfirmDialog({
        title: 'Hapus Token',
        message: 'Apakah Anda yakin ingin menghapus token ini?',
        confirmText: 'Hapus Token',
        cancelText: 'Batal',
        onConfirm: async () => {
          try {
            const tokenRef = ref(db, `tokens/${id}`);
            await remove(tokenRef);
            toast.success('Token berhasil dihapus');
          } catch (error) {
            console.error('Error deleting token:', error);
            toast.error('Gagal menghapus token');
          }
          setShowConfirmModal(false);
        },
        type: 'warning'
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Token berhasil disalin!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Gagal menyalin token');
    }
  };

  const handleResetAllVoting = async () => {
    showConfirmDialog({
      title: 'Reset Semua Voting',
      message: 'PERHATIAN: Ini akan menghapus SEMUA data voting dan mengembalikan semua token menjadi tersedia. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan?',
      confirmText: 'Reset Semua Data',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          // Delete all votes
          const votesRef = ref(db, 'votes');
          await remove(votesRef);
          
          // Reset all tokens to available
          const tokensRef = ref(db, 'tokens');
          const tokensSnapshot = await get(tokensRef);
          if (tokensSnapshot.exists()) {
            const updatePromises: Promise<void>[] = [];
            tokensSnapshot.forEach((childSnapshot: any) => {
              const tokenId = childSnapshot.key!;
              const tokenRef = ref(db, `tokens/${tokenId}`);
              updatePromises.push(update(tokenRef, {
                isUsed: false,
                usedAt: null,
                updatedAt: new Date().toISOString()
              }));
            });
            await Promise.all(updatePromises);
          }
          
          toast.success('Semua voting berhasil direset dan token dikembalikan menjadi tersedia');
        } catch (error) {
          console.error('Error resetting voting:', error);
          toast.error('Gagal mereset voting');
        }
        setShowConfirmModal(false);
      },
      type: 'danger'
    });
  };

  const showConfirmDialog = (data: {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }) => {
    setConfirmModalData(data);
    setShowConfirmModal(true);
  };

  const handleToggleTokenStatus = async (tokenId: string, currentStatus: boolean) => {
    // Only allow changing from "Terpakai" to "Tersedia"
    if (!currentStatus) {
      toast.error('Token yang tersedia tidak dapat diubah menjadi terpakai');
      return;
    }
    
    showConfirmDialog({
      title: 'Reset Token Status',
      message: 'Apakah Anda yakin ingin mengubah status token ini menjadi tersedia? Ini akan mengurangi hasil voting sesuai bobot token.',
      confirmText: 'Reset Token',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          // Find the vote associated with this token
          const voteToRemove = votes.find(vote => vote.tokenId === tokenId);
          
          if (voteToRemove) {
            // Remove the vote
            const voteRef = ref(db, `votes/${voteToRemove.id}`);
            await remove(voteRef);
            
            // Update token status
            const tokenRef = ref(db, `tokens/${tokenId}`);
            await update(tokenRef, {
              isUsed: false,
              usedAt: null,
              updatedAt: new Date().toISOString()
            });
            
            toast.success('Token berhasil diubah menjadi tersedia dan vote telah dihapus');
          } else {
            // If no vote found, just update token status
            const tokenRef = ref(db, `tokens/${tokenId}`);
            await update(tokenRef, {
              isUsed: false,
              usedAt: null,
              updatedAt: new Date().toISOString()
            });
            
            toast.success('Token berhasil diubah menjadi tersedia');
          }
        } catch (error) {
          console.error('Error updating token status:', error);
          toast.error('Gagal mengubah status token');
        }
        setShowConfirmModal(false);
      },
      type: 'warning'
    });
  };

  const getVotingResults = useCallback(() => {
    const results: any[] = [];
    
    candidates.forEach(candidate => {
      const candidateVotes = votes.filter(vote => vote.candidateId === candidate.id);
      const totalPoints = candidateVotes.reduce((sum, vote) => sum + vote.points, 0);
      const totalVotes = candidateVotes.length;
      
      results.push({
        candidate,
        totalPoints,
        totalVotes,
        studentVotes: candidateVotes.filter(vote => vote.points === 1).length,
        teacherVotes: candidateVotes.filter(vote => vote.points === 2).length
      });
    });
    
    return results.sort((a, b) => b.totalPoints - a.totalPoints);
  }, [candidates, votes]);

  const getUniqueClasses = () => {
    const classes = tokens
      .filter(token => token.type === 'student' && token.class)
      .map(token => token.class!)
      .filter((value, index, self) => self.indexOf(value) === index);
    return classes.sort();
  };

  const getFilteredTokens = () => {
    if (tokenTab === 'all') {
      return tokens;
    } else if (tokenTab === 'teachers') {
      return tokens.filter(token => token.type === 'teacher');
    } else {
      return tokens.filter(token => token.type === 'student' && token.class === tokenTab);
    }
  };

  // Pagination functions
  const getCurrentTokens = () => {
    const filtered = getSortedAndFilteredTokens();
    const startIndex = (currentPage - 1) * tokensPerPage;
    const endIndex = startIndex + tokensPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filtered = getSortedAndFilteredTokens();
    return Math.ceil(filtered.length / tokensPerPage);
  };

  // Function to get pagination range with max 5 pages visible
  const getPaginationRange = () => {
    const totalPages = getTotalPages();
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // If total pages <= 5, show all pages
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // If total pages > 5, show sliding window of 5 pages
    let startPage = Math.max(1, currentPage - 2);
    let endPage = startPage + maxVisiblePages - 1;
    
    // Adjust if end page exceeds total pages
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Return only the visible page range
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleJumpToPage = () => {
    const pageNumber = parseInt(jumpToPage);
    if (pageNumber && pageNumber >= 1 && pageNumber <= getTotalPages()) {
      setCurrentPage(pageNumber);
      setJumpToPage('');
    }
  };

  const handleJumpToPageKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  // Function to delete all tokens
  const handleDeleteAllTokens = (includeVotes: boolean = false) => {
    setConfirmModalData({
      title: 'Hapus Semua Token',
      message: includeVotes 
        ? 'Apakah Anda yakin ingin menghapus SEMUA token dan data voting? Tindakan ini tidak dapat dibatalkan!'
        : 'Apakah Anda yakin ingin menghapus SEMUA token? Data voting akan tetap tersimpan.',
      confirmText: 'Ya, Hapus Semua',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          if (includeVotes) {
            // Delete all votes first
            const votesRef = ref(db, 'votes');
            await remove(votesRef);
            toast.success('Semua data voting berhasil dihapus');
          }
          
          // Delete all tokens
          const tokensRef = ref(db, 'tokens');
          await remove(tokensRef);
          
          toast.success(includeVotes 
            ? 'Semua token dan data voting berhasil dihapus' 
            : 'Semua token berhasil dihapus'
          );
          
          // Close modal after successful operation
          setShowConfirmModal(false);
        } catch (error) {
          console.error('Error deleting tokens:', error);
          toast.error('Gagal menghapus token');
          // Close modal even on error
          setShowConfirmModal(false);
        }
      },
      type: 'danger'
    });
    setShowConfirmModal(true);
  };

  // Quick presets for classes
  const presetOptions: Record<string, string[]> = {
    'X-1-6': Array.from({ length: 6 }, (_, i) => `X-${i + 1}`),
    'XI-1-6': Array.from({ length: 6 }, (_, i) => `XI-${i + 1}`),
    'XII-1-6': Array.from({ length: 6 }, (_, i) => `XII-${i + 1}`),
  };

  const applyPresetClasses = (key: string) => {
    setQuickPreset(key);
    setQuickSelectedClasses(presetOptions[key] || []);
  };

  const handleQuickGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tokensRef = ref(db, 'tokens');
      const updates: any = {};
      const addToken = (type: 'student' | 'teacher', className?: string) => {
        const newKey = push(tokensRef).key as string;
        updates[newKey] = {
          code: generateUniqueToken(),
          type,
          class: className || '',
          isUsed: false,
          createdAt: new Date().toISOString(),
        };
      };

      // Determine classes list based on scope and preset
      if (quickScope === 'teachers') {
        // Generate N tokens for teachers
        const count = Math.max(1, Math.min(100, Number(quickPerClassCount) || 1));
        for (let i = 0; i < count; i++) addToken('teacher');
      } else if (quickScope === 'all_classes') {
        const fromPreset = quickPreset && presetOptions[quickPreset] ? presetOptions[quickPreset] : [];
        const fromExisting = getUniqueClasses();
        const classes = (fromPreset.length ? fromPreset : fromExisting);
        if (classes.length === 0) {
          toast.error('Tidak ada kelas untuk dibuat. Pilih preset atau kelas.');
          return;
        }
        const count = Math.max(1, Math.min(100, Number(quickPerClassCount) || 1));
        classes.forEach((cls) => {
          for (let i = 0; i < count; i++) addToken('student', cls);
        });
      } else {
        // selected_classes
        const classes = quickSelectedClasses.length
          ? quickSelectedClasses
          : (quickPreset && presetOptions[quickPreset] ? presetOptions[quickPreset] : []);
        if (classes.length === 0) {
          toast.error('Pilih setidaknya satu kelas.');
          return;
        }
        const count = Math.max(1, Math.min(100, Number(quickPerClassCount) || 1));
        classes.forEach((cls) => {
          for (let i = 0; i < count; i++) addToken('student', cls);
        });
      }

      if (Object.keys(updates).length === 0) {
        toast.error('Tidak ada token yang dibuat. Periksa pengaturan.');
        return;
      }

      await update(tokensRef, updates);
      toast.success('Token berhasil dibuat');
      setShowQuickGenerate(false);
    } catch (error) {
      console.error('Quick generate error:', error);
      toast.error('Gagal generate token');
    }
  };

  // Delete all tokens for a specific class
  const handleDeleteTokensByClass = (className: string) => {
    if (!className) return;
    // Close selector modal immediately and open confirm dialog
    setShowDeleteClassModal(false);
    setConfirmModalData({
      title: 'Hapus Token per Kelas',
      message: `Anda akan menghapus SEMUA token untuk kelas ${className}. Data voting tetap ada. Lanjutkan?`,
      confirmText: 'Ya, Hapus Kelas Ini',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          const tokensRef = ref(db, 'tokens');
          const snapshot = await get(tokensRef);
          if (snapshot.exists()) {
            const updates: Record<string, null> = {};
            snapshot.forEach((child) => {
              const data = child.val();
              if (data.type === 'student' && data.class === className) {
                updates[child.key as string] = null;
              }
            });
            if (Object.keys(updates).length > 0) {
              await update(tokensRef, updates);
            }
          }
          toast.success(`Semua token untuk ${className} dihapus`);
        } catch (error) {
          console.error('Error deleting tokens by class:', error);
          toast.error('Gagal menghapus token per kelas');
        }
        setShowConfirmModal(false);
        setShowDeleteClassModal(false);
        setDeleteClassSelected('');
      },
      type: 'danger'
    });
    setShowConfirmModal(true);
  };

  // Sorting and search functions
  const handleSort = (field: 'code' | 'type' | 'class' | 'isUsed' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedAndFilteredTokens = () => {
    let filtered = getFilteredTokens();
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(token => 
        token.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (token.class && token.class.toLowerCase().includes(searchTerm.toLowerCase())) ||
        token.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting with deterministic tie-breakers to avoid row reordering
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'code':
          aValue = a.code;
          bValue = b.code;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'class':
          aValue = a.class || '';
          bValue = b.class || '';
          break;
        case 'isUsed':
          aValue = a.isUsed ? 1 : 0;
          bValue = b.isUsed ? 1 : 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = 0;
          bValue = 0;
      }
      
      const primary = sortDirection === 'asc'
        ? (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0))
        : (aValue < bValue ? 1 : (aValue > bValue ? -1 : 0));
      if (primary !== 0) return primary;
      // Stable secondary ordering: by code, then by id
      const codeCmp = a.code.localeCompare(b.code);
      if (codeCmp !== 0) return codeCmp;
      return a.id === b.id ? 0 : (a.id > b.id ? 1 : -1);
    });
    
    return filtered;
  };



  // Function to handle triple click on total points
  const handleTripleClickPoints = (result: any) => {
    const newPoints = prompt(`Edit total poin untuk ${result.candidate.name} (saat ini: ${result.totalPoints}):`);
    if (newPoints && !isNaN(parseInt(newPoints))) {
      const newPointsValue = parseInt(newPoints);
      const difference = newPointsValue - result.totalPoints;
      
      if (difference !== 0) {
        // Find the first vote for this candidate to modify
        const candidateVotes = votes.filter(vote => vote.candidateId === result.candidate.id);
        if (candidateVotes.length > 0) {
          const firstVote = candidateVotes[0];
          const newVotePoints = firstVote.points + difference;
          
          if (newVotePoints > 0) {
            update(ref(db, `votes/${firstVote.id}`), {
              points: newVotePoints,
              updatedAt: new Date().toISOString()
            }).then(() => {
              setLastUpdate(new Date());
              toast.success(`Total poin ${result.candidate.name} berhasil diubah dari ${result.totalPoints} menjadi ${newPointsValue}`);
            }).catch((error) => {
              console.error('Error updating vote:', error);
              toast.error('Gagal mengubah total poin');
            });
          } else {
            toast.error('Total poin tidak boleh kurang dari 0');
          }
        } else {
          toast.error('Tidak ada vote untuk kandidat ini');
        }
      }
    }
  };

  // Function to export tokens to Excel
  const exportTokensToExcel = () => {
    const filteredTokens = getFilteredTokens();
    
    // Create CSV content without comma separation
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Token,Tipe,Kelas/Guru,Status,Tanggal Dibuat\n";
    
    filteredTokens.forEach(token => {
      const row = [
        token.code,
        token.type === 'student' ? 'Siswa' : 'Guru',
        token.type === 'student' ? (token.class || '-') : 'Guru',
        token.isUsed ? 'Terpakai' : 'Tersedia',
        new Date(token.createdAt).toLocaleDateString('id-ID')
      ].join(';'); // Use semicolon instead of comma
      csvContent += row + '\n';
    });
    
    // Create download link with proper filename
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    
    // Create filename based on current filter
    let filename = 'tokens';
    if (tokenTab === 'all') {
      filename = 'tokens_semua';
    } else if (tokenTab === 'teachers') {
      filename = 'tokens_guru';
    } else {
      filename = `tokens_${tokenTab}`;
    }
    filename += `_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Token berhasil diexport ke Excel');
  };

  // Lazy-load SheetJS from CDN and export XLSX with one sheet per class
  const ensureXLSX = async (): Promise<any> => {
    // Reuse if already loaded
    if ((window as any).XLSX) return (window as any).XLSX;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Gagal memuat XLSX library'));
      document.body.appendChild(script);
    });
    return (window as any).XLSX;
  };

  const exportTokensPerClassXlsx = async () => {
    try {
      const XLSX = await ensureXLSX();

      const workbook = XLSX.utils.book_new();

      const classes = getUniqueClasses();
      if (classes.length === 0) {
        toast.error('Tidak ada kelas untuk diexport');
        return;
      }

      // Teachers sheet (optional)
      const teacherTokens = tokens.filter(t => t.type === 'teacher');
      if (teacherTokens.length > 0) {
        const aoa = [
          ['Token', 'Tipe', 'Kelas/Guru', 'Status', 'Tanggal Dibuat'],
          ...teacherTokens.map(t => [
            t.code,
            'Guru',
            'Guru',
            t.isUsed ? 'Terpakai' : 'Tersedia',
            new Date(t.createdAt).toLocaleDateString('id-ID')
          ])
        ];
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(workbook, ws, 'Guru');
      }

      // One sheet per class
      classes.forEach((cls) => {
        const classTokens = tokens.filter(t => t.type === 'student' && t.class === cls);
        const aoa = [
          ['Token', 'Kelas', 'Status', 'Tanggal Dibuat'],
          ...classTokens.map(t => [
            t.code,
            t.class || '-',
            t.isUsed ? 'Terpakai' : 'Tersedia',
            new Date(t.createdAt).toLocaleDateString('id-ID')
          ])
        ];
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        // Sheet names max 31 chars in Excel
        const safeName = (cls || 'Kelas').toString().slice(0, 31);
        XLSX.utils.book_append_sheet(workbook, ws, safeName);
      });

      const filename = `tokens_per_kelas_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success('Export Excel multi-sheet berhasil');
    } catch (error) {
      console.error('Export XLSX error:', error);
      toast.error('Gagal export Excel per sheet');
    }
  };

  // Print-friendly tokens per class (A4, two columns)
  const printTokensPerClass = () => {
    const studentTokens = tokens.filter(t => t.type === 'student' && t.class);
    const classes = Array.from(new Set(studentTokens.map(t => t.class!))).sort();
    const win = window.open('', '_blank');
    if (!win) return;
    const style = `
      <style>
        @media print { @page { size: A4; margin: 12mm; } }
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; color: #111827; }
        h1 { font-size: 18px; margin: 0 0 16px; }
        .class-section { page-break-inside: avoid; margin-bottom: 24px; }
        .class-title { font-size: 16px; font-weight: 700; margin: 0 0 8px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
        .token { padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
        .meta { font-size: 12px; color: #6b7280; margin-bottom: 12px; }
      </style>`;
    let html = `<html><head><title>Print Token per Kelas</title>${style}</head><body>`;
    html += `<h1>Daftar Token per Kelas</h1>`;
    classes.forEach(cls => {
      const list = studentTokens.filter(t => t.class === cls);
      html += `<div class="class-section">`;
      html += `<div class="class-title">${cls} (${list.length} token)</div>`;
      html += `<div class="grid">`;
      list.forEach(t => { html += `<div class="token">${t.code}</div>`; });
      html += `</div></div>`;
    });
    html += `</body></html>`;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  // Print QR per class (QR links prefill to VotingPage with token)
  const printQRCodesPerClass = () => {
    const allTokens = tokens.filter(t => t.type === 'student' && t.class);
    const classes = Array.from(new Set(allTokens.map(t => t.class!))).sort();
    const baseUrl = `${window.location.origin}/vote`;
    const qrFor = (code: string) => {
      const url = `${baseUrl}?t=${encodeURIComponent(code)}`;
      const data = encodeURIComponent(url);
      // Free QR service
      return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${data}`;
    };
    const win = window.open('', '_blank');
    if (!win) return;
    const style = `
      <style>
        @media print { @page { size: A4; margin: 10mm; } }
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; color: #111827; }
        h1 { font-size: 18px; margin: 0 0 16px; }
        .section { page-break-before: always; }
        .title { font-size: 16px; font-weight: 700; margin: 0 0 10px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; text-align: center; }
        .code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; margin-top: 6px; font-weight: 700; }
        .link { font-size: 10px; color: #6b7280; word-break: break-all; margin-top: 4px; }
      </style>`;
    let html = `<html><head><title>QR Token per Kelas</title>${style}</head><body>`;
    html += `<h1>QR Token Voting per Kelas</h1>`;
    classes.forEach((cls) => {
      const list = allTokens.filter(t => t.class === cls);
      html += `<div class="section"><div class="title">${cls} (${list.length} token)</div>`;
      html += `<div class="grid">`;
      list.forEach(t => {
        const link = `${baseUrl}?t=${encodeURIComponent(t.code)}`;
        html += `<div class="card">`;
        html += `<img src="${qrFor(t.code)}" alt="QR ${t.code}" width="160" height="160" />`;
        html += `<div class="code">${t.code}</div>`;
        html += `<div class="link">${link}</div>`;
        html += `</div>`;
      });
      html += `</div></div>`;
    });
    html += `</body></html>`;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  // Function to export tokens per class in one Excel file with multiple sheets
  const exportTokensPerClass = () => {
    const uniqueClasses = getUniqueClasses();
    
    if (uniqueClasses.length === 0) {
      toast.error('Tidak ada kelas yang tersedia untuk export');
      return;
    }

    // Create CSV content with all classes in one file
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add header for the main sheet
    csvContent += "=== TOKEN PER KELAS ===\n\n";
    
    // Export each class in separate sections
    uniqueClasses.forEach((className, classIndex) => {
      const classTokens = tokens.filter(token => 
        token.type === 'student' && token.class === className
      );
      
      if (classTokens.length > 0) {
        // Add class header
        csvContent += `\n--- ${className} (${classTokens.length} token) ---\n`;
        csvContent += "Token,Kelas,Status,Tanggal Dibuat\n";
        
        // Add tokens for this class
        classTokens.forEach(token => {
          const row = [
            token.code,
            token.class,
            token.isUsed ? 'Terpakai' : 'Tersedia',
            new Date(token.createdAt).toLocaleDateString('id-ID')
          ].join(';'); // Use semicolon instead of comma
          csvContent += row + '\n';
        });
        
        // Add summary for this class
        const availableTokens = classTokens.filter(token => !token.isUsed).length;
        const usedTokens = classTokens.filter(token => token.isUsed).length;
        csvContent += `\nRingkasan ${className}:\n`;
        csvContent += `Total Token: ${classTokens.length}\n`;
        csvContent += `Tersedia: ${availableTokens}\n`;
        csvContent += `Terpakai: ${usedTokens}\n`;
        csvContent += `Persentase: ${classTokens.length > 0 ? Math.round((usedTokens / classTokens.length) * 100) : 0}%\n`;
        
        // Add separator between classes
        if (classIndex < uniqueClasses.length - 1) {
          csvContent += '\n' + '='.repeat(50) + '\n';
        }
      }
    });
    
    // Add overall summary at the end
    const allStudentTokens = tokens.filter(token => token.type === 'student');
    const totalAvailable = allStudentTokens.filter(token => !token.isUsed).length;
    const totalUsed = allStudentTokens.filter(token => token.isUsed).length;
    
    csvContent += '\n\n=== RINGKASAN KESELURUHAN ===\n';
    csvContent += `Total Kelas: ${uniqueClasses.length}\n`;
    csvContent += `Total Token Siswa: ${allStudentTokens.length}\n`;
    csvContent += `Total Tersedia: ${totalAvailable}\n`;
    csvContent += `Total Terpakai: ${totalUsed}\n`;
    csvContent += `Persentase Terpakai: ${allStudentTokens.length > 0 ? Math.round((totalUsed / allStudentTokens.length) * 100) : 0}%\n`;
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tokens_semua_kelas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Token berhasil diexport untuk ${uniqueClasses.length} kelas dalam 1 file`);
  };

  // Function to export teacher tokens specifically
  const exportTeacherTokens = () => {
    const teacherTokens = tokens.filter(token => token.type === 'teacher');
    
    if (teacherTokens.length === 0) {
      toast.error('Tidak ada token guru yang tersedia untuk export');
      return;
    }

    // Create CSV content for teacher tokens
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add header
    csvContent += "=== TOKEN GURU ===\n\n";
    csvContent += "Token,Status,Tanggal Dibuat\n";
    
    // Add teacher tokens
    teacherTokens.forEach(token => {
      const row = [
        token.code,
        token.isUsed ? 'Terpakai' : 'Tersedia',
        new Date(token.createdAt).toLocaleDateString('id-ID')
      ].join(';'); // Use semicolon instead of comma
      csvContent += row + '\n';
    });
    
    // Add summary
    const availableTokens = teacherTokens.filter(token => !token.isUsed).length;
    const usedTokens = teacherTokens.filter(token => token.isUsed).length;
    
    csvContent += '\n=== RINGKASAN TOKEN GURU ===\n';
    csvContent += `Total Token: ${teacherTokens.length}\n`;
    csvContent += `Tersedia: ${availableTokens}\n`;
    csvContent += `Terpakai: ${usedTokens}\n`;
    csvContent += `Persentase Terpakai: ${teacherTokens.length > 0 ? Math.round((usedTokens / teacherTokens.length) * 100) : 0}%\n`;
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tokens_guru_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Token guru berhasil diexport (${teacherTokens.length} token)`);
  };

  // Function to export all tokens (both student and teacher) in one file
  const exportAllTokens = () => {
    const studentTokens = tokens.filter(token => token.type === 'student');
    const teacherTokens = tokens.filter(token => token.type === 'teacher');
    
    if (tokens.length === 0) {
      toast.error('Tidak ada token yang tersedia untuk export');
      return;
    }

    // Create CSV content for all tokens
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add header
    csvContent += "=== SEMUA TOKEN ===\n\n";
    
    // Export teacher tokens section
    if (teacherTokens.length > 0) {
      csvContent += "--- TOKEN GURU ---\n";
      csvContent += "Token,Status,Tanggal Dibuat\n";
      
      teacherTokens.forEach(token => {
        const row = [
          token.code,
          token.isUsed ? 'Terpakai' : 'Tersedia',
          new Date(token.createdAt).toLocaleDateString('id-ID')
        ].join(';');
        csvContent += row + '\n';
      });
      
      const availableTeacherTokens = teacherTokens.filter(token => !token.isUsed).length;
      const usedTeacherTokens = teacherTokens.filter(token => token.isUsed).length;
      
      csvContent += `\nRingkasan Guru:\n`;
      csvContent += `Total Token: ${teacherTokens.length}\n`;
      csvContent += `Tersedia: ${availableTeacherTokens}\n`;
      csvContent += `Terpakai: ${usedTeacherTokens}\n`;
      csvContent += `Persentase: ${teacherTokens.length > 0 ? Math.round((usedTeacherTokens / teacherTokens.length) * 100) : 0}%\n\n`;
    }
    
    // Export student tokens by class
    const uniqueClasses = getUniqueClasses();
    if (uniqueClasses.length > 0) {
      csvContent += "--- TOKEN SISWA PER KELAS ---\n";
      
      uniqueClasses.forEach((className) => {
        const classTokens = studentTokens.filter(token => token.class === className);
        
        if (classTokens.length > 0) {
          csvContent += `\n${className} (${classTokens.length} token):\n`;
          csvContent += "Token,Kelas,Status,Tanggal Dibuat\n";
          
          classTokens.forEach(token => {
            const row = [
              token.code,
              token.class,
              token.isUsed ? 'Terpakai' : 'Tersedia',
              new Date(token.createdAt).toLocaleDateString('id-ID')
            ].join(';');
            csvContent += row + '\n';
          });
          
          const availableClassTokens = classTokens.filter(token => !token.isUsed).length;
          const usedClassTokens = classTokens.filter(token => token.isUsed).length;
          csvContent += `Ringkasan ${className}: Total: ${classTokens.length}, Tersedia: ${availableClassTokens}, Terpakai: ${usedClassTokens}\n`;
        }
      });
    }
    
    // Add overall summary
    const totalAvailable = tokens.filter(token => !token.isUsed).length;
    const totalUsed = tokens.filter(token => token.isUsed).length;
    
    csvContent += '\n=== RINGKASAN KESELURUHAN ===\n';
    csvContent += `Total Token: ${tokens.length}\n`;
    csvContent += `Total Guru: ${teacherTokens.length}\n`;
    csvContent += `Total Siswa: ${studentTokens.length}\n`;
    csvContent += `Total Tersedia: ${totalAvailable}\n`;
    csvContent += `Total Terpakai: ${totalUsed}\n`;
    csvContent += `Persentase Terpakai: ${tokens.length > 0 ? Math.round((totalUsed / tokens.length) * 100) : 0}%\n`;
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `semua_tokens_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Semua token berhasil diexport (${tokens.length} token)`);
  };

  // Stable color mapping untuk konsistensi visual
  const getChartColor = useCallback((index: number) => {
    const colors = ['#fbbf24', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#a855f7'];
    return colors[index % colors.length];
  }, []);

  // Memoized chart data untuk performa yang lebih baik dengan throttling
  const pieChartData = useMemo(() => {
    const results = getVotingResults();
    
    // Jika tidak ada data, return array kosong
    if (results.length === 0) {
      return [];
    }
    
    // Filter hanya kandidat yang memiliki poin > 0
    const validResults = results.filter(result => result.totalPoints > 0);
    
    // Jika tidak ada kandidat dengan poin, tampilkan semua kandidat dengan poin 0
    if (validResults.length === 0) {
      return results.map((result, index) => ({
        name: result.candidate.name,
        value: 1, // Minimal value untuk pie chart
        color: getChartColor(index)
      }));
    }
    
    return validResults.map((result, index) => ({
      name: result.candidate.name,
      value: result.totalPoints,
      color: getChartColor(index)
    }));
  }, [candidates, votes, getChartColor]); // Direct dependencies instead of getVotingResults function

  const barChartData = useMemo(() => {
    const results = getVotingResults();
    
    // Jika tidak ada data, return array kosong
    if (results.length === 0) {
      return [];
    }
    
    return results.map((result, index) => ({
      name: result.candidate.name,
      points: result.totalPoints,
      votes: result.totalVotes,
      color: getChartColor(index)
    }));
  }, [candidates, votes, getChartColor]); // Direct dependencies instead of getVotingResults function

  // Debounced chart update to prevent blinking
  const [debouncedChartData, setDebouncedChartData] = useState<any[]>([]);
  const prevChartDataRef = useRef<any[]>([]);
  
  useEffect(() => {
    // Only update if data actually changed
    const dataChanged = JSON.stringify(pieChartData) !== JSON.stringify(prevChartDataRef.current);
    
    if (dataChanged) {
      const timer = setTimeout(() => {
        setDebouncedChartData(pieChartData);
        prevChartDataRef.current = pieChartData;
      }, 300); // 300ms delay to prevent rapid updates

      return () => clearTimeout(timer);
    }
  }, [pieChartData]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
      if (!target.closest('.delete-all-dropdown')) {
        setShowDeleteAllDropdown(false);
      }
    };

    if (showExportDropdown || showDeleteAllDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown, showDeleteAllDropdown]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating Header dengan Navigation Tabs */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Bar */}
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Live' : 'Disconnected'}
                </span>
                <span className="text-xs text-gray-500">
                  • {currentTime.toLocaleTimeString('id-ID')}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="-mb-px flex space-x-8 overflow-x-auto px-1 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('candidates')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'candidates'
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Kandidat
            </button>
            <button
              onClick={() => setActiveTab('tokens')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'tokens'
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Key className="h-4 w-4 inline mr-2" />
              Token
            </button>
            {/* Admin tab hidden */}
            <button
              onClick={() => setActiveTab('results')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'results'
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Hasil
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content with top padding for floating navbar */}
      <div className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Content */}
        {activeTab === 'candidates' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Daftar Kandidat</h2>
              <button
                onClick={() => setShowAddCandidate(true)}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kandidat
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="card">
                  {/* Image with enforced 5:6 aspect ratio (400x480) */}
                  <div className="relative mb-4">
                    <div className="relative w-full pt-[120%] rounded-lg overflow-hidden shadow-md">
                    <img
                      src={candidate.photo || 'https://via.placeholder.com/400x480?text=No+Image'}
                      alt={candidate.name}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                    {/* Overlay gradient for better text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    </div>
                    {/* Text information overlaid on image */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white pointer-events-none">
                      <h3 className="text-lg font-semibold mb-2 drop-shadow-lg">{candidate.name}</h3>
                      {candidate.class && (
                        <p className="text-sm text-white/90 mb-3 drop-shadow-md">
                          <span className="font-medium">Kelas:</span> {candidate.class}
                        </p>
                      )}
                      <div className="text-xs text-white/90 drop-shadow">Tap untuk detail kandidat</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditCandidate(candidate)}
                      className="btn-secondary flex-1 flex items-center justify-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCandidate(candidate.id)}
                      className="btn-secondary flex-1 flex items-center justify-center text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

                 {activeTab === 'tokens' && (
           <div>
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-semibold text-gray-900">Daftar Token</h2>
               <div className="flex space-x-3">
                                   {/* Export Dropdown */}
                  <div className="relative export-dropdown">
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className="btn-secondary flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showExportDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50 export-dropdown transform transition-all duration-200 ease-out">
                        <div className="py-1">
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                            Pilih Jenis Export
                          </div>
                          <button
                            onClick={() => {
                              exportTokensToExcel();
                              setShowExportDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors"
                          >
                            <Download className="h-4 w-4 mr-3 text-blue-600" />
                            <div>
                              <div className="font-medium">Export Excel</div>
                              <div className="text-xs text-gray-500">Format Excel standar</div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              exportTeacherTokens();
                              setShowExportDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center transition-colors"
                          >
                            <Download className="h-4 w-4 mr-3 text-green-600" />
                            <div>
                              <div className="font-medium">Export Token Guru</div>
                              <div className="text-xs text-gray-500">Hanya token guru</div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              exportTokensPerClass();
                              setShowExportDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center transition-colors"
                          >
                            <Download className="h-4 w-4 mr-3 text-purple-600" />
                            <div>
                              <div className="font-medium">Export per Kelas</div>
                              <div className="text-xs text-gray-500">Token siswa per kelas</div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              exportAllTokens();
                              setShowExportDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center transition-colors"
                          >
                            <Download className="h-4 w-4 mr-3 text-orange-600" />
                            <div>
                              <div className="font-medium">Export Semua Token</div>
                              <div className="text-xs text-gray-500">Guru + siswa lengkap</div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              exportTokensPerClassXlsx();
                              setShowExportDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors"
                          >
                            <Download className="h-4 w-4 mr-3 text-blue-600" />
                            <div>
                              <div className="font-medium">Export Excel (Sheet per Kelas)</div>
                              <div className="text-xs text-gray-500">Setiap kelas ke lembar terpisah</div>
                            </div>
                          </button>
                        <div className="border-t my-1"></div>
                        <button
                          onClick={() => {
                            printTokensPerClass();
                            setShowExportDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                        >
                          <Download className="h-4 w-4 mr-3 text-gray-600" />
                          <div>
                            <div className="font-medium">Print per Kelas (A4)</div>
                            <div className="text-xs text-gray-500">Layout ringkas 2 kolom</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            printQRCodesPerClass();
                            setShowExportDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                        >
                          <Download className="h-4 w-4 mr-3 text-gray-600" />
                          <div>
                            <div className="font-medium">Print QR per Kelas</div>
                            <div className="text-xs text-gray-500">QR isi tautan voting + token</div>
                          </div>
                        </button>
                        </div>
                      </div>
                    )}
                  </div>
                <button
                  onClick={() => setShowQuickGenerate(true)}
                   className="btn-primary flex items-center"
                 >
                   <Key className="h-4 w-4 mr-2" />
                   Generate Cepat
                 </button>
                                   <button
                    onClick={() => setShowAddToken(true)}
                    className="btn-primary flex items-center"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Generate Token
                  </button>
                  
                  {/* Delete All Tokens Dropdown - Only show if there are tokens */}
                  {tokens.length > 0 && (
                    <div className="relative delete-all-dropdown">
                      <button
                        onClick={() => setShowDeleteAllDropdown(!showDeleteAllDropdown)}
                        className="btn-secondary flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus Semua
                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    
                      {/* Dropdown Menu */}
                      {showDeleteAllDropdown && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50 transform transition-all duration-200 ease-out delete-all-dropdown">
                          <div className="py-1">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                              Pilih Jenis Penghapusan
                            </div>
                            <button
                              onClick={() => {
                                handleDeleteAllTokens(false);
                                setShowDeleteAllDropdown(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center transition-colors"
                            >
                              <Trash2 className="h-4 w-4 mr-3 text-orange-600" />
                              <div>
                                <div className="font-medium">Hapus Semua Token</div>
                                <div className="text-xs text-gray-500">Token dihapus, data voting tetap</div>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteAllTokens(true);
                                setShowDeleteAllDropdown(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center transition-colors"
                            >
                              <Trash2 className="h-4 w-4 mr-3 text-red-600" />
                              <div>
                               <div className="font-medium">Hapus Semua Token + Voting</div>
                               <div className="text-xs text-gray-500">Termasuk reset data voting</div>
                              </div>
                            </button>
                           <button
                             onClick={() => {
                               setShowDeleteClassModal(true);
                               setShowDeleteAllDropdown(false);
                             }}
                             className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center transition-colors"
                           >
                             <Trash2 className="h-4 w-4 mr-3 text-red-600" />
                             <div>
                               <div className="font-medium">Hapus Token per Kelas</div>
                               <div className="text-xs text-gray-500">Pilih kelas yang akan dihapus</div>
                             </div>
                           </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
             </div>

             {/* Token Tabs */}
             <div className="mb-6">
               <div className="border-b border-gray-200">
                 <nav className="-mb-px flex space-x-8 overflow-x-auto">
                   <button
                     onClick={() => setTokenTab('all')}
                     className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                       tokenTab === 'all'
                         ? 'border-primary-500 text-primary-600'
                         : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                     }`}
                   >
                     Semua ({tokens.length})
                   </button>
                   <button
                     onClick={() => setTokenTab('teachers')}
                     className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                       tokenTab === 'teachers'
                         ? 'border-primary-500 text-primary-600'
                         : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                     }`}
                   >
                     Guru ({tokens.filter(t => t.type === 'teacher').length})
                   </button>
                 </nav>
               </div>
             </div>

             {/* Search and Sort Controls */}
             <div className="mb-6 bg-white rounded-lg shadow p-4">
               <div className="flex flex-col md:flex-row gap-4">
                 <div className="flex-1">
                   <label className="block text-sm font-medium text-gray-700 mb-2">Cari Token</label>
                   <input
                     type="text"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     placeholder="Cari berdasarkan kode token, kelas, atau tipe..."
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                   />
                 </div>
                 <div className="flex-1 md:flex-none md:w-64">
                   <label className="block text-sm font-medium text-gray-700 mb-2">Filter Kelas</label>
                   <select
                     value={tokenTab === 'all' || tokenTab === 'teachers' ? '' : tokenTab}
                     onChange={(e) => {
                       const val = e.target.value;
                       if (!val) setTokenTab('all');
                       else setTokenTab(val);
                     }}
                     className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                   >
                     <option value="">Semua Kelas</option>
                     {getUniqueClasses().map((cls) => (
                       <option key={cls} value={cls}>
                         {cls} ({tokens.filter(t => t.type === 'student' && t.class === cls).length})
                       </option>
                     ))}
                   </select>
                 </div>
               </div>
             </div>

             {/* Token Summary */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Key className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Token</p>
                        <p className="text-2xl font-bold text-gray-900">{getSortedAndFilteredTokens().length}</p>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Tersedia</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {getSortedAndFilteredTokens().filter(token => !token.isUsed).length}
                        </p>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Users className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Terpakai</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {getSortedAndFilteredTokens().filter(token => token.isUsed).length}
                        </p>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Persentase</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {getSortedAndFilteredTokens().length > 0 
                            ? Math.round((getSortedAndFilteredTokens().filter(token => token.isUsed).length / getSortedAndFilteredTokens().length) * 100)
                            : 0}%
                        </p>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  </div>
                </div>
              </div>



              <div className="bg-white rounded-lg shadow overflow-hidden">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       No.
                     </th>
                     <th 
                       className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                       onClick={() => handleSort('code')}
                     >
                       <div className="flex items-center space-x-1">
                         <span>Token</span>
                         {sortField === 'code' && (
                           <span className="text-primary-600">
                             {sortDirection === 'asc' ? '↑' : '↓'}
                           </span>
                         )}
                       </div>
                     </th>
                     <th 
                       className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                       onClick={() => handleSort('type')}
                     >
                       <div className="flex items-center space-x-1">
                         <span>Tipe</span>
                         {sortField === 'type' && (
                           <span className="text-primary-600">
                             {sortDirection === 'asc' ? '↑' : '↓'}
                           </span>
                         )}
                       </div>
                     </th>
                     <th 
                       className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                       onClick={() => handleSort('class')}
                     >
                       <div className="flex items-center space-x-1">
                         <span>Kelas/Guru</span>
                         {sortField === 'class' && (
                           <span className="text-primary-600">
                             {sortDirection === 'asc' ? '↑' : '↓'}
                           </span>
                         )}
                       </div>
                     </th>
                     <th 
                       className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                       onClick={() => handleSort('isUsed')}
                     >
                       <div className="flex items-center space-x-1">
                         <span>Status</span>
                         {sortField === 'isUsed' && (
                           <span className="text-primary-600">
                             {sortDirection === 'asc' ? '↑' : '↓'}
                           </span>
                         )}
                       </div>
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Aksi
                     </th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {getCurrentTokens().map((token, index) => (
                     <tr key={token.id}>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         {(currentPage - 1) * tokensPerPage + index + 1}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                         <div className="flex items-center space-x-2">
                           <span className="font-mono bg-gray-100 px-2 py-1 rounded">{token.code}</span>
                           <button
                             onClick={() => copyToClipboard(token.code)}
                             className="text-gray-400 hover:text-gray-600 transition-colors"
                             title="Salin token"
                           >
                             <Copy className="h-4 w-4" />
                           </button>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                           token.type === 'student' 
                             ? 'bg-green-100 text-green-800' 
                             : 'bg-blue-100 text-blue-800'
                         }`}>
                           {token.type === 'student' ? 'Siswa' : 'Guru'}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         {token.type === 'student' ? token.class : 'Guru'}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         {token.isUsed ? (
                           <button
                             onClick={() => handleToggleTokenStatus(token.id, token.isUsed)}
                             className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 hover:bg-red-200 transition-colors cursor-pointer"
                             title="Klik untuk reset menjadi tersedia"
                           >
                             Terpakai
                           </button>
                         ) : (
                           <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                             Tersedia
                           </span>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <button
                           onClick={() => handleDeleteToken(token.id)}
                           className="text-red-600 hover:text-red-900"
                           title="Hapus token"
                         >
                           <Trash2 className="h-4 w-4" />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>

             {/* Pagination Controls */}
             {getTotalPages() > 1 && (
               <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                 <div className="flex-1 flex justify-between sm:hidden">
                   <button
                     onClick={() => handlePageChange(currentPage - 1)}
                     disabled={currentPage === 1}
                     className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     Previous
                   </button>
                   <button
                     onClick={() => handlePageChange(currentPage + 1)}
                     disabled={currentPage === getTotalPages()}
                     className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     Next
                   </button>
                 </div>
                 <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                   <div>
                     <p className="text-sm text-gray-700">
                       Showing{' '}
                       <span className="font-medium">{(currentPage - 1) * tokensPerPage + 1}</span>
                       {' '}to{' '}
                       <span className="font-medium">
                         {Math.min(currentPage * tokensPerPage, getSortedAndFilteredTokens().length)}
                       </span>
                       {' '}of{' '}
                       <span className="font-medium">{getSortedAndFilteredTokens().length}</span>
                       {' '}results
                       {getTotalPages() > 10 && (
                         <span className="ml-2 text-gray-500">
                           (Page {currentPage} of {getTotalPages()})
                         </span>
                       )}
                     </p>
                   </div>
                   <div>
                     <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                       {/* First Page Button - Show when there are many pages */}
                       {getTotalPages() > 10 && currentPage > 5 && (
                         <button
                           onClick={() => handlePageChange(1)}
                           className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                           title="Go to first page"
                         >
                           1
                         </button>
                       )}
                       
                       <button
                         onClick={() => handlePageChange(currentPage - 1)}
                         disabled={currentPage === 1}
                         className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                       >
                         <span className="sr-only">Previous</span>
                         <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                           <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                         </svg>
                       </button>
                       
                       {/* Page Numbers */}
                       {getPaginationRange().map((page, index) => (
                         <button
                           key={index}
                           onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                           disabled={typeof page !== 'number'}
                           className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium pagination-button ${
                             page === currentPage
                               ? 'pagination-active bg-primary-50 border-primary-500 text-primary-600'
                               : typeof page === 'number'
                               ? 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                               : 'pagination-ellipsis bg-gray-50 border-gray-300 text-gray-400 cursor-default'
                           }`}
                         >
                           {page}
                         </button>
                       ))}
                       
                       <button
                         onClick={() => handlePageChange(currentPage + 1)}
                         disabled={currentPage === getTotalPages()}
                         className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                       >
                         <span className="sr-only">Next</span>
                         <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                           <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                         </svg>
                       </button>
                       
                       {/* Last Page Button - Show when there are many pages */}
                       {getTotalPages() > 10 && currentPage < getTotalPages() - 4 && (
                         <button
                           onClick={() => handlePageChange(getTotalPages())}
                           className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                           title="Go to last page"
                         >
                           {getTotalPages()}
                         </button>
                       )}
                     </nav>
                     
                     {/* Jump to Page - Show when there are many pages */}
                     {getTotalPages() > 10 && (
                       <div className="mt-3 flex items-center justify-center space-x-2">
                         <span className="text-sm text-gray-600">Go to page:</span>
                         <input
                           type="number"
                           min="1"
                           max={getTotalPages()}
                           value={jumpToPage}
                           onChange={(e) => setJumpToPage(e.target.value)}
                           onKeyPress={handleJumpToPageKeyPress}
                           className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                           placeholder="Page #"
                         />
                         <button
                           onClick={handleJumpToPage}
                           className="px-3 py-1 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                         >
                           Go
                         </button>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             )}
           </div>
         )}

        {/* Admin content hidden */}

                                   {activeTab === 'results' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Hasil Voting</h2>
                {votes.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-500 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                      ⚠️ Hati-hati dengan fitur reset
                    </div>
                    <button
                      onClick={handleResetAllVoting}
                      className="btn-secondary flex items-center text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset Semua Voting
                    </button>
                  </div>
                )}
              </div>
              
              {/* Real-time Status Banner */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {isConnected ? '🔄 Real-time Monitoring Active' : '⚠️ Connection Lost'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {isConnected 
                          ? 'Semua data voting, token status, dan grafik diperbarui secara otomatis'
                          : 'Mencoba menghubungkan kembali...'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Current Time: {currentTime.toLocaleTimeString('id-ID')}</p>
                      <p>Last Data: {lastUpdate.toLocaleTimeString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {votes.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600 text-center">Belum ada voting yang dilakukan.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <BarChart3 className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Voting</p>
                            <p className="text-2xl font-bold text-gray-900">{votes.length}</p>
                          </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Users className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Poin</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {votes.reduce((sum, vote) => sum + vote.points, 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Key className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Token Terpakai</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {tokens.filter(token => token.isUsed).length}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Kandidat</p>
                          <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Results Tabs */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200">
                      <nav className="-mb-px flex space-x-8 px-6">
                        <button
                          onClick={() => setResultsTab('ranking')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            resultsTab === 'ranking'
                              ? 'border-primary-500 text-primary-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <BarChart3 className="h-5 w-5 inline mr-2" />
                          Perangkingan
                        </button>
                        {false && (
                          <button
                            onClick={() => setResultsTab('votes')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                              resultsTab === 'votes'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <Users className="h-5 w-5 inline mr-2" />
                            Detail Votes
                          </button>
                        )}
                        <button
                          onClick={() => setResultsTab('charts')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            resultsTab === 'charts'
                              ? 'border-primary-500 text-primary-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <TrendingUp className="h-5 w-5 inline mr-2" />
                          Grafik
                        </button>
                      </nav>
                    </div>
                    <div className="p-6">

                      {/* Ranking Tab */}
                      {resultsTab === 'ranking' && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Perangkingan Kandidat</h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Peringkat
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Kandidat
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Poin
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Voting
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Detail
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {getVotingResults().map((result, index) => (
                                  <tr key={result.candidate.id} className={index === 0 ? 'bg-yellow-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        {index === 0 && (
                                          <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-white text-xs font-bold">1</span>
                                          </div>
                                        )}
                                        <span className={`text-lg font-bold ${index === 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                                          #{index + 1}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <img
                                          src={result.candidate.photo || 'https://via.placeholder.com/40x40?text=No+Image'}
                                          alt={result.candidate.name}
                                          className="w-10 h-10 rounded-full object-cover object-center mr-3"
                                        />
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">{result.candidate.name}</div>
                                          {result.candidate.class && (
                                            <div className="text-sm text-gray-500">{result.candidate.class}</div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span 
                                        className={`text-lg font-bold cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors ${index === 0 ? 'text-yellow-600' : 'text-gray-900'}`}
                                        onClick={() => {
                                          // Simple click counter for triple click simulation
                                          if (!result.clickCount) result.clickCount = 0;
                                          result.clickCount++;
                                          setTimeout(() => {
                                            if (result.clickCount >= 3) {
                                              handleTripleClickPoints(result);
                                              result.clickCount = 0;
                                            }
                                          }, 300);
                                        }}
                                        title="Klik 3x untuk edit total poin"
                                      >
                                        {result.totalPoints}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {result.totalVotes} voting
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                          <span>Siswa: {result.studentVotes}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                          <span>Guru: {result.teacherVotes}</span>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Charts Tab */}
                      {resultsTab === 'charts' && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Grafik Hasil Voting</h3>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <p className="text-sm text-blue-800">
                                  <strong>🔄 Real-time Charts:</strong> Grafik akan otomatis diperbarui setiap kali ada perubahan data. 
                                  Current: {currentTime.toLocaleTimeString('id-ID')} | Last Data: {lastUpdate.toLocaleTimeString('id-ID')}
                                </p>
                                <div className="flex items-center space-x-2">
                                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                                  <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                                    {isConnected ? 'Live' : 'Offline'}
                                  </span>
                                </div>
                              </div>
                                                              <div className="text-xs text-blue-600">
                                  {pieChartData.length > 0 ? `${pieChartData.length} kandidat` : 'Belum ada data'}
                                </div>
                            </div>
                          </div>
                          
                          {/* Chart Type Tabs */}
                          <div className="mb-6">
                            <div className="border-b border-gray-200">
                              <nav className="-mb-px flex space-x-8">
                                <button
                                  onClick={() => setChartType('bar')}
                                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    chartType === 'bar'
                                      ? 'border-primary-500 text-primary-600'
                                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                  }`}
                                >
                                  <BarChart3 className="h-5 w-5 inline mr-2" />
                                  Bar Chart
                                </button>
                                <button
                                  onClick={() => setChartType('pie')}
                                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    chartType === 'pie'
                                      ? 'border-primary-500 text-primary-600'
                                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                  }`}
                                >
                                  <PieChart className="h-5 w-5 inline mr-2" />
                                  Pie Chart
                                </button>
                              </nav>
                            </div>
                          </div>

                          {/* Chart Content */}
                          {chartType === 'bar' && (
                            <div className="bg-white rounded-lg p-6 border border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                                Hasil Voting - Total Poin per Kandidat
                              </h4>
                              {barChartData.length === 0 ? (
                                <div className="flex items-center justify-center h-64 text-gray-500">
                                  <div className="text-center">
                                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium">Belum ada data voting</p>
                                    <p className="text-sm">Data akan muncul setelah ada voting</p>
                                  </div>
                                </div>
                              ) : (
                                                                <ResponsiveContainer width="100%" height={400} key={`bar-${barChartData.length}`}>
                                  <BarChart data={barChartData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip 
                                    formatter={(value) => [value, 'Total Poin']}
                                    labelFormatter={(label) => `Kandidat: ${label}`}
                                  />
                                  <Legend />
                                  <Bar dataKey="points" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                    {barChartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Bar>
                                </BarChart>
                                </ResponsiveContainer>
                              )}
                            </div>
                          )}

                          {chartType === 'pie' && (
                            <div className="bg-white rounded-lg p-6 border border-gray-200 chart-container" key="pie-chart-container">
                              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <PieChart className="h-5 w-5 mr-2 text-green-600" />
                                Hasil Voting - Distribusi Poin
                              </h4>
                              {debouncedChartData.length === 0 ? (
                                <div className="flex items-center justify-center h-64 text-gray-500">
                                  <div className="text-center">
                                    <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium">Belum ada data voting</p>
                                    <p className="text-sm">Data akan muncul setelah ada voting</p>
                                  </div>
                                </div>
                              ) : pieChartData.length !== debouncedChartData.length ? (
                                <div className="flex items-center justify-center h-64 text-gray-500">
                                  <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                                    <p className="text-sm">Memperbarui chart...</p>
                                  </div>
                                </div>
                              ) : (
                                <ResponsiveContainer width="100%" height={400} className="chart-update" key={`pie-chart-${debouncedChartData.length}`}>
                                  <RechartsPieChart>
                                    <Pie
                                      data={debouncedChartData}
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={150}
                                      fill="#8884d8"
                                      paddingAngle={0}
                                      dataKey="value"
                                      label={({ name, percent }) => {
                                        if (percent === undefined || percent === null) return name;
                                        return `${name} ${(percent * 100).toFixed(0)}%`;
                                      }}
                                      animationDuration={300}
                                      animationBegin={0}
                                    >
                                      {debouncedChartData.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                                      ))}
                                    </Pie>
                                    <Tooltip 
                                      formatter={(value) => [value, 'Total Poin']}
                                      labelFormatter={(label) => `Kandidat: ${label}`}
                                    />
                                  </RechartsPieChart>
                                </ResponsiveContainer>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Votes Tab removed as requested */}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Candidate Modal */}
      {showAddCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Tambah Kandidat</h3>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nama</label>
                <input
                  type="text"
                  value={candidateForm.name}
                  onChange={(e) => setCandidateForm({...candidateForm, name: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Foto Kandidat</label>
                <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 font-medium mb-1">📸 Rekomendasi Ukuran Foto:</p>
                  <p className="text-xs text-blue-700">• Optimal: 400x480 pixel</p>
                  <p className="text-xs text-blue-700">• Format: JPG/PNG, maksimal 2MB</p>
                  <p className="text-xs text-blue-700">• Posisi: Portrait formal, wajah di tengah</p>
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCandidateForm({...candidateForm, photoFile: file, photo: ''});
                      }
                    }}
                    className="input-field"
                  />
                  <div className="text-xs text-gray-500">
                    Atau masukkan URL foto:
                  </div>
                  <input
                    type="url"
                    value={candidateForm.photo}
                    onChange={(e) => setCandidateForm({...candidateForm, photo: e.target.value, photoFile: null})}
                    className="input-field"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                {candidateForm.photoFile && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(candidateForm.photoFile as File)}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kelas</label>
                <input
                  type="text"
                  value={candidateForm.class}
                  onChange={(e) => setCandidateForm({...candidateForm, class: e.target.value})}
                  className="input-field"
                  placeholder="Contoh: XII IPA 1"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="submit" disabled={addingCandidate} className="btn-primary w-full sm:flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                  {addingCandidate ? 'Mengunggah...' : 'Tambah'}
                </button>
                <button 
                  type="button" 
                  onClick={() => !addingCandidate && setShowAddCandidate(false)}
                  className="btn-secondary w-full sm:flex-1"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Candidate Modal */}
      {showEditCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Edit Kandidat</h3>
              <button
                onClick={() => {
                  setShowEditCandidate(false);
                  setEditingCandidate(null);
                  setCandidateForm({ name: '', photo: '', photoFile: null, vision: '', mission: '', class: '' });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdateCandidate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <input
                  type="text"
                  value={candidateForm.name}
                  onChange={(e) => setCandidateForm({...candidateForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto Kandidat</label>
                <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 font-medium mb-1">📸 Rekomendasi Ukuran Foto:</p>
                  <p className="text-xs text-blue-700">• Optimal: 400x480 pixel</p>
                  <p className="text-xs text-blue-700">• Format: JPG/PNG, maksimal 2MB</p>
                  <p className="text-xs text-blue-700">• Posisi: Portrait formal, wajah di tengah</p>
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCandidateForm({...candidateForm, photoFile: file, photo: ''});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  <div className="text-xs text-gray-500">
                    Atau masukkan URL foto:
                  </div>
                  <input
                    type="url"
                    value={candidateForm.photo}
                    onChange={(e) => setCandidateForm({...candidateForm, photo: e.target.value, photoFile: null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                {candidateForm.photoFile && (
                  <div className="mt-2 flex justify-center">
                    <img
                      src={URL.createObjectURL(candidateForm.photoFile as File)}
                      alt="Preview"
                      className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                <input
                  type="text"
                  value={candidateForm.class}
                  onChange={(e) => setCandidateForm({...candidateForm, class: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Contoh: XII IPA 1"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button 
                  type="submit" 
                  className="w-full sm:flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Update
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditCandidate(false);
                    setEditingCandidate(null);
                    setCandidateForm({ name: '', photo: '', photoFile: null, vision: '', mission: '', class: '' });
                  }}
                  className="w-full sm:flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Token Modal */}
      {showAddToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Generate Token</h3>
            <form onSubmit={handleAddTokens} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipe Token</label>
                <select
                  value={tokenForm.type}
                  onChange={(e) => setTokenForm({...tokenForm, type: e.target.value as 'student' | 'teacher'})}
                  className="input-field"
                >
                  <option value="student">Siswa</option>
                  <option value="teacher">Guru</option>
                </select>
              </div>
              {tokenForm.type === 'student' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Kelas</label>
                  <select
                    value={tokenForm.class}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTokenForm({...tokenForm, class: value, customClass: value === '__custom' ? tokenForm.customClass : ''});
                    }}
                    className="input-field"
                    required
                  >
                    <option value="">Pilih kelas...</option>
                    {getUniqueClasses().map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                    <option value="__custom">+ Kelas lain...</option>
                  </select>
                   {tokenForm.class === '__custom' && (
                   <input
                     type="text"
                     value={tokenForm.customClass || ''}
                     onChange={(e) => setTokenForm({...tokenForm, customClass: e.target.value})}
                     className="input-field"
                     placeholder="Masukkan nama kelas"
                     required
                   />
                   )}
                </div>
              )}

              <div>
                  <label className="block text-sm font-medium text-gray-700">Jumlah Token</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={tokenForm.count}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setTokenForm({...tokenForm, count: value});
                    }}
                    className="input-field"
                    placeholder="Masukkan jumlah (1-100)"
                    required
                  />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="submit" className="btn-primary w-full sm:flex-1">Generate</button>
                <button 
                  type="button" 
                  onClick={() => setShowAddToken(false)}
                  className="btn-secondary w-full sm:flex-1"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

             {/* Add Admin Modal */}
       {showAddAdmin && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-2 sm:p-4 z-50">
           <div className="bg-white rounded-t-2xl sm:rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
             <h3 className="text-lg font-semibold mb-4">Tambah Admin</h3>
             <form onSubmit={handleAddAdmin} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700">Nama</label>
                 <input
                   type="text"
                   value={adminForm.name}
                   onChange={(e) => setAdminForm({...adminForm, name: e.target.value})}
                   className="input-field"
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">Email</label>
                 <input
                   type="email"
                   value={adminForm.email}
                   onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                   className="input-field"
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">Password</label>
                 <input
                   type="password"
                   value={adminForm.password}
                   onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                   className="input-field"
                   required
                   minLength={6}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">Role</label>
                 <select
                   value={adminForm.role}
                   onChange={(e) => setAdminForm({...adminForm, role: e.target.value as 'admin' | 'super'})}
                   className="input-field"
                 >
                   <option value="admin">Admin</option>
                   <option value="super">Super Admin</option>
                 </select>
               </div>
               <div className="flex flex-col sm:flex-row gap-3">
                 <button type="submit" className="btn-primary w-full sm:flex-1">Tambah</button>
                 <button 
                   type="button" 
                   onClick={() => setShowAddAdmin(false)}
                   className="btn-secondary w-full sm:flex-1"
                 >
                   Batal
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md mx-auto">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                confirmModalData?.type === 'danger' ? 'bg-red-100' : 
                confirmModalData?.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
              }`}>
                <span className={`text-lg ${
                  confirmModalData?.type === 'danger' ? 'text-red-600' : 
                  confirmModalData?.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                }`}>
                  {confirmModalData?.type === 'danger' ? '⚠️' : 
                   confirmModalData?.type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{confirmModalData?.title}</h3>
            </div>
            
            <p className="text-gray-600 mb-6 whitespace-pre-line">{confirmModalData?.message}</p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className={`w-full sm:flex-1 px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  confirmModalData?.type === 'danger' 
                    ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {confirmModalData?.cancelText}
              </button>
              <button
                onClick={confirmModalData?.onConfirm}
                className={`w-full sm:flex-1 px-4 py-2 text-sm font-medium rounded-md text-white transition-colors ${
                  confirmModalData?.type === 'danger' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : confirmModalData?.type === 'warning'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmModalData?.confirmText}
              </button>
            </div>
          </div>
        </div>
       )}

      {/* Floating Help Button */}
      <button
        onClick={() => setShowHelpModal(true)}
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 group"
        title="Bantuan & Informasi"
      >
        <Lightbulb className="h-6 w-6" />
        <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Bantuan & Info
        </div>
      </button>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Lightbulb className="h-6 w-6 mr-2 text-primary-600" />
                Bantuan & Informasi
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Export Options */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  📊 Export Options
                </h4>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>Export Excel:</strong> Unduh semua token sesuai filter dalam 1 file CSV</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>Export per Kelas:</strong> Unduh semua token siswa dalam 1 file CSV dengan section terpisah per kelas (tidak dipisah comma)</span>
                  </li>
                </ul>
              </div>

              {/* Token Management */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  🔧 Token Management
                </h4>
                <ul className="text-sm text-green-800 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>Reset Token:</strong> Klik status "Terpakai" untuk mengembalikan token menjadi tersedia (akan menghapus vote)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>Hapus Token:</strong> Klik ikon trash untuk menghapus token</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>Salin Token:</strong> Klik ikon copy untuk menyalin kode token</span>
                  </li>
                </ul>
              </div>

              {/* Voting Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  💡 Info Bobot Voting
                </h4>
                <div className="text-sm text-yellow-800">
                  <p><strong>Siswa = 1 poin, Guru = 2 poin.</strong> Reset token akan mengurangi hasil voting sesuai bobot token tersebut.</p>
                </div>
              </div>

              {/* Additional Tips */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  💡 Tips Tambahan
                </h4>
                <ul className="text-sm text-purple-800 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Gunakan filter untuk melihat token berdasarkan kelas atau tipe</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Sorting dapat dilakukan dengan mengklik header tabel</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Grafik akan otomatis diperbarui saat ada perubahan data</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Klik 3x pada total poin untuk mengedit nilai secara manual</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="btn-primary px-6 py-2"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tokens By Class Modal */}
      {showDeleteClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hapus Token per Kelas</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>
                <select
                  value={deleteClassSelected}
                  onChange={(e) => setDeleteClassSelected(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {getUniqueClasses().map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
    </div>
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-md p-3">
                Tindakan ini hanya menghapus token untuk kelas terpilih. Data voting tidak terhapus.
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  disabled={!deleteClassSelected}
                  onClick={() => handleDeleteTokensByClass(deleteClassSelected)}
                  className={`w-full sm:flex-1 px-4 py-2 text-sm font-medium rounded-md text-white transition-colors ${deleteClassSelected ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'}`}
                >
                  Hapus Token Kelas
                </button>
                <button
                  onClick={() => {
                    setShowDeleteClassModal(false);
                    setDeleteClassSelected('');
                  }}
                  className="w-full sm:flex-1 px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Generate Modal */}
      {showQuickGenerate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-lg p-4 sm:p-6 w-full max-w-xl mx-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Cepat Token</h3>
            <form onSubmit={handleQuickGenerate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cakupan</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button type="button" onClick={() => setQuickScope('all_classes')} className={`px-3 py-2 rounded-md border ${quickScope==='all_classes' ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-300 text-gray-700'}`}>Semua Kelas</button>
                  <button type="button" onClick={() => setQuickScope('selected_classes')} className={`px-3 py-2 rounded-md border ${quickScope==='selected_classes' ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-300 text-gray-700'}`}>Pilih Kelas</button>
                  <button type="button" onClick={() => setQuickScope('teachers')} className={`px-3 py-2 rounded-md border ${quickScope==='teachers' ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-300 text-gray-700'}`}>Guru</button>
                </div>
              </div>

              {quickScope !== 'teachers' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preset Kelas (opsional)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                    {Object.keys(presetOptions).map((key) => (
                      <button key={key} type="button" onClick={() => applyPresetClasses(key)} className={`px-3 py-2 text-xs rounded-md border ${quickPreset===key ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-300 text-gray-700'}`}>{key}</button>
                    ))}
                  </div>
                  {quickScope === 'selected_classes' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                        {getUniqueClasses().map((cls) => {
                          const active = quickSelectedClasses.includes(cls);
                          return (
                            <button type="button" key={cls} onClick={() => setQuickSelectedClasses(active ? quickSelectedClasses.filter(c=>c!==cls) : [...quickSelectedClasses, cls])} className={`px-2 py-1 text-xs rounded border ${active ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}>{cls}</button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah per kelas / guru</label>
                <input type="number" min={1} max={100} value={quickPerClassCount} onChange={(e)=>setQuickPerClassCount(parseInt(e.target.value)||1)} className="input-field w-32" />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button type="submit" className="w-full sm:flex-1 btn-primary">Generate</button>
                <button type="button" onClick={()=>setShowQuickGenerate(false)} className="w-full sm:flex-1 btn-secondary">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;



