'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Shield, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MFASettings() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Memoize it so we don't recreate the client on every single render
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    setChecking(true);
    try {
      // Check if we have a session first to avoid useless hangs
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('No active session found during MFA status check');
        setIsEnabled(false);
        setChecking(false);
        return;
      }

      // Increase timeout and add logging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('MFA status check timed out')), 10000)
      );
      
      console.log('Checking MFA factors...');
      const response = await Promise.race([
        supabase.auth.mfa.listFactors(),
        timeoutPromise
      ]);

      if (response && response.error) {
        throw response.error;
      }
      
      const data = response?.data;
      console.log('MFA factors received:', data);
      const totpFactors = data?.totp || [];
      const enabledFactor = totpFactors.find(f => f.status === 'verified');
      
      if (enabledFactor) {
        setIsEnabled(true);
        setFactorId(enabledFactor.id);
      } else {
        setIsEnabled(false);
      }
    } catch (err) {
      console.error('Error checking MFA status:', err);
      setIsEnabled(false);
    } finally {
      setChecking(false);
    }
  };

  const startEnrollment = async () => {
    setIsModalOpen(true);
    setLoading(true);
    setQrCode('');
    setTotpSecret('');
    setVerifyCode('');
    
    try {
      // 1. Check for existing factors (verified or unverified)
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      // 2. Clear out ANY existing TOTP factors to ensure a clean enrollment
      // This prevents the "factor already exists" error
      const existingTotpFactors = factors.totp || [];
      for (const factor of existingTotpFactors) {
        console.log('Clearing existing factor before re-enrollment:', factor.id);
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      // 3. Start fresh enrollment
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });
      if (error) throw error;
      
      setFactorId(data.id);
      // Use the URI for the QR code generator, NOT the pre-generated SVG string
      setQrCode(data.totp.uri); 
      setTotpSecret(data.totp.secret);
    } catch (err) {
      console.error('MFA Enrollment error:', err);
      toast.error(err.message || 'Failed to start MFA enrollment');
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) return;
    setLoading(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode,
      });

      if (verify.error) throw verify.error;

      toast.success('Two-Factor Authentication successfully enabled!');
      setIsEnabled(true);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (confirm('Are you sure you want to disable Two-Factor Authentication? This will reduce your account security.')) {
      setLoading(true);
      try {
        const { error } = await supabase.auth.mfa.unenroll({ factorId });
        if (error) throw error;
        toast.success('Two-Factor Authentication disabled');
        setIsEnabled(false);
        setFactorId('');
      } catch (err) {
        toast.error(err.message || 'Failed to disable MFA');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="w-full">
      <Button
        variant="outline"
        onClick={() => {
          if (isEnabled) handleDisable();
          else startEnrollment();
        }}
        disabled={checking || loading}
        className="w-full border-blue-200 dark:border-gray-600 text-slate-700 dark:text-slate-300 h-auto py-3 justify-start bg-transparent"
      >
        <div className="flex items-center w-full">
          {isEnabled ? (
            <ShieldCheck className="h-4 w-4 mr-3 text-green-500" />
          ) : (
            <ShieldAlert className="h-4 w-4 mr-3 text-yellow-500" />
          )}
          <div className="text-left flex-1">
            <div className="font-medium flex items-center justify-between">
              Two-Factor Authentication
              <span className={`text-xs px-2 py-0.5 rounded-full ${isEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                {checking ? 'Checking...' : isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-500 mt-1">
              Add extra security to your account
            </div>
          </div>
        </div>
      </Button>

      <Dialog open={isModalOpen} onOpenChange={(open) => !loading && setIsModalOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code below with an authenticator app like Google Authenticator or Microsoft Authenticator.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-4 space-y-6">
            {qrCode ? (
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <QRCodeSVG value={qrCode} size={200} />
              </div>
            ) : (
              <div className="h-[200px] w-[200px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            )}
            
            {totpSecret && (
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Can&apos;t scan? Use this secret key:
                </p>
                <code className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-sm tracking-widest break-all">
                  {totpSecret}
                </code>
              </div>
            )}

            <div className="space-y-3 w-full max-w-[200px] mx-auto">
              <label className="text-sm font-medium text-center block text-slate-700 dark:text-slate-300">
                Enter 6-digit code
              </label>
              <div className="flex justify-center">
                <InputOTP 
                  maxLength={6} 
                  value={verifyCode} 
                  onChange={setVerifyCode}
                  disabled={loading}
                >
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
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVerify} 
              disabled={verifyCode.length !== 6 || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
