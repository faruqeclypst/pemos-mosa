import { useState, useEffect } from 'react';
import { ref, get, update, push } from 'firebase/database';
import { db } from '../config/firebase';
import { Candidate, Token, Vote } from '../types';
import { Heart, Check, Key, ArrowLeft, Users, Vote as VoteIcon } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const VotingPage = () => {
  const [step, setStep] = useState<'token' | 'voting' | 'confirm' | 'complete'>('token');
  const [token, setToken] = useState('');
  const [currentToken, setCurrentToken] = useState<Token | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast.error('Gagal memuat data kandidat');
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tokensRef = ref(db, 'tokens');
      const tokenSnapshot = await get(tokensRef);

      if (!tokenSnapshot.exists()) {
        toast.error('Token tidak valid atau sudah digunakan');
        return;
      }

      // Find unused token with matching code
      let foundToken: Token | null = null;
      let tokenId: string | null = null;
      
      tokenSnapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data.code === token.toUpperCase() && !data.isUsed) {
          foundToken = {
            id: childSnapshot.key!,
            ...data,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            usedAt: data.usedAt ? new Date(data.usedAt) : undefined
          };
          tokenId = childSnapshot.key!;
        }
      });

      if (!foundToken || !tokenId) {
        toast.error('Token tidak valid atau sudah digunakan');
        return;
      }

      setCurrentToken(foundToken);
      setStep('voting');
      toast.success('Token valid! Silakan mulai voting');
    } catch (error) {
      console.error('Error validating token:', error);
      toast.error('Gagal memvalidasi token');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setStep('confirm');
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidate || !currentToken) return;

    setLoading(true);
    try {
      // Create vote record
      const vote: Omit<Vote, 'id'> = {
        candidateId: selectedCandidate.id,
        tokenId: currentToken.id,
        points: currentToken.type === 'student' ? 1 : 2,
        createdAt: new Date()
      };
      const votesRef = ref(db, 'votes');
      await push(votesRef, vote);

      // Mark token as used
      const tokenRef = ref(db, `tokens/${currentToken.id}`);
      await update(tokenRef, {
        isUsed: true,
        usedAt: new Date().toISOString()
      });

      setStep('complete');
      toast.success('Voting berhasil! Terima kasih telah berpartisipasi');
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Gagal mengirim voting');
    } finally {
      setLoading(false);
    }
  };

  // Auto-redirect after success
  useEffect(() => {
    if (step === 'complete') {
      setCountdown(5);
      const intervalId = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            navigate('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [step, navigate]);

  // Prefill token via URL (?t=ABCDE) and auto-validate if available
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('t');
    if (!t || step !== 'token') return;
    const code = t.toUpperCase().slice(0, 5);
    setToken(code);
    (async () => {
      try {
        setLoading(true);
        const tokensRef = ref(db, 'tokens');
        const tokenSnapshot = await get(tokensRef);
        if (!tokenSnapshot.exists()) {
          toast.error('Token tidak valid atau sudah digunakan');
          return;
        }
        let found: Token | null = null;
        tokenSnapshot.forEach((child) => {
          const data = child.val();
          if (data.code === code && !data.isUsed) {
            found = {
              id: child.key!,
              ...data,
              createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
              usedAt: data.usedAt ? new Date(data.usedAt) : undefined,
            };
          }
        });
        if (!found) {
          toast.error('Token tidak valid atau sudah digunakan');
          return;
        }
        setCurrentToken(found);
        setStep('voting');
        toast.success('Token valid! Silakan mulai voting');
      } catch (e) {
        console.error('Prefill token error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [location.search, step]);

  if (step === 'token') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur shadow-xl">
            <div className="absolute -top-10 -right-10 h-40 w-40 bg-primary-100 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-12 -left-10 h-48 w-48 bg-blue-100 rounded-full blur-2xl"></div>
            
            <div className="relative p-6 sm:p-10">
              <div className="mb-4">
                <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Kembali ke Beranda
                </Link>
              </div>
              <div className="flex items-center justify-center mb-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-600 grid place-items-center shadow-lg">
                  <Key className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900">
                Masukkan Token Voting
              </h1>
              <p className="text-center text-gray-600 mt-2">
                Masukkan token 5 karakter Anda untuk memulai memilih kandidat.
              </p>

              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-2 mt-6">
                <div className="h-1 w-16 sm:w-24 rounded bg-primary-600"></div>
                <div className="h-1 w-16 sm:w-24 rounded bg-gray-200"></div>
                <div className="h-1 w-16 sm:w-24 rounded bg-gray-200"></div>
              </div>

              <form onSubmit={handleTokenSubmit} className="mt-8 space-y-6">
                <div>
                  <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    Token Voting
                  </label>
                  <input
                    id="token"
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    className="w-full max-w-xs mx-auto block text-center text-3xl font-mono tracking-[0.6em] px-4 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-4 focus:ring-primary-200 focus:border-primary-500 shadow-sm"
                    placeholder="ABCDE"
                    maxLength={5}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Token siswa = 1 poin, Token guru = 2 poin
                  </p>
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loading || token.length !== 5}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-200 hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <VoteIcon className="h-5 w-5" /> Mulai Voting
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'voting') {
    if (!candidates.length) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Tidak Ada Kandidat</h2>
            <p className="text-gray-600 mb-4">Belum ada kandidat yang tersedia untuk voting</p>
            <Link to="/" className="btn-primary">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl">
          {/* Header / status bar */}
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-100 grid place-items-center">
                  <Key className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">Pemilihan Ketua OSIS</h1>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Token: {currentToken?.code} ({currentToken?.type === 'student' ? 'Siswa' : 'Guru'})
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-1 w-20 rounded bg-primary-600"></div>
                <div className="h-1 w-20 rounded bg-primary-600"></div>
                <div className="h-1 w-20 rounded bg-gray-200"></div>
              </div>
            </div>
          </div>

        {/* Candidates Grid */}
        <div className="px-4 sm:px-6 py-6 sm:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="group rounded-2xl bg-white shadow-lg ring-1 ring-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => handleSelectCandidate(candidate)}
              >
                {/* Media */}
                <div className="relative">
                  <div className="relative w-full pt-[120%] overflow-hidden">
                    <img
                      src={candidate.photo || 'https://via.placeholder.com/400x480?text=No+Image'}
                      alt={candidate.name}
                      className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                    <h2 className="text-lg sm:text-xl font-extrabold mb-1 drop-shadow">{candidate.name}</h2>
                    {candidate.class && (
                      <p className="text-sm text-white/90 mb-3 font-medium drop-shadow">{candidate.class}</p>
                    )}
                    <div className="text-xs text-white/90 drop-shadow">Tap untuk memilih</div>
                  </div>
                </div>

                {/* CTA */}
                <div className="p-4 sm:p-6">
                  <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
                    <Heart className="h-5 w-5 mr-2" /> Pilih Kandidat Ini
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6 sm:p-10">
            <div className="text-center mb-6">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-2xl grid place-items-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">Konfirmasi Voting</h2>
              <p className="text-gray-600">
                Anda akan memberikan {currentToken?.type === 'student' ? '1' : '2'} poin untuk kandidat berikut:
              </p>
            </div>

            {selectedCandidate && (
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 sm:p-6 border border-gray-100 mb-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <div className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-lg overflow-hidden shadow">
                    <img
                      src={selectedCandidate.photo || 'https://via.placeholder.com/400x480?text=No+Image'}
                      alt={selectedCandidate.name}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="font-bold text-gray-900 text-lg sm:text-xl">{selectedCandidate.name}</h3>
                    {selectedCandidate.class && (
                      <p className="text-sm text-gray-600 mt-1">{selectedCandidate.class}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-2">
                      Token: {currentToken?.code} ({currentToken?.type === 'student' ? 'Siswa' : 'Guru'})
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleConfirmVote}
                disabled={loading}
                className="w-full sm:flex-1 inline-flex justify-center items-center rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow hover:bg-primary-700 transition disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Konfirmasi & Submit'
                )}
              </button>
              
              <button
                onClick={() => setStep('voting')}
                disabled={loading}
                className="w-full sm:flex-1 inline-flex justify-center items-center rounded-xl bg-gray-100 hover:bg-gray-200 px-6 py-3 font-semibold text-gray-800 transition disabled:opacity-50"
              >
                Kembali & Pilih Lain
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl text-center">
          <div className="mx-auto h-24 w-24 bg-green-500 rounded-3xl grid place-items-center shadow-lg mb-6">
            <Check className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">Voting Berhasil!</h1>
          <p className="text-gray-600 mb-2">Terima kasih telah berpartisipasi. Suara Anda telah tercatat dengan aman.</p>
          <p className="text-gray-500 mb-8">Mengalihkan ke beranda dalam {countdown}s...</p>
          <Link to="/" className="inline-flex items-center rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow hover:bg-primary-700 transition">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return null;
};

export default VotingPage;



