import React from 'react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white font-sans">
      <div className="bg-white p-12 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-border flex flex-col items-center max-w-md w-full mx-4">
        <div className="w-20 h-20 flex items-center justify-center mb-8">
          <svg width="60" height="60" viewBox="0 0 80 80" fill="none">
            <rect x="12" y="10" width="22" height="28" rx="5" stroke="#007185" stroke-width="2.5" fill="none"/>
            <rect x="12" y="10" width="22" height="28" rx="5" stroke="#007185" stroke-width="2.5" fill="none" transform="rotate(18 23 24)" opacity=".5"/>
            <rect x="36" y="42" width="22" height="28" rx="5" stroke="#007185" stroke-width="2.5" fill="none"/>
            <rect x="36" y="42" width="22" height="28" rx="5" stroke="#007185" stroke-width="2.5" fill="none" transform="rotate(18 47 56)" opacity=".5"/>
            <line x1="24" y1="38" x2="56" y2="42" stroke="#007185" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-navy mb-3 bricolage">Saltear</h1>
        <p className="text-muted text-center mb-12 font-medium leading-relaxed">Crie carrosséis estratégicos e elegantes em segundos com o poder da IA.</p>
        
        <button
          onClick={handleLogin}
          className="w-full py-4 bg-white border border-border rounded-lg font-bold text-navy flex items-center justify-center gap-3 hover:bg-off transition-all active:scale-[0.98] shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
          Entrar com Google
        </button>
        
        <p className="mt-12 text-[10px] text-muted font-bold uppercase tracking-[0.2em]">Saltear Intelligence — White Theme</p>
      </div>
    </div>
  );
};

export default Login;
