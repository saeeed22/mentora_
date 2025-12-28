'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Plus, X, Briefcase, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { auth, CurrentUser } from '@/lib/api/auth';
import { users } from '@/lib/api/users';
import { mentorManagementApi, MentorProfileResponse } from '@/lib/api/mentor-management-api';
import { toast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form data
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    timezone: 'UTC',
    languages: [] as string[],
  });
  const [newLanguage, setNewLanguage] = useState('');

  // Mentor-specific data
  const [mentorProfile, setMentorProfile] = useState<MentorProfileResponse | null>(null);
  const [mentorFormData, setMentorFormData] = useState({
    headline: '',
    current_role: '',
    current_company: '',
    employment_status: 'employed' as 'employed' | 'self_employed' | 'business_owner' | 'freelancer' | 'retired',
    mentoring_niche: 'other',
    experience_years: 0,
    skills: [] as string[],
    price_per_session_solo: 0,
    group_pricing: {
      2: 0,
      3: 0,
      5: 0,
      10: 0,
    },
    visible: true,
  });
  const [newSkill, setNewSkill] = useState('');

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

      // If mentor, load mentor profile from /v1/mentors/{user_id}
      if (currentUser.role === 'mentor') {
        const { mentorsApi } = await import('@/lib/api/mentors-api');
        const mentorResult = await mentorsApi.getMentorById(currentUser.id);
        if (mentorResult.success && mentorResult.data) {
          const mp = mentorResult.data.mentor_profile;
          // Update form data with fetched mentor profile
          setMentorFormData({
            headline: mp?.headline || '',
            current_role: mp?.current_role || '',
            current_company: mp?.current_company || '',
            employment_status: mp?.employment_status || 'employed',
            mentoring_niche: mp?.mentoring_niche || 'other',
            experience_years: mp?.experience_years || 0,
            skills: mp?.skills || [],
            price_per_session_solo: mp?.price_per_session_solo || 0,
            group_pricing: {
              2: mp?.group_pricing?.[2] || 0,
              3: mp?.group_pricing?.[3] || 0,
              5: mp?.group_pricing?.[5] || 0,
              10: mp?.group_pricing?.[10] || 0,
            },
            visible: mp?.visible ?? true,
          });
        } else {
          // Set defaults if mentor profile not found
          setMentorFormData({
            headline: '',
            current_role: '',
            current_company: '',
            employment_status: 'employed',
            mentoring_niche: 'other',
            experience_years: 0,
            skills: [],
            price_per_session_solo: 0,
            group_pricing: {
              2: 0,
              3: 0,
              5: 0,
              10: 0,
            },
            visible: true,
          });
        }
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

    try {
      // Update general profile
      const result = await users.updateProfile({
        full_name: formData.full_name,
        bio: formData.bio,
        timezone: formData.timezone,
        languages: formData.languages,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to update profile');
        setIsSaving(false);
        return;
      }

      // If mentor, update mentor profile too
      if (user.role === 'mentor') {
        const mentorResult = await mentorManagementApi.updateMentorProfile({
          headline: mentorFormData.headline || null,
          current_role: mentorFormData.current_role || null,
          current_company: mentorFormData.current_company || null,
          employment_status: mentorFormData.employment_status,
          mentoring_niche: mentorFormData.mentoring_niche,
          experience_years: mentorFormData.experience_years,
          skills: mentorFormData.skills,
          price_per_session_solo: mentorFormData.price_per_session_solo || null,
          group_pricing: mentorFormData.group_pricing,
          visible: mentorFormData.visible,
        });

        if (!mentorResult.success) {
          toast.error(mentorResult.error || 'Failed to update mentor profile');
          setIsSaving(false);
          return;
        }

        if (mentorResult.data) {
          setMentorProfile(mentorResult.data);
        }
      }

      await auth.refreshCurrentUser();
      const updatedUser = auth.getCurrentUser();
      if (updatedUser) setUser(updatedUser);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('An unexpected error occurred while saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await users.uploadAvatar(file);

      if (result.success) {
        await auth.refreshCurrentUser();
        const updatedUser = auth.getCurrentUser();
        if (updatedUser) setUser(updatedUser);
        toast.success('Avatar uploaded successfully!');
      } else {
        toast.error(result.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('An error occurred while uploading avatar');
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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

  const addSkill = () => {
    if (newSkill.trim() && !mentorFormData.skills.includes(newSkill.trim())) {
      setMentorFormData({
        ...mentorFormData,
        skills: [...mentorFormData.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setMentorFormData({
      ...mentorFormData,
      skills: mentorFormData.skills.filter(s => s !== skill),
    });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await users.deleteAccount();
      
      if (result.success) {
        toast.success('Account deleted successfully');
        auth.logout();
        router.push('/');
      } else {
        toast.error(result.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('An error occurred while deleting account');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!user) return null;

  const isMentor = user.role === 'mentor';

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

      {/* Mentor-Specific Settings */}
      {isMentor && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Mentor Profile
            </CardTitle>
            <CardDescription>
              Configure your mentor settings, skills, and pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Headline */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Professional Headline</Label>
              {isEditing ? (
                <Input
                  value={mentorFormData.headline}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, headline: e.target.value })}
                  placeholder="e.g., Senior Software Engineer at Google"
                  className="mt-1"
                  maxLength={200}
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">
                  {mentorFormData.headline || mentorProfile?.headline || 'No headline set.'}
                </p>
              )}
            </div>

            {/* Current Role */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Current Role</Label>
              {isEditing ? (
                <Input
                  value={mentorFormData.current_role}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, current_role: e.target.value })}
                  placeholder="Senior Backend Engineer"
                  className="mt-1"
                  maxLength={100}
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">
                  {mentorFormData.current_role || mentorProfile?.current_role || 'Not specified'}
                </p>
              )}
            </div>

            {/* Current Company */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Current Company</Label>
              {isEditing ? (
                <Input
                  value={mentorFormData.current_company}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, current_company: e.target.value })}
                  placeholder="Google, Startup XYZ, etc."
                  className="mt-1"
                  maxLength={150}
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">
                  {mentorFormData.current_company || mentorProfile?.current_company || 'Not specified'}
                </p>
              )}
            </div>

            {/* Employment Status */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Employment Status</Label>
              {isEditing ? (
                <Select
                  value={mentorFormData.employment_status}
                  onValueChange={(value: any) => setMentorFormData({ ...mentorFormData, employment_status: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employee</SelectItem>
                    <SelectItem value="self_employed">Self-Employed / Freelancer</SelectItem>
                    <SelectItem value="business_owner">Business Owner / Startup Founder</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-900 mt-1 capitalize">
                  {mentorFormData.employment_status === 'employed' && 'Employee'}
                  {mentorFormData.employment_status === 'self_employed' && 'Self-Employed / Freelancer'}
                  {mentorFormData.employment_status === 'business_owner' && 'Business Owner / Startup Founder'}
                  {mentorFormData.employment_status === 'freelancer' && 'Freelancer'}
                  {mentorFormData.employment_status === 'retired' && 'Retired'}
                </p>
              )}
            </div>

            {/* Mentoring Niche */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Mentoring Niche</Label>
              {isEditing ? (
                <Select
                  value={mentorFormData.mentoring_niche}
                  onValueChange={(value) => setMentorFormData({ ...mentorFormData, mentoring_niche: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your niche" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backend">Backend Development</SelectItem>
                    <SelectItem value="frontend">Frontend Development</SelectItem>
                    <SelectItem value="fullstack">Full Stack Development</SelectItem>
                    <SelectItem value="devops">DevOps</SelectItem>
                    <SelectItem value="mobile">Mobile Development</SelectItem>
                    <SelectItem value="data_science">Data Science</SelectItem>
                    <SelectItem value="machine_learning">Machine Learning</SelectItem>
                    <SelectItem value="cloud">Cloud Computing</SelectItem>
                    <SelectItem value="ai_llm">AI & LLM</SelectItem>
                    <SelectItem value="blockchain">Blockchain</SelectItem>
                    <SelectItem value="product">Product Management</SelectItem>
                    <SelectItem value="design">Design (UI/UX)</SelectItem>
                    <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-900 mt-1 capitalize">
                  {mentorFormData.mentoring_niche.replace(/_/g, ' ')}
                </p>
              )}
            </div>

            {/* Experience Years */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Years of Experience</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={mentorFormData.experience_years}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, experience_years: parseInt(e.target.value) || 0 })}
                  className="mt-1 w-32"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">
                  {mentorFormData.experience_years || mentorProfile?.experience_years || 0} years
                </p>
              )}
            </div>

            {/* Skills */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Skills & Expertise</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {mentorFormData.skills.map((skill) => (
                  <Badge key={skill} className="flex items-center space-x-1 bg-brand/10 text-brand">
                    <span>{skill}</span>
                    {isEditing && (
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
                {mentorFormData.skills.length === 0 && !isEditing && (
                  <p className="text-sm text-gray-500">No skills added yet.</p>
                )}
              </div>
              {isEditing && (
                <div className="flex space-x-2 mt-3">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill (e.g., Python, Machine Learning)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button onClick={addSkill} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Price per Session - Solo */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Price per Session - Solo (PKR)</Label>
              {isEditing ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={mentorFormData.price_per_session_solo}
                    onChange={(e) => setMentorFormData({ ...mentorFormData, price_per_session_solo: parseFloat(e.target.value) || 0 })}
                    className="w-40"
                  />
                  <span className="text-sm text-gray-500">PKR/session</span>
                </div>
              ) : (
                <p className="text-sm text-gray-900 mt-1">
                  {mentorFormData.price_per_session_solo || mentorProfile?.price_per_session_solo || 0} PKR/session
                </p>
              )}
            </div>

            {/* Group Pricing - Tiered */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3">Group Session Pricing (Total Price per Session)</Label>
              <div className="space-y-3">
                {/* Group of 2 */}
                <div>
                  <Label className="text-sm text-gray-600">Group of 2 Mentees</Label>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min={0}
                        step={100}
                        value={mentorFormData.group_pricing[2]}
                        onChange={(e) => setMentorFormData({ 
                          ...mentorFormData, 
                          group_pricing: { ...mentorFormData.group_pricing, 2: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-40"
                      />
                      <span className="text-sm text-gray-500">PKR total</span>
                      {mentorFormData.group_pricing[2] > 0 && (
                        <span className="text-xs text-gray-400">({(mentorFormData.group_pricing[2] / 2).toFixed(0)} PKR per person)</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">
                      {mentorFormData.group_pricing[2] || 0} PKR total
                      {mentorFormData.group_pricing[2] > 0 && ` (${(mentorFormData.group_pricing[2] / 2).toFixed(0)} PKR per person)`}
                    </p>
                  )}
                </div>

                {/* Group of 3 */}
                <div>
                  <Label className="text-sm text-gray-600">Group of 3 Mentees</Label>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min={0}
                        step={100}
                        value={mentorFormData.group_pricing[3]}
                        onChange={(e) => setMentorFormData({ 
                          ...mentorFormData, 
                          group_pricing: { ...mentorFormData.group_pricing, 3: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-40"
                      />
                      <span className="text-sm text-gray-500">PKR total</span>
                      {mentorFormData.group_pricing[3] > 0 && (
                        <span className="text-xs text-gray-400">({(mentorFormData.group_pricing[3] / 3).toFixed(0)} PKR per person)</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">
                      {mentorFormData.group_pricing[3] || 0} PKR total
                      {mentorFormData.group_pricing[3] > 0 && ` (${(mentorFormData.group_pricing[3] / 3).toFixed(0)} PKR per person)`}
                    </p>
                  )}
                </div>

                {/* Group of 5 */}
                <div>
                  <Label className="text-sm text-gray-600">Group of 5 Mentees</Label>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min={0}
                        step={100}
                        value={mentorFormData.group_pricing[5]}
                        onChange={(e) => setMentorFormData({ 
                          ...mentorFormData, 
                          group_pricing: { ...mentorFormData.group_pricing, 5: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-40"
                      />
                      <span className="text-sm text-gray-500">PKR total</span>
                      {mentorFormData.group_pricing[5] > 0 && (
                        <span className="text-xs text-gray-400">({(mentorFormData.group_pricing[5] / 5).toFixed(0)} PKR per person)</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">
                      {mentorFormData.group_pricing[5] || 0} PKR total
                      {mentorFormData.group_pricing[5] > 0 && ` (${(mentorFormData.group_pricing[5] / 5).toFixed(0)} PKR per person)`}
                    </p>
                  )}
                </div>

                {/* Group of 10 */}
                <div>
                  <Label className="text-sm text-gray-600">Group of 10 Mentees</Label>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min={0}
                        step={100}
                        value={mentorFormData.group_pricing[10]}
                        onChange={(e) => setMentorFormData({ 
                          ...mentorFormData, 
                          group_pricing: { ...mentorFormData.group_pricing, 10: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-40"
                      />
                      <span className="text-sm text-gray-500">PKR total</span>
                      {mentorFormData.group_pricing[10] > 0 && (
                        <span className="text-xs text-gray-400">({(mentorFormData.group_pricing[10] / 10).toFixed(0)} PKR per person)</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">
                      {mentorFormData.group_pricing[10] || 0} PKR total
                      {mentorFormData.group_pricing[10] > 0 && ` (${(mentorFormData.group_pricing[10] / 10).toFixed(0)} PKR per person)`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-700">Profile Visible</Label>
                <p className="text-sm text-gray-500">Allow mentees to find and book you</p>
              </div>
              {isEditing ? (
                <Switch
                  checked={mentorFormData.visible}
                  onCheckedChange={(checked) => setMentorFormData({ ...mentorFormData, visible: checked })}
                />
              ) : (
                <Badge variant={mentorFormData.visible ? 'default' : 'secondary'}>
                  {mentorFormData.visible ? 'Visible' : 'Hidden'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card for mentees */}
      {!isMentor && (
        <Card className="rounded-2xl shadow-sm bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Want to become a Mentor?</CardTitle>
            <CardDescription className="text-blue-700">
              Share your expertise and help others grow
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-blue-700">
            <p>Contact the admin team to upgrade your account to a mentor role.</p>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone - Delete Account */}
      <Card className="rounded-2xl shadow-sm border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800 mb-2">
              <strong>Warning:</strong> This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </p>
            <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
              <li>All your profile information will be deleted</li>
              <li>All your bookings and sessions will be cancelled</li>
              <li>All your messages will be removed</li>
              {isMentor && <li>Your mentor profile will be permanently removed</li>}
            </ul>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete My Account'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  <div>
                    <p className="mb-2">
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers including:
                    </p>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li>Profile information</li>
                      <li>All bookings and sessions</li>
                      <li>All messages and conversations</li>
                      {isMentor && <li>Your mentor profile and ratings</li>}
                    </ul>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, Delete My Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
