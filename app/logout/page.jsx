'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, SmilePlus, Archive } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [selectedOption, setSelectedOption] = useState('support');
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    // Simulate saving session data
    setTimeout(() => {
      // Store session summary
      localStorage.setItem(
        'lastSessionSummary',
        JSON.stringify({
          timestamp: new Date(),
          selectedExitOption: selectedOption,
        })
      );

      // Clear sensitive data
      logout();
      router.push('/');
    }, 500);
  };

  const options = [
    {
      id: 'support',
      title: 'Support Meditation or Activity',
      desc: 'Get guidance on meditation, breathing exercises, or wellness activities',
      icon: <SmilePlus className="h-6 w-6" />,
    },
    {
      id: 'archive',
      title: 'Archive Current Conversation',
      desc: 'Save this conversation for future reference',
      icon: <Archive className="h-6 w-6" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-white">
              Great Job Today!
            </CardTitle>
            <p className="text-slate-400 text-sm mt-2">
              Before you go, would you like any final support?
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Options */}
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              <div className="space-y-3">
                {options.map((option) => (
                  <div
                    key={option.id}
                    className="relative flex items-start space-x-3 p-4 border border-slate-600 rounded-lg hover:border-blue-500 hover:bg-slate-700/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedOption(option.id)}
                  >
                    <RadioGroupItem
                      value={option.id}
                      id={option.id}
                      className="mt-1"
                    />
                    <Label
                      htmlFor={option.id}
                      className="cursor-pointer flex-1"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-blue-400">{option.icon}</div>
                        <div>
                          <div className="font-medium text-white">
                            {option.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {option.desc}
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            {/* Session Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-700/30 rounded-lg">
              <div className="text-center">
                <p className="text-slate-400 text-xs">Emotion State</p>
                <p className="text-white font-semibold text-lg">Calm</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-xs">Session Value</p>
                <p className="text-green-400 font-semibold text-lg">+50%</p>
              </div>
            </div>

            {/* Final Message */}
            <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-600/30">
              <p className="text-blue-200 text-sm">
                Your well-being is important to us. Feel free to return whenever
                you need support. Take care!
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => router.push('/chat')}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300"
              >
                Continue Chatting
              </Button>
              <Button
                onClick={handleLogout}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Logging out...' : 'Exit & Logout'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
