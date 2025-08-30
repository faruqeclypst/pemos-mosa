import { useState, useEffect, useMemo, useCallback } from 'react';
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
  UserPlus,
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
  const [resultsTab, setResultsTab] = useState('overview');

  const [chartType, setChartType] = useState('bar');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
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
    count: 1
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
      setAdmins(adminsData);
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
      setVotes(votesData);
      // Debounce last update to reduce chart re-renders
      setTimeout(() => {
        setLastUpdate(new Date());
      }, 500);
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

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let photoUrl = candidateForm.photo;
      
      // If there's a file uploaded, convert it to base64
      if (candidateForm.photoFile) {
        const reader = new FileReader();
        photoUrl = await new Promise((resolve) => {
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.readAsDataURL(candidateForm.photoFile!);
        });
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
      setShowAddCandidate(false);
      toast.success('Kandidat berhasil ditambahkan');
    } catch (error) {
      console.error('Error adding candidate:', error);
      toast.error('Gagal menambahkan kandidat');
    }
  };

  const handleAddTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tokensToAdd = [];
      for (let i = 0; i < tokenForm.count; i++) {
        const token: any = {
          code: generateToken(),
          type: tokenForm.type,
          isUsed: false,
          createdAt: new Date().toISOString()
        };
        
        // Only add class property for student tokens
        if (tokenForm.type === 'student' && tokenForm.class) {
          token.class = tokenForm.class;
        }
        

        
        tokensToAdd.push(token);
      }
      
      const tokensRef = ref(db, 'tokens');
      for (const token of tokensToAdd) {
        await push(tokensRef, token);
      }
      
      setTokenForm({ type: 'student', class: '', count: 1 });
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
        const reader = new FileReader();
        photoUrl = await new Promise((resolve) => {
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.readAsDataURL(candidateForm.photoFile!);
        });
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

  const handleDeleteAdmin = async (id: string) => {
    showConfirmDialog({
      title: 'Hapus Admin',
      message: 'Apakah Anda yakin ingin menghapus admin ini? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Hapus Admin',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          const adminRef = ref(db, `admins/${id}`);
          await remove(adminRef);
          toast.success('Admin berhasil dihapus');
        } catch (error) {
          console.error('Error deleting admin:', error);
          toast.error('Gagal menghapus admin');
        }
        setShowConfirmModal(false);
      },
      type: 'danger'
    });
  };

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
      message: '⚠️ PERHATIAN: Ini akan menghapus SEMUA data voting dan mengembalikan semua token menjadi tersedia. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan?',
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
    
    // Apply sorting
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
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
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
        color: index === 0 ? '#fbbf24' : index === 1 ? '#3b82f6' : index === 2 ? '#10b981' : '#8b5cf6'
      }));
    }
    
    return validResults.map((result, index) => ({
      name: result.candidate.name,
      value: result.totalPoints,
      color: index === 0 ? '#fbbf24' : index === 1 ? '#3b82f6' : index === 2 ? '#10b981' : '#8b5cf6'
    }));
  }, [getVotingResults]); // Dependency array untuk memoization

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
      color: index === 0 ? '#fbbf24' : index === 1 ? '#3b82f6' : index === 2 ? '#10b981' : '#8b5cf6'
    }));
  }, [getVotingResults]); // Dependency array untuk memoization



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
            <button
              onClick={() => setActiveTab('admins')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'admins'
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Admin
            </button>
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
                  {/* Image with overlay text information */}
                  <div className="relative mb-4">
                    <img
                      src={candidate.photo || 'https://via.placeholder.com/400x480?text=No+Image'}
                      alt={candidate.name}
                      className="w-full h-96 object-cover object-center rounded-lg shadow-md"
                    />
                    
                    {/* Overlay gradient for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-lg"></div>
                    
                    {/* Text information overlaid on image */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-lg font-semibold mb-2 drop-shadow-lg">{candidate.name}</h3>
                      {candidate.class && (
                        <p className="text-sm text-white/90 mb-3 drop-shadow-md">
                          <span className="font-medium">Kelas:</span> {candidate.class}
                        </p>
                      )}
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-white/80 uppercase tracking-wide mb-1 drop-shadow-md">Visi</p>
                          <p className="text-sm text-white/95 leading-relaxed drop-shadow-md line-clamp-2">{candidate.vision}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white/80 uppercase tracking-wide mb-1 drop-shadow-md">Misi</p>
                          <p className="text-sm text-white/95 leading-relaxed drop-shadow-md line-clamp-2">{candidate.mission}</p>
                        </div>
                      </div>
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
                                   <button
                    onClick={exportTokensToExcel}
                    className="btn-secondary flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={exportTokensPerClass}
                    className="btn-secondary flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export per Kelas
                  </button>
                 <button
                   onClick={() => setShowAddToken(true)}
                   className="btn-primary flex items-center"
                 >
                   <Key className="h-4 w-4 mr-2" />
                   Generate Token
                 </button>
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
                   {getUniqueClasses().map((className) => (
                     <button
                       key={className}
                       onClick={() => setTokenTab(className)}
                       className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                         tokenTab === className
                           ? 'border-primary-500 text-primary-600'
                           : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                       }`}
                     >
                       {className} ({tokens.filter(t => t.type === 'student' && t.class === className).length})
                     </button>
                   ))}
                 </nav>
               </div>
                           </div>

                             {/* Export Instructions */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  <strong>📊 Export Options:</strong>
                </p>
                <ul className="text-sm text-green-800 mt-2 space-y-1">
                  <li>• <strong>Export Excel:</strong> Unduh semua token sesuai filter dalam 1 file CSV</li>
                  <li>• <strong>Export per Kelas:</strong> Unduh semua token siswa dalam 1 file CSV dengan section terpisah per kelas (tidak dipisah comma)</li>
                </ul>
              </div>

              {/* Token Management Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>🔧 Token Management:</strong>
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• <strong>Reset Token:</strong> Klik status "Terpakai" untuk mengembalikan token menjadi tersedia (akan menghapus vote)</li>
                  <li>• <strong>Hapus Token:</strong> Klik ikon trash untuk menghapus token</li>
                  <li>• <strong>Salin Token:</strong> Klik ikon copy untuk menyalin kode token</li>
                </ul>
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <strong>💡 Info Bobot Voting:</strong> Siswa = 1 poin, Guru = 2 poin. Reset token akan mengurangi hasil voting sesuai bobot token tersebut.
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
                 <div className="flex items-end">
                   <button
                     onClick={() => {
                       setSearchTerm('');
                       setSortField('createdAt');
                       setSortDirection('desc');
                     }}
                     className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                   >
                     Reset
                   </button>
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
                   {getCurrentTokens().map((token) => (
                     <tr key={token.id}>
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
                     </p>
                   </div>
                   <div>
                     <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                       <button
                         onClick={() => handlePageChange(currentPage - 1)}
                         disabled={currentPage === 1}
                         className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         <span className="sr-only">Previous</span>
                         <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                           <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                         </svg>
                       </button>
                       
                       {/* Page Numbers */}
                       {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                         <button
                           key={page}
                           onClick={() => handlePageChange(page)}
                           className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                             page === currentPage
                               ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                               : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                           }`}
                         >
                           {page}
                         </button>
                       ))}
                       
                       <button
                         onClick={() => handlePageChange(currentPage + 1)}
                         disabled={currentPage === getTotalPages()}
                         className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         <span className="sr-only">Next</span>
                         <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                           <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                         </svg>
                       </button>
                     </nav>
                   </div>
                 </div>
               </div>
             )}
           </div>
         )}

        {activeTab === 'admins' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Daftar Admin</h2>
              <button
                onClick={() => setShowAddAdmin(true)}
                className="btn-primary flex items-center"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Tambah Admin
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {admins.map((admin) => (
                <div key={admin.id} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {admin.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{admin.name}</h3>
                        <p className="text-sm text-gray-600">{admin.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Hapus admin"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      admin.role === 'super' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {admin.role === 'super' ? 'Super Admin' : 'Admin'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Dibuat: {new Date(admin.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                          onClick={() => setResultsTab('overview')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            resultsTab === 'overview'
                              ? 'border-primary-500 text-primary-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <PieChart className="h-5 w-5 inline mr-2" />
                          Overview
                        </button>
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
                      </nav>
                    </div>

                    <div className="p-6">
                                             {/* Overview Tab - Redesigned for Better UX */}
                       {resultsTab === 'overview' && (
                         <div className="space-y-6">
                           {/* Welcome Header */}
                           <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                             <h3 className="text-3xl font-bold text-gray-800 mb-2">🎯 Dashboard Overview</h3>
                             <p className="text-gray-600 mb-4">Selamat datang di halaman overview hasil voting</p>
                             <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm">
                               <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                               <span className="text-sm text-gray-700">Live Update</span>
                               <span className="text-xs text-gray-500">• Current: {currentTime.toLocaleTimeString('id-ID')}</span>
                               <button 
                                 onClick={() => setLastUpdate(new Date())}
                                 className="ml-2 p-1 text-gray-500 hover:text-gray-700 transition-colors"
                                 title="Refresh data"
                               >
                                 <RefreshCw className="h-4 w-4" />
                               </button>
                             </div>
                           </div>

                           {/* Main Content Grid */}
                           <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
                             
                             {/* Quick Stats */}
                             <div className="space-y-6">
                               
                               {/* Top Performer Card */}
                               <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                                 <div className="flex items-center justify-between mb-4">
                                   <h5 className="font-bold text-gray-800">🏆 Top Performer</h5>
                                   <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                                     <span className="text-white text-sm font-bold">1</span>
                                   </div>
                                 </div>
                                 <div className="text-center">
                                   <div className="text-2xl font-bold text-gray-800 mb-1">
                                     {getVotingResults()[0]?.candidate.name || 'Belum ada'}
                                   </div>
                                   <div className="text-sm text-gray-600 mb-3">
                                     {getVotingResults()[0]?.totalPoints || 0} poin
                                   </div>
                                   <div className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                     🎯 Juara
                                   </div>
                                 </div>
                               </div>
                               
                               {/* Voting Summary Card */}
                               <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                 <h5 className="font-bold text-gray-800 mb-4 flex items-center">
                                   <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                                   Ringkasan Voting
                                 </h5>
                                 <div className="space-y-4">
                                   <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                                     <div className="flex items-center space-x-2">
                                       <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                       <span className="text-sm text-gray-700">Total Poin</span>
                                     </div>
                                     <span className="text-lg font-bold text-green-600">
                                       {votes.reduce((sum, vote) => sum + vote.points, 0)}
                                     </span>
                                   </div>
                                   
                                   <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                                     <div className="flex items-center space-x-2">
                                       <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                                       <span className="text-sm text-gray-700">Rata-rata</span>
                                     </div>
                                     <span className="text-lg font-bold text-blue-600">
                                       {votes.length > 0 ? Math.round((votes.reduce((sum, vote) => sum + vote.points, 0) / votes.length) * 10) / 10 : 0}
                                     </span>
                                   </div>
                                   
                                   <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                                     <div className="flex items-center space-x-2">
                                       <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                                       <span className="text-sm text-gray-700">Kandidat</span>
                                     </div>
                                     <span className="text-lg font-bold text-purple-600">{candidates.length}</span>
                                   </div>
                                 </div>
                               </div>
                               
                               {/* Quick Actions Card */}
                               <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
                                 <h5 className="font-bold text-gray-800 mb-4">⚡ Quick Actions</h5>
                                 <div className="space-y-3">
                                   <button 
                                     onClick={() => setResultsTab('ranking')}
                                     className="w-full p-3 bg-white rounded-xl border border-indigo-200 hover:bg-indigo-50 transition-colors duration-200 text-left"
                                   >
                                     <div className="flex items-center justify-between">
                                       <span className="text-sm font-medium text-gray-700">Lihat Ranking</span>
                                       <span className="text-indigo-600">→</span>
                                     </div>
                                   </button>
                                   
                                   <button 
                                     onClick={() => setResultsTab('charts')}
                                     className="w-full p-3 bg-white rounded-xl border border-indigo-200 hover:bg-indigo-50 transition-colors duration-200 text-left"
                                   >
                                     <div className="flex items-center justify-between">
                                       <span className="text-sm font-medium text-gray-700">Analisis Grafik</span>
                                       <span className="text-indigo-600">→</span>
                                     </div>
                                   </button>
                                   
                                   <button 
                                     onClick={() => setResultsTab('votes')}
                                     className="w-full p-3 bg-white rounded-xl border border-indigo-200 hover:bg-indigo-50 transition-colors duration-200 text-left"
                                   >
                                     <div className="flex items-center justify-between">
                                       <span className="text-sm font-medium text-gray-700">Detail Votes</span>
                                       <span className="text-indigo-600">→</span>
                                     </div>
                                   </button>
                                 </div>
                               </div>
                               
                             </div>
                           </div>
                           
                           {/* Bottom Info Section */}
                           <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                             <div className="text-center">
                               <h5 className="font-semibold text-gray-800 mb-2">💡 Tips Penggunaan</h5>
                               <p className="text-gray-600 text-sm">
                                 Gunakan tab "Perangkingan" untuk melihat posisi kandidat, "Grafik" untuk analisis visual, 
                                 dan "Detail Votes" untuk melihat semua data voting secara detail.
                               </p>
                             </div>
                           </div>
                           
                         </div>
                       )}

                      {/* Ranking Tab */}
                      {resultsTab === 'ranking' && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Perangkingan Kandidat</h3>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-800">
                              <strong>💡 Tips:</strong> Klik 3x pada nilai total poin untuk mengedit nilai. Perubahan akan otomatis memperbarui grafik dan perangkingan.
                            </p>
                          </div>
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
                            <div className="bg-white rounded-lg p-6 border border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <PieChart className="h-5 w-5 mr-2 text-green-600" />
                                Hasil Voting - Distribusi Poin
                              </h4>
                              {pieChartData.length === 0 ? (
                                <div className="flex items-center justify-center h-64 text-gray-500">
                                  <div className="text-center">
                                    <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium">Belum ada data voting</p>
                                    <p className="text-sm">Data akan muncul setelah ada voting</p>
                                  </div>
                                </div>
                              ) : (
                                <ResponsiveContainer width="100%" height={400} key={`pie-${pieChartData.length}`}>
                                  <RechartsPieChart>
                                    <Pie
                                      data={pieChartData}
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
                                    >
                                      {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
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

                      {/* Votes Tab */}
                      {resultsTab === 'votes' && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Semua Votes</h3>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-yellow-800">
                              <strong>🔒 Transparansi:</strong> Token tidak ditampilkan untuk menjaga kerahasiaan dan transparansi voting. Hanya tipe voter (Siswa/Guru) yang ditampilkan.
                            </p>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Kandidat
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipe Voter
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tanggal
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {votes.map((vote) => {
                                  const candidate = candidates.find(c => c.id === vote.candidateId);
                                  const token = tokens.find(t => t.id === vote.tokenId);
                                  
                                  return (
                                    <tr key={vote.id}>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <img
                                            src={candidate?.photo || 'https://via.placeholder.com/32x32?text=No+Image'}
                                            alt={candidate?.name}
                                            className="w-8 h-8 rounded-full object-cover object-center mr-3"
                                          />
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">{candidate?.name}</div>
                                            {candidate?.class && (
                                              <div className="text-sm text-gray-500">{candidate.class}</div>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                          token?.type === 'student' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-blue-100 text-blue-800'
                                        }`}>
                                          {token?.type === 'student' ? 'Siswa' : 'Guru'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(vote.createdAt).toLocaleDateString('id-ID', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Visi</label>
                <textarea
                  value={candidateForm.vision}
                  onChange={(e) => setCandidateForm({...candidateForm, vision: e.target.value})}
                  className="input-field"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Misi</label>
                <textarea
                  value={candidateForm.mission}
                  onChange={(e) => setCandidateForm({...candidateForm, mission: e.target.value})}
                  className="input-field"
                  rows={3}
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary flex-1">Tambah</button>
                <button 
                  type="button" 
                  onClick={() => setShowAddCandidate(false)}
                  className="btn-secondary flex-1"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visi</label>
                <textarea
                  value={candidateForm.vision}
                  onChange={(e) => setCandidateForm({...candidateForm, vision: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Misi</label>
                <textarea
                  value={candidateForm.mission}
                  onChange={(e) => setCandidateForm({...candidateForm, mission: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  required
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kelas</label>
                  <input
                    type="text"
                    value={tokenForm.class}
                    onChange={(e) => setTokenForm({...tokenForm, class: e.target.value})}
                    className="input-field"
                    placeholder="Contoh: XII IPA 1"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Jumlah Token</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={tokenForm.count}
                  onChange={(e) => setTokenForm({...tokenForm, count: parseInt(e.target.value)})}
                  className="input-field"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary flex-1">Generate</button>
                <button 
                  type="button" 
                  onClick={() => setShowAddToken(false)}
                  className="btn-secondary flex-1"
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
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
               <div className="flex space-x-3">
                 <button type="submit" className="btn-primary flex-1">Tambah</button>
                 <button 
                   type="button" 
                   onClick={() => setShowAddAdmin(false)}
                   className="btn-secondary flex-1"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  confirmModalData?.type === 'danger' 
                    ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {confirmModalData?.cancelText}
              </button>
              <button
                onClick={confirmModalData?.onConfirm}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md text-white transition-colors ${
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
    </div>
  );
};

export default AdminDashboard;



