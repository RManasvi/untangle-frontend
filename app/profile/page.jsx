'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Mail, Phone, User, Trash2, Camera, Sparkles } from 'lucide-react';
import PhotoCapture from '@/components/PhotoCapture';

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, logout, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSave = () => {
    updateUser({
      ...user,
      name: formData.name,
      phone: formData.phone,
    });
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };

  const handleDeleteAccount = () => {
    localStorage.clear();
    logout();
    router.push('/');
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="icon"
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
        </div>

        {/* Profile Card */}
        <Card className="border-slate-700 bg-slate-800/50 mb-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-6 mb-8">
              <Avatar className="h-24 w-24 bg-blue-600">
                <AvatarFallback className="text-white text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {user?.name || 'User'}
                </h2>
                <p className="text-slate-400">{user?.email}</p>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

            {/* Form - Editable Mode */}
            {isEditing && (
              <div className="space-y-4 border-t border-slate-700 pt-6">
                <div>
                  <Label htmlFor="name" className="text-slate-200">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-slate-200">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Save Changes
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-slate-600 text-slate-300 bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Display Mode */}
            {!isEditing && (
              <div className="space-y-4 border-t border-slate-700 pt-6">
                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-white">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <Phone className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-white">{user?.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <User className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Member Since</p>
                    <p className="text-white">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Biometric Calibration Section */}
        <Card className="border-indigo-100 bg-white/80 backdrop-blur-sm shadow-xl mb-8 overflow-hidden">
          <div className="h-1 w-full bg-indigo-600" />
          <CardHeader>
            <CardTitle className="text-slate-900 font-bold flex items-center gap-2">
              <Camera className="h-5 w-5 text-indigo-600" />
              Biometric Calibration
            </CardTitle>
            <p className="text-xs text-slate-500 font-medium">
              Update your facial telemetry profile to improve analysis accuracy.
            </p>
          </CardHeader>
          <CardContent className="pb-8">
            <PhotoCapture onComplete={() => alert('Biometric profile updated successfully!')} />
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-600 bg-red-900/20 mb-8">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 text-sm mb-4">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-slate-700 bg-slate-800/95">
                <AlertDialogTitle className="text-white">
                  Delete Account
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  Are you sure you want to delete your account? This action
                  cannot be undone.
                </AlertDialogDescription>
                <div className="flex gap-3 justify-end">
                  <AlertDialogCancel className="border-slate-600 text-slate-300">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
