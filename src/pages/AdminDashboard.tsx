import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { ref, get, push, remove, update } from 'firebase/database';
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
  TrendingUp
} from 'lucide-react';
import { Candidate, Token, Admin } from '../types';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('candidates');
  const [tokenTab, setTokenTab] = useState('all');
  const [resultsTab, setResultsTab] = useState('overview');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVote, setEditingVote] = useState<any>(null);
  const [showEditVote, setShowEditVote] = useState(false);
  const navigate = useNavigate();

  // Form states
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [showEditCandidate, setShowEditCandidate] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);

  // Candidate form
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    photo: '',
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
    teacher: '',
    count: 1
  });

  // Admin form
  const [adminForm, setAdminForm] = useState({
    email: '',
    name: '',
    role: 'admin' as 'admin' | 'super'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch candidates
      const candidatesRef = ref(db, 'candidates');
      const candidatesSnapshot = await get(candidatesRef);
      const candidatesData: Candidate[] = [];
      if (candidatesSnapshot.exists()) {
        candidatesSnapshot.forEach((childSnapshot) => {
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

      // Fetch tokens
      const tokensRef = ref(db, 'tokens');
      const tokensSnapshot = await get(tokensRef);
      const tokensData: Token[] = [];
      if (tokensSnapshot.exists()) {
        tokensSnapshot.forEach((childSnapshot) => {
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

      // Fetch admins
      const adminsRef = ref(db, 'admins');
      const adminsSnapshot = await get(adminsRef);
      const adminsData: Admin[] = [];
      if (adminsSnapshot.exists()) {
        adminsSnapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          adminsData.push({
            id: childSnapshot.key!,
            ...data,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
          });
        });
      }
      setAdmins(adminsData);

      // Fetch votes
      const votesRef = ref(db, 'votes');
      const votesSnapshot = await get(votesRef);
      const votesData: any[] = [];
      if (votesSnapshot.exists()) {
        votesSnapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          votesData.push({
            id: childSnapshot.key!,
            ...data,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
          });
        });
      }
      setVotes(votesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

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
      const newCandidate = {
        ...candidateForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const candidatesRef = ref(db, 'candidates');
      await push(candidatesRef, newCandidate);
      setCandidateForm({ name: '', photo: '', vision: '', mission: '', class: '' });
      setShowAddCandidate(false);
      fetchData();
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
        
        // Only add teacher property for teacher tokens
        if (tokenForm.type === 'teacher' && tokenForm.teacher) {
          token.teacher = tokenForm.teacher;
        }
        
        tokensToAdd.push(token);
      }
      
      const tokensRef = ref(db, 'tokens');
      for (const token of tokensToAdd) {
        await push(tokensRef, token);
      }
      
      setTokenForm({ type: 'student', class: '', teacher: '', count: 1 });
      setShowAddToken(false);
      fetchData();
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
      setAdminForm({ email: '', name: '', role: 'admin' });
      setShowAddAdmin(false);
      fetchData();
      toast.success('Admin berhasil ditambahkan');
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error('Gagal menambahkan admin');
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kandidat ini?')) {
      try {
        const candidateRef = ref(db, `candidates/${id}`);
        await remove(candidateRef);
        fetchData();
        toast.success('Kandidat berhasil dihapus');
      } catch (error) {
        console.error('Error deleting candidate:', error);
        toast.error('Gagal menghapus kandidat');
      }
    }
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setEditingCandidate(candidate);
          setCandidateForm({
        name: candidate.name,
        photo: candidate.photo,
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
      const candidateRef = ref(db, `candidates/${editingCandidate.id}`);
      await update(candidateRef, {
        ...candidateForm,
        updatedAt: new Date().toISOString()
      });
      
      setCandidateForm({ name: '', photo: '', vision: '', mission: '', class: '' });
      setEditingCandidate(null);
      setShowEditCandidate(false);
      fetchData();
      toast.success('Kandidat berhasil diperbarui');
    } catch (error) {
      console.error('Error updating candidate:', error);
      toast.error('Gagal memperbarui kandidat');
    }
  };

  const handleDeleteToken = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus token ini?')) {
      try {
        const tokenRef = ref(db, `tokens/${id}`);
        await remove(tokenRef);
        fetchData();
        toast.success('Token berhasil dihapus');
      } catch (error) {
        console.error('Error deleting token:', error);
        toast.error('Gagal menghapus token');
      }
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

  const getVotingResults = () => {
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
  };

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

  const handleEditVote = (vote: any) => {
    setEditingVote(vote);
    setShowEditVote(true);
  };

  const handleUpdateVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVote) return;

    try {
      const voteRef = ref(db, `votes/${editingVote.id}`);
      await update(voteRef, {
        points: parseInt(editingVote.points),
        updatedAt: new Date().toISOString()
      });
      
      setEditingVote(null);
      setShowEditVote(false);
      fetchData();
      toast.success('Nilai vote berhasil diperbarui');
    } catch (error) {
      console.error('Error updating vote:', error);
      toast.error('Gagal memperbarui nilai vote');
    }
  };

  const getPieChartData = () => {
    const results = getVotingResults();
    return results.map((result, index) => ({
      name: result.candidate.name,
      value: result.totalPoints,
      color: index === 0 ? '#fbbf24' : index === 1 ? '#3b82f6' : index === 2 ? '#10b981' : '#8b5cf6'
    }));
  };

  const getBarChartData = () => {
    const results = getVotingResults();
    return results.map((result, index) => ({
      name: result.candidate.name,
      points: result.totalPoints,
      votes: result.totalVotes,
      color: index === 0 ? '#fbbf24' : index === 1 ? '#3b82f6' : index === 2 ? '#10b981' : '#8b5cf6'
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('candidates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'candidates'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-5 w-5 inline mr-2" />
              Kandidat
            </button>
            <button
              onClick={() => setActiveTab('tokens')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tokens'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Key className="h-5 w-5 inline mr-2" />
              Token
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'admins'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="h-5 w-5 inline mr-2" />
              Admin
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'results'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-5 w-5 inline mr-2" />
              Hasil
            </button>
          </nav>
        </div>

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
                  <img
                    src={candidate.photo || 'https://via.placeholder.com/300x200?text=No+Image'}
                    alt={candidate.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                                     <h3 className="text-lg font-semibold text-gray-900 mb-2">{candidate.name}</h3>
                   {candidate.class && (
                     <p className="text-sm text-gray-500 mb-2">
                       <strong>Kelas:</strong> {candidate.class}
                     </p>
                   )}
                   <p className="text-sm text-gray-600 mb-2">
                     <strong>Visi:</strong> {candidate.vision}
                   </p>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Misi:</strong> {candidate.mission}
                  </p>
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
               <button
                 onClick={() => setShowAddToken(true)}
                 className="btn-primary flex items-center"
               >
                 <Key className="h-4 w-4 mr-2" />
                 Generate Token
               </button>
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

              {/* Token Summary */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Key className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Token</p>
                      <p className="text-2xl font-bold text-gray-900">{getFilteredTokens().length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Tersedia</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {getFilteredTokens().filter(token => !token.isUsed).length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Users className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Terpakai</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {getFilteredTokens().filter(token => token.isUsed).length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Persentase</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {getFilteredTokens().length > 0 
                          ? Math.round((getFilteredTokens().filter(token => token.isUsed).length / getFilteredTokens().length) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Token
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Tipe
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Kelas/Guru
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Status
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Aksi
                     </th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {getFilteredTokens().map((token) => (
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
                         {token.type === 'student' ? token.class : token.teacher}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                           token.isUsed 
                             ? 'bg-red-100 text-red-800' 
                             : 'bg-green-100 text-green-800'
                         }`}>
                           {token.isUsed ? 'Terpakai' : 'Tersedia'}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <button
                           onClick={() => handleDeleteToken(token.id)}
                           className="text-red-600 hover:text-red-900"
                         >
                           <Trash2 className="h-4 w-4" />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
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
                  <div className="flex items-center space-x-3 mb-4">
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
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    admin.role === 'super' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {admin.role === 'super' ? 'Super Admin' : 'Admin'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

                                   {activeTab === 'results' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Hasil Voting</h2>
              
              {votes.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600 text-center">Belum ada voting yang dilakukan.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BarChart3 className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Voting</p>
                          <p className="text-2xl font-bold text-gray-900">{votes.length}</p>
                        </div>
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
                      {/* Overview Tab - Pie Chart */}
                      {resultsTab === 'overview' && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Poin (Pie Chart)</h3>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-gray-50 rounded-lg p-6">
                              <div className="flex flex-col items-center">
                                <div className="relative w-64 h-64 mb-4">
                                  {getPieChartData().map((data, index) => {
                                    const total = getPieChartData().reduce((sum, item) => sum + item.value, 0);
                                    const percentage = total > 0 ? (data.value / total) * 100 : 0;
                                    const startAngle = getPieChartData()
                                      .slice(0, index)
                                      .reduce((sum, item) => sum + (item.value / total) * 360, 0);
                                    
                                    return (
                                      <div
                                        key={data.name}
                                        className="absolute inset-0"
                                        style={{
                                          background: `conic-gradient(${data.color} ${startAngle}deg, ${data.color} ${startAngle + (percentage * 3.6)}deg, transparent ${startAngle + (percentage * 3.6)}deg)`
                                        }}
                                      />
                                    );
                                  })}
                                  <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-gray-900">{votes.length}</div>
                                      <div className="text-sm text-gray-600">Total Votes</div>
                                    </div>
                                  </div>
                                </div>
                                                                 <div className="space-y-2">
                                   {getPieChartData().map((data) => (
                                     <div key={data.name} className="flex items-center space-x-2">
                                       <div 
                                         className="w-4 h-4 rounded-full" 
                                         style={{ backgroundColor: data.color }}
                                       ></div>
                                       <span className="text-sm font-medium">{data.name}</span>
                                       <span className="text-sm text-gray-600">({data.value} poin)</span>
                                     </div>
                                   ))}
                                 </div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="bg-white rounded-lg p-4 border">
                                <h4 className="font-semibold text-gray-900 mb-2">Statistik Cepat</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Kandidat Teratas:</span>
                                    <span className="text-sm font-medium">{getVotingResults()[0]?.candidate.name || '-'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Total Poin:</span>
                                    <span className="text-sm font-medium">{votes.reduce((sum, vote) => sum + vote.points, 0)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Rata-rata Poin:</span>
                                    <span className="text-sm font-medium">
                                      {votes.length > 0 ? Math.round((votes.reduce((sum, vote) => sum + vote.points, 0) / votes.length) * 10) / 10 : 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

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
                                          className="w-10 h-10 rounded-full object-cover mr-3"
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
                                      <span className={`text-lg font-bold ${index === 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
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
                          <div className="space-y-6">
                            {/* Bar Chart */}
                            <div className="bg-gray-50 rounded-lg p-6">
                              <h4 className="font-semibold text-gray-900 mb-4">Bar Chart - Total Poin</h4>
                                                             <div className="space-y-4">
                                 {getBarChartData().map((data) => {
                                   const maxPoints = Math.max(...getBarChartData().map(d => d.points));
                                   const percentage = maxPoints > 0 ? (data.points / maxPoints) * 100 : 0;
                                   
                                   return (
                                     <div key={data.name} className="space-y-2">
                                       <div className="flex justify-between text-sm">
                                         <span className="font-medium">{data.name}</span>
                                         <span className="text-gray-600">{data.points} poin ({data.votes} votes)</span>
                                       </div>
                                       <div className="w-full bg-gray-200 rounded-full h-6">
                                         <div
                                           className="h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                           style={{ 
                                             width: `${percentage}%`,
                                             backgroundColor: data.color
                                           }}
                                         >
                                           <span className="text-white text-xs font-medium">{data.points}</span>
                                         </div>
                                       </div>
                                     </div>
                                   );
                                 })}
                               </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Votes Tab */}
                      {resultsTab === 'votes' && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Semua Votes</h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Kandidat
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Token
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Poin
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tanggal
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
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
                                            className="w-8 h-8 rounded-full object-cover mr-3"
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
                                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                          {token?.code}
                                        </span>
                                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                          token?.type === 'student' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-blue-100 text-blue-800'
                                        }`}>
                                          {token?.type === 'student' ? 'Siswa' : 'Guru'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-lg font-bold text-gray-900">{vote.points}</span>
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
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                          onClick={() => handleEditVote(vote)}
                                          className="text-primary-600 hover:text-primary-900"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </button>
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
                <label className="block text-sm font-medium text-gray-700">URL Foto</label>
                <input
                  type="url"
                  value={candidateForm.photo}
                  onChange={(e) => setCandidateForm({...candidateForm, photo: e.target.value})}
                  className="input-field"
                  required
                />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Kandidat</h3>
            <form onSubmit={handleUpdateCandidate} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700">URL Foto</label>
                <input
                  type="url"
                  value={candidateForm.photo}
                  onChange={(e) => setCandidateForm({...candidateForm, photo: e.target.value})}
                  className="input-field"
                  required
                />
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
                <button type="submit" className="btn-primary flex-1">Update</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditCandidate(false);
                    setEditingCandidate(null);
                    setCandidateForm({ name: '', photo: '', vision: '', mission: '', class: '' });
                  }}
                  className="btn-secondary flex-1"
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
              {tokenForm.type === 'teacher' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Guru</label>
                  <input
                    type="text"
                    value={tokenForm.teacher}
                    onChange={(e) => setTokenForm({...tokenForm, teacher: e.target.value})}
                    className="input-field"
                    placeholder="Nama guru"
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

       {/* Edit Vote Modal */}
       {showEditVote && editingVote && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md">
             <h3 className="text-lg font-semibold mb-4">Edit Nilai Vote</h3>
             <form onSubmit={handleUpdateVote} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700">Kandidat</label>
                 <div className="bg-gray-50 p-3 rounded-lg">
                   {(() => {
                     const candidate = candidates.find(c => c.id === editingVote.candidateId);
                     return (
                       <div className="flex items-center">
                         <img
                           src={candidate?.photo || 'https://via.placeholder.com/32x32?text=No+Image'}
                           alt={candidate?.name}
                           className="w-8 h-8 rounded-full object-cover mr-3"
                         />
                         <span className="text-sm font-medium">{candidate?.name}</span>
                       </div>
                     );
                   })()}
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">Token</label>
                 <div className="bg-gray-50 p-3 rounded-lg">
                   {(() => {
                     const token = tokens.find(t => t.id === editingVote.tokenId);
                     return (
                       <div className="flex items-center space-x-2">
                         <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                           {token?.code}
                         </span>
                         <span className={`px-2 py-1 text-xs rounded-full ${
                           token?.type === 'student' 
                             ? 'bg-green-100 text-green-800' 
                             : 'bg-blue-100 text-blue-800'
                         }`}>
                           {token?.type === 'student' ? 'Siswa' : 'Guru'}
                         </span>
                       </div>
                     );
                   })()}
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">Nilai Poin</label>
                 <input
                   type="number"
                   min="1"
                   max="10"
                   value={editingVote.points}
                   onChange={(e) => setEditingVote({...editingVote, points: e.target.value})}
                   className="input-field"
                   required
                 />
                 <p className="text-xs text-gray-500 mt-1">
                   Masukkan nilai poin baru (1-10). Perubahan akan otomatis memperbarui total poin kandidat.
                 </p>
               </div>
               <div className="flex space-x-3">
                 <button type="submit" className="btn-primary flex-1">Update</button>
                 <button 
                   type="button" 
                   onClick={() => {
                     setShowEditVote(false);
                     setEditingVote(null);
                   }}
                   className="btn-secondary flex-1"
                 >
                   Batal
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};

export default AdminDashboard;



