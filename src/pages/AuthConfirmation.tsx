import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { Check, X } from 'lucide-react';

export default function AuthConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (type === 'signup' && token) {
      verifyToken(token);
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  async function verifyToken(token: string) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      if (error) throw error;
      setStatus('success');
      
      // Redirect to app after 3 seconds
      setTimeout(() => {
        navigate('/app');
      }, 3000);
    } catch (error) {
      console.error('Error verifying email:', error);
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-50">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          {status === 'loading' && (
            <>
              <Spinner className="w-12 h-12 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Verifying your email...</h2>
              <p className="text-gray-600">Just a moment while we confirm your account.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Email Confirmed!</h2>
              <p className="text-gray-600 mb-4">Your account has been verified successfully.</p>
              <p className="text-sm text-gray-500">Redirecting you to the app...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-4">
                We couldn't verify your email. The link might be expired or invalid.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="text-blue-600 hover:underline"
              >
                Return to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}