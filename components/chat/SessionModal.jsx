'use client';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, RefreshCw, LogOut } from 'lucide-react';

export default function SessionModal({
  open,
  onClose,
  userTurns,
  onContinue,
  onEndSession,
}) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="border-slate-700 bg-slate-800/95 max-w-md">
        <AlertDialogTitle className="text-white flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-400" />
          Session Summary
        </AlertDialogTitle>

        <AlertDialogDescription className="space-y-4">
          <div className="bg-slate-700/50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">User Turns:</span>
              <span className="text-white font-semibold">{userTurns}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Session Duration:</span>
              <span className="text-white font-semibold">
                ~{Math.floor(userTurns * 0.5)} min
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Wellness Score:</span>
              <span className="text-green-400 font-semibold">+{userTurns}%</span>
            </div>
          </div>

          <p className="text-slate-400 text-sm">
            Great job! You've had a productive conversation with your AI
            companion. Would you like to continue chatting or end your session?
          </p>
        </AlertDialogDescription>

        <div className="flex gap-3 justify-end pt-4">
          <AlertDialogCancel
            onClick={onContinue}
            className="border-slate-600 text-slate-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Continue Chatting
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onEndSession}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            End Session
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
