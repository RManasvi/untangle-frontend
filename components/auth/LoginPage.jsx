// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/context/AuthContext';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Mail, Lock, User, Phone } from 'lucide-react';

// export default function LoginPage() {
//   const [isLogin, setIsLogin] = useState(true);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [name, setName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();
//   const { signIn, signUp, signInWithGoogle } = useAuth();
//   const signInWithGoogle = async () => {
//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: 'google',
//       options: {
//         redirectTo: `${window.location.origin}/onboarding`,
//       },
//     });

//     if (error) throw error;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       if (isLogin) {
//         if (email && password) {
//           await signIn(email, password);
//           router.push('/onboarding');
//         } else {
//           setError('Please fill in all fields');
//         }
//       } else {
//         if (email && password && name && phone) {
//           await signUp(email, password, name, phone);
//           setError('Check your email to confirm your account');
//           setEmail('');
//           setPassword('');
//           setName('');
//           setPhone('');
//         } else {
//           setError('Please fill in all fields');
//         }
//       }
//     } catch (err) {
//       setError(err.message || 'An error occurred. Please try again.');
//       console.error('Auth error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
//       <Card className="w-full max-w-md border-blue-100 bg-white shadow-lg">
//         <CardHeader className="space-y-2 text-center">
//           <div className="h-12 w-12 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
//             <span className="text-white text-xl font-bold">AI</span>
//           </div>
//           <CardTitle className="text-2xl font-bold text-slate-900">
//             {isLogin ? 'Welcome Back' : 'Create Account'}
//           </CardTitle>
//           <p className="text-slate-500 text-sm">
//             {isLogin
//               ? 'Sign in to your wellness companion'
//               : 'Start your mindfulness journey'}
//           </p>
//         </CardHeader>

//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             {!isLogin && (
//               <>
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-slate-700">Name</label>
//                   <div className="relative">
//                     <User className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
//                     <Input
//                       type="text"
//                       placeholder="Your name"
//                       value={name}
//                       onChange={(e) => setName(e.target.value)}
//                       className="pl-10 bg-blue-50 border-blue-200 text-slate-900 placeholder-slate-400"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-slate-700">Phone</label>
//                   <div className="relative">
//                     <Phone className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
//                     <Input
//                       type="tel"
//                       placeholder="Your phone number"
//                       value={phone}
//                       onChange={(e) => setPhone(e.target.value)}
//                       className="pl-10 bg-blue-50 border-blue-200 text-slate-900 placeholder-slate-400"
//                     />
//                   </div>
//                 </div>
//               </>
//             )}

//             <div className="space-y-2">
//               <label className="text-sm font-medium text-slate-700">Email</label>
//               <div className="relative">
//                 <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
//                 <Input
//                   type="email"
//                   placeholder="your@email.com"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="pl-10 bg-blue-50 border-blue-200 text-slate-900 placeholder-slate-400"
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <label className="text-sm font-medium text-slate-700">Password</label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
//                 <Input
//                   type="password"
//                   placeholder="••••••••"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="pl-10 bg-blue-50 border-blue-200 text-slate-900 placeholder-slate-400"
//                 />
//               </div>
//             </div>

//             {error && (
//               <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
//                 {error}
//               </div>
//             )}

//             <Button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium"
//             >
//               {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
//             </Button>
//           </form>
//           <div className="relative my-6">
//             <div className="absolute inset-0 flex items-center">
//               <span className="w-full border-t border-slate-200" />
//             </div>
//             <div className="relative flex justify-center text-xs uppercase">
//               <span className="bg-white px-2 text-slate-400">Or continue with</span>
//             </div>
//           </div>

//           <Button
//             type="button"
//             onClick={signInWithGoogle}
//             className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
//           >
//             Continue with Google
//           </Button>

//           <div className="mt-6 text-center">
//             <p className="text-slate-600 text-sm">
//               {isLogin ? "Don't have an account? " : 'Already have an account? '}
//               <button
//                 onClick={() => {
//                   setIsLogin(!isLogin);
//                   setError('');
//                 }}
//                 className="text-blue-600 hover:text-blue-700 font-medium"
//               >
//                 {isLogin ? 'Sign Up' : 'Sign In'}
//               </button>
//             </p>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, User, Phone } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { createClient } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsMfa, setNeedsMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle, logout } = useAuth();
  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        if (email && password) {
          await signIn(email, password);
          
          const { data, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (mfaError) throw mfaError;

          if (data.nextLevel === 'aal2' && data.nextLevel !== data.currentLevel) {
            const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
            if (factorsError) throw factorsError;
            
            const totpFactor = factors.totp[0];
            if (!totpFactor) throw new Error('No TOTP factor found');

            setMfaFactorId(totpFactor.id);
            setNeedsMfa(true);
            setLoading(false);
            return;
          }

          router.push('/');
        } else {
          setError('Please fill in all fields');
        }
      } else {
        if (email && password && name && phone) {
          await signUp(email, password, name, phone);
          setError('Check your email to confirm your account');
          setEmail('');
          setPassword('');
          setName('');
          setPhone('');
        } else {
          setError('Please fill in all fields');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async (e) => {
    e.preventDefault();
    if (mfaCode.length !== 6) return;
    setLoading(true);
    setError('');

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.data.id,
        code: mfaCode,
      });

      if (verify.error) throw verify.error;

      router.push('/');
    } catch (err) {
      setError(err.message || 'Invalid two-factor authentication code');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
      console.error('Google auth error:', err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-blue-100 bg-white shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo className="h-12" showText={false} />
          </div>
          <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">
            Untangle
          </CardTitle>
          <CardTitle className="text-xl font-bold text-slate-700">
            {isLogin ? 'System Access' : 'Register Account'}
          </CardTitle>
          <p className="text-slate-500 text-sm">
            {isLogin
              ? 'Securely access your professional wellness telemetry'
              : 'Initialize your evidence-based wellness protocol'}
          </p>
        </CardHeader>

        <CardContent>
          {needsMfa ? (
            <form onSubmit={handleVerifyMfa} className="space-y-4">
              <div className="space-y-2 text-center">
                <p className="text-sm text-slate-600">Enter the 6-digit code from your authenticator app.</p>
                <div className="flex justify-center pt-4">
                  <InputOTP maxLength={6} value={mfaCode} onChange={setMfaCode} disabled={loading}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || mfaCode.length !== 6}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700 mt-2"
                onClick={() => {
                  setNeedsMfa(false);
                  setMfaCode('');
                  logout(); // Sign out the partially authenticated session
                }}
              >
                Cancel and return to login
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 bg-blue-50 border-blue-200 text-slate-900 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                    <Input
                      type="tel"
                      placeholder="Your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 bg-blue-50 border-blue-200 text-slate-900 placeholder-slate-400"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-blue-50 border-blue-200 text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-blue-50 border-blue-200 text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium"
            >
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            {loading ? 'Loading...' : 'Continue with Google'}
          </Button>

          <div className="mt-6 text-center">
            <p className="text-slate-600 text-sm">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}