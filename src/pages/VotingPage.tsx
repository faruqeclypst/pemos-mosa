import { useState, useEffect } from 'react';
import pb from '../config/pocketbase';
import { Candidate, Token } from '../types';
import { Heart, Check, Key, ArrowLeft, Users, Vote as VoteIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const VotingPage = () => {
  const [step, setStep] = useState<'token' | 'voting' | 'confirm' | 'complete'>('token');
  const [token, setToken] = useState('');
  const [currentToken, setCurrentToken] = useState<Token | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const list = await pb.collection('candidates').getFullList({ sort: '-created', $autoCancel: false });
      const mapped: Candidate[] = list.map((c: any) => {
        let photoUrl = '';
        if (c.photo) {
          // If schema uses file field
          try { photoUrl = pb.getFileUrl(c, c.photo); } catch { photoUrl = typeof c.photo === 'string' ? c.photo : ''; }
        }
        return {
          id: c.id,
          name: c.name,
          photo: photoUrl,
          vision: c.vision,
          mission: c.mission,
          class: c.class,
          createdAt: c.created ? new Date(c.created) : new Date(),
          updatedAt: c.updated ? new Date(c.updated) : new Date(),
        };
      });
      setCandidates(mapped);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast.error('Gagal memuat data kandidat');
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const code = token.toUpperCase();
      const result = await pb.collection('tokens').getFirstListItem(`code = "${code}" && isUsed = false`);
      const foundToken: Token = {
        id: result.id,
        code: result.code,
        type: result.type,
        class: result.class,
        teacher: result.teacher,
        isUsed: result.isUsed,
        createdAt: result.created ? new Date(result.created) : new Date(),
        usedAt: result.usedAt ? new Date(result.usedAt) : undefined,
      };
      setCurrentToken(foundToken);
      setStep('voting');
      toast.success('Token valid! Silakan mulai voting');
    } catch (error) {
      console.error('Error validating token:', error);
      toast.error('Token tidak valid atau sudah digunakan');
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
      const points = currentToken.type === 'student' ? 1 : 2;
      await pb.collection('votes').create({
        candidateId: selectedCandidate.id,
        tokenId: currentToken.id,
        points,
      });

      await pb.collection('tokens').update(currentToken.id, {
        isUsed: true,
        usedAt: new Date().toISOString(),
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

  if (step === 'token') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Kembali ke Beranda
            </Link>
            <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
              <Key className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Masukkan Token</h1>
            <p className="text-gray-600">
              Masukkan token 5 karakter yang telah diberikan untuk mulai voting
            </p>
          </div>

          <form onSubmit={handleTokenSubmit} className="space-y-6">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                Token Voting
              </label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                className="input-field text-center text-2xl font-mono tracking-widest"
                placeholder="ABCDE"
                maxLength={5}
                required
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Token siswa = 1 poin, Token guru = 2 poin
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || token.length !== 5}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
              ) : (
                'Mulai Voting'
              )}
            </button>
          </form>
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm px-4 sm:px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Key className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Pemilihan Ketua OSIS</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Token: {currentToken?.code} ({currentToken?.type === 'student' ? 'Siswa' : 'Guru'})
                </p>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              Pilih kandidat favorit Anda
            </div>
          </div>
        </header>

                 {/* Candidates Grid */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
             {candidates.map((candidate) => (
               <div
                 key={candidate.id}
                 className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                 onClick={() => handleSelectCandidate(candidate)}
               >
                                   {/* Image with overlay text information */}
                  <div className="relative">
                    <img
                      src={candidate.photo || 'https://placehold.co/400x480?text=No+Image'}
                      alt={candidate.name}
                      className="w-full h-96 object-cover object-center"
                    />
                    
                    {/* Overlay gradient for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    
                    {/* Text information overlaid on image */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                      <h2 className="text-lg sm:text-xl font-bold mb-2 drop-shadow-lg">{candidate.name}</h2>
                      {candidate.class && (
                        <p className="text-sm text-white/90 mb-3 font-medium drop-shadow-md">{candidate.class}</p>
                      )}
                      
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-1 flex items-center drop-shadow-md">
                            <VoteIcon className="h-3 w-3 mr-2 text-white/90" />
                            Visi
                          </h3>
                          <p className="text-sm text-white/95 leading-relaxed line-clamp-2 drop-shadow-md">{candidate.vision}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-1 flex items-center drop-shadow-md">
                            <VoteIcon className="h-3 w-3 mr-2 text-white/90" />
                            Misi
                          </h3>
                          <p className="text-sm text-white/95 leading-relaxed line-clamp-2 drop-shadow-md">{candidate.mission}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                 
                 <div className="p-4 sm:p-6">
                   <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
                     <Heart className="h-5 w-5 mr-2" />
                     Pilih Kandidat Ini
                   </button>
                 </div>
               </div>
             ))}
           </div>
         </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Konfirmasi Voting</h2>
              <p className="text-gray-600">
                Anda akan memberikan {currentToken?.type === 'student' ? '1' : '2'} poin untuk:
              </p>
            </div>

            {selectedCandidate && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{selectedCandidate.name}</h3>
                  {selectedCandidate.class && (
                    <p className="text-sm text-gray-600 mb-2">{selectedCandidate.class}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    Token: {currentToken?.code} ({currentToken?.type === 'student' ? 'Siswa' : 'Guru'})
                  </p>
                </div>
                
                                 <div className="flex justify-center">
                   <img
                     src={selectedCandidate.photo || 'https://placehold.co/200x250?text=No+Image'}
                     alt={selectedCandidate.name}
                     className="w-32 h-40 object-cover object-center rounded-lg shadow-md"
                   />
                 </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleConfirmVote}
                disabled={loading}
                className="w-full btn-primary py-3 text-lg disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                ) : (
                  'Konfirmasi & Submit'
                )}
              </button>
              
              <button
                onClick={() => setStep('voting')}
                disabled={loading}
                className="w-full btn-secondary py-3 text-lg disabled:opacity-50"
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto h-20 w-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
            <Check className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Voting Berhasil!</h1>
          <p className="text-gray-600 mb-8">
            Terima kasih telah berpartisipasi dalam pemilihan ketua OSIS. 
            Suara Anda telah tercatat dengan aman.
          </p>
          
          <Link to="/" className="btn-primary">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return null;
};

export default VotingPage;



