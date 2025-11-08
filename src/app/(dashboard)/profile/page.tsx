'use client';

import { useState, useEffect } from 'react';
import { Camera, MapPin, Link as LinkIcon, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockAuth, User } from '@/lib/mock-auth';
import { profile } from '@/lib/api/profile';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    title: '',
    company: '',
    location: '',
    expertise: [] as string[],
    socialLinks: {
      linkedin: '',
      twitter: '',
      portfolio: '',
    },
  });
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    const currentUser = mockAuth.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        name: currentUser.name,
        bio: currentUser.bio || '',
        title: currentUser.title || '',
        company: currentUser.company || '',
        location: currentUser.location || '',
        expertise: currentUser.expertise || [],
        socialLinks: {
          linkedin: '',
          twitter: '',
          portfolio: '',
        },
      });
    }
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleSave = () => {
    if (!user) return;
    const updated = profile.updateProfile(user.id, {
      name: formData.name,
      bio: formData.bio,
      title: formData.title,
      company: formData.company,
      location: formData.location,
      expertise: formData.expertise,
    });
    if (updated) {
      setUser(updated);
      toast.success('Profile updated');
    } else {
      toast.error('Failed to update profile');
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        bio: user.bio || '',
        title: user.title || '',
        company: user.company || '',
        location: user.location || '',
        expertise: user.expertise || [],
        socialLinks: {
          linkedin: '',
          twitter: '',
          portfolio: '',
        },
      });
    }
    setIsEditing(false);
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.expertise.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        expertise: [...formData.expertise, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      expertise: formData.expertise.filter(s => s !== skill),
    });
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">
            Manage your profile information and preferences
          </p>
        </div>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="bg-teal-600 hover:bg-teal-700">
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
                <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full h-10 w-10 p-0"
                  variant="outline"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="mt-4">
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            {/* Title */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Title</Label>
              {isEditing ? (
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">{user.title || 'Not specified'}</p>
              )}
            </div>

            {/* Company */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Company</Label>
              {isEditing ? (
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g., Google"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">{user.company || 'Not specified'}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Location</Label>
              {isEditing ? (
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA"
                />
              ) : (
                <div className="flex items-center mt-1">
                  <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-900">{user.location || 'Not specified'}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Tell others about yourself and your expertise
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
                  placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                  className="mt-1"
                  rows={4}
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">
                  {user.bio || 'No bio provided yet.'}
                </p>
              )}
            </div>

            {/* Expertise */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Expertise & Skills</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.expertise.map((skill) => (
                  <Badge key={skill} variant="secondary" className="flex items-center space-x-1">
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
                {formData.expertise.length === 0 && !isEditing && (
                  <p className="text-sm text-gray-500">No skills added yet.</p>
                )}
              </div>
              {isEditing && (
                <div className="flex space-x-2 mt-3">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
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

            {/* Social Links */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Social Links</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <Label className="text-xs text-gray-500">LinkedIn</Label>
                  {isEditing ? (
                    <Input
                      value={formData.socialLinks.linkedin}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, linkedin: e.target.value }
                      })}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  ) : (
                    <div className="flex items-center mt-1">
                      <LinkIcon className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {formData.socialLinks.linkedin || 'Not provided'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-500">Portfolio/Website</Label>
                  {isEditing ? (
                    <Input
                      value={formData.socialLinks.portfolio}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, portfolio: e.target.value }
                      })}
                      placeholder="https://yourportfolio.com"
                    />
                  ) : (
                    <div className="flex items-center mt-1">
                      <LinkIcon className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {formData.socialLinks.portfolio || 'Not provided'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Settings for Mentors */}
      {user.role === 'mentor' && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Mentor Settings</CardTitle>
            <CardDescription>
              Configure your mentoring preferences and availability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-700">Session Types</Label>
                <div className="mt-2 space-y-2">
                  {['Career Guidance', 'Resume Review', 'Interview Prep', 'Technical Discussion', 'Portfolio Review'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <input type="checkbox" id={type} className="rounded" defaultChecked />
                      <label htmlFor={type} className="text-sm text-gray-700">{type}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Availability</Label>
                <div className="mt-2 space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">Timezone</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pst">Pacific Standard Time</SelectItem>
                        <SelectItem value="mst">Mountain Standard Time</SelectItem>
                        <SelectItem value="cst">Central Standard Time</SelectItem>
                        <SelectItem value="est">Eastern Standard Time</SelectItem>
                        <SelectItem value="pkt">Pakistan Standard Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" className="w-full">
                    Manage Availability
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Completion */}
      <Card className="rounded-2xl shadow-sm bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Profile Completion</CardTitle>
          <CardDescription className="text-blue-700">
            Complete your profile to get better matches and opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-blue-900">85%</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">Good</Badge>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3 mb-4">
            <div className="bg-blue-600 h-3 rounded-full" style={{ width: '85%' }} />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
              Profile photo uploaded
            </div>
            <div className="flex items-center text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
              Bio completed
            </div>
            <div className="flex items-center text-blue-700">
              <div className="w-2 h-2 border-2 border-blue-400 rounded-full mr-3" />
              Add more skills and expertise
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
