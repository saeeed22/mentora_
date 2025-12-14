'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auth, CurrentUser } from '@/lib/api/auth';
import { users } from '@/lib/api/users';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    timezone: 'UTC',
    languages: [] as string[],
  });
  const [newLanguage, setNewLanguage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const currentUser = auth.getCurrentUser();
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      setUser(currentUser);
      
      // Try to fetch fresh profile from backend
      const result = await users.getCurrentProfile();
      if (result.success && result.data) {
        const { profile } = result.data;
        setFormData({
          full_name: profile.full_name || currentUser.name,
          bio: profile.bio || '',
          timezone: profile.timezone || 'UTC',
          languages: profile.languages || [],
        });
      } else {
        // Use cached data
        setFormData({
          full_name: currentUser.name,
          bio: currentUser.bio || '',
          timezone: 'UTC',
          languages: [],
        });
      }
      setIsLoading(false);
    };
    loadProfile();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    const result = await users.updateProfile({
      full_name: formData.full_name,
      bio: formData.bio,
      timezone: formData.timezone,
      languages: formData.languages,
    });
    
    if (result.success) {
      await auth.refreshCurrentUser();
      const updatedUser = auth.getCurrentUser();
      if (updatedUser) setUser(updatedUser);
      toast.success('Profile updated!');
    } else {
      toast.error(result.error || 'Failed to update profile');
    }
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploadingAvatar(true);
    const result = await users.uploadAvatar(file);
    
    if (result.success) {
      await auth.refreshCurrentUser();
      const updatedUser = auth.getCurrentUser();
      if (updatedUser) setUser(updatedUser);
      toast.success('Avatar uploaded!');
    } else {
      toast.error(result.error || 'Failed to upload avatar');
    }
    setIsUploadingAvatar(false);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        full_name: user.name,
        bio: user.bio || '',
        timezone: 'UTC',
        languages: [],
      });
    }
    setIsEditing(false);
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData({
        ...formData,
        languages: [...formData.languages, newLanguage.trim()],
      });
      setNewLanguage('');
    }
  };

  const removeLanguage = (lang: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter(l => l !== lang),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Profile</h1>
          <p className="text-gray-600 mt-1">
            Manage your profile information
          </p>
        </div>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-brand hover:bg-brand/90" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="bg-brand hover:bg-brand/90">
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Basic Info */}
        <Card className="rounded-2xl shadow-sm lg:col-span-1">
          <CardHeader className="text-center">
            <div className="relative mx-auto">
              <Avatar className="h-32 w-32 mx-auto">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-brand-light/20 text-brand text-2xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full h-10 w-10 p-0"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <div className="animate-spin h-4 w-4 border-2 border-brand rounded-full border-t-transparent" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
            </div>
            <div className="mt-4">
              {isEditing ? (
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="text-center font-semibold text-xl"
                />
              ) : (
                <CardTitle className="text-xl">{user.name}</CardTitle>
              )}
              <Badge variant="outline" className="mt-2 capitalize">
                {user.role}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email (read-only) */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Email</Label>
              <p className="text-sm text-gray-900 mt-1">{user.email}</p>
            </div>

            {/* Timezone */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Timezone</Label>
              {isEditing ? (
                <Select 
                  value={formData.timezone} 
                  onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Asia/Karachi">Pakistan (PKT)</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-900 mt-1">{formData.timezone}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Tell others about yourself
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bio */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Bio</Label>
              {isEditing ? (
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="mt-1"
                  rows={4}
                  maxLength={1000}
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">
                  {user.bio || 'No bio provided yet.'}
                </p>
              )}
            </div>

            {/* Languages */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Languages</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.languages.map((lang) => (
                  <Badge key={lang} variant="secondary" className="flex items-center space-x-1">
                    <span>{lang}</span>
                    {isEditing && (
                      <button
                        onClick={() => removeLanguage(lang)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
                {formData.languages.length === 0 && !isEditing && (
                  <p className="text-sm text-gray-500">No languages added yet.</p>
                )}
              </div>
              {isEditing && (
                <div className="flex space-x-2 mt-3">
                  <Input
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder="Add a language..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLanguage();
                      }
                    }}
                  />
                  <Button onClick={addLanguage} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="rounded-2xl shadow-sm bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Coming Soon</CardTitle>
          <CardDescription className="text-blue-700">
            Additional profile features are being added by the backend team
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <ul className="list-disc list-inside space-y-1">
            <li>Mentor-specific settings (headline, skills, pricing)</li>
            <li>Company and location info</li>
            <li>Social media links</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
