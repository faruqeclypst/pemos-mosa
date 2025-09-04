import { Link } from 'react-router-dom';
import { Vote, Users, Shield, TrendingUp, CheckCircle, Key, Smartphone, Globe } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 rounded-lg p-2">
                <Vote className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
               PEMOS {new Date().getFullYear()}
             </h1>
            </div>
            <Link 
              to="/admin/login" 
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-medium mb-4">
              <CheckCircle className="h-4 w-4 mr-2" />
              Sistem Voting Digital Terpercaya
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Suara Anda
            <span className="block text-primary-600 bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
              Menentukan Masa Depan
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Berpartisipasilah dalam pemilihan ketua OSIS dengan sistem voting digital yang aman, 
            transparan, dan mudah digunakan. Setiap suara memiliki arti.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/vote" 
              className="inline-flex items-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Vote className="mr-2 h-6 w-6" />
              Voting Sekarang
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Aman & Terpercaya</h3>
            <p className="text-gray-600 text-center leading-relaxed">
              Sistem voting yang dilengkapi dengan token unik dan enkripsi data untuk menjamin keamanan 
              dan integritas setiap suara yang diberikan.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Smartphone className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Responsive Design</h3>
            <p className="text-gray-600 text-center leading-relaxed">
              Interface yang user-friendly dengan desain responsive untuk pengalaman voting yang optimal 
              di semua perangkat, dari smartphone hingga desktop.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Real-time Analytics</h3>
            <p className="text-gray-600 text-center leading-relaxed">
              Hasil voting dapat dilihat secara real-time dengan visualisasi yang informatif, 
              termasuk grafik dan perangkingan kandidat yang transparan.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Cara Menggunakan Sistem Voting
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Key className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Masukkan Token</h3>
              <p className="text-gray-600 leading-relaxed">
                Masukkan token 5 karakter yang telah diberikan oleh admin untuk memverifikasi 
                identitas Anda sebagai pemilih yang sah.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Pilih Kandidat</h3>
              <p className="text-gray-600 leading-relaxed">
                Lihat profil lengkap setiap kandidat termasuk visi dan misi mereka, 
                kemudian pilih kandidat yang paling sesuai dengan harapan Anda.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Konfirmasi & Submit</h3>
              <p className="text-gray-600 leading-relaxed">
                Konfirmasi pilihan Anda dan submit untuk menyelesaikan proses voting. 
                Suara Anda akan langsung tercatat dalam sistem.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="bg-primary-600 rounded-lg p-2">
                <Vote className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">PEMOS SMAN MODAL BANGSA {new Date().getFullYear()}</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Sistem Voting Digital untuk Pemilihan Ketua OSIS
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                <span>Digital Voting System</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                <span>Secure & Transparent</span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-gray-500">&copy; {new Date().getFullYear()} Alfaruq Asri, S.Pd. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
