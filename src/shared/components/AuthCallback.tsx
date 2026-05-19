import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Récupère le code dans l'URL (paramètre ?code=...)
    const handleCallback = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.search
      );
      if (error) {
        console.error('Erreur callback:', error);
        navigate('/?auth_error=1');
      } else {
        navigate('/profil');
      }
    };
    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#C1272D] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}