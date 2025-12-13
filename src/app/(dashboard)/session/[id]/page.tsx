'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/api/auth';
import { bookings } from '@/lib/api/bookings';
import { mentors } from '@/lib/api/mentors';
import { mockUsers } from '@/lib/mock-auth';
import type { Booking } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notAllowed, setNotAllowed] = useState(false);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    const b = bookings.getById(bookingId);
    if (!b) {
      setLoading(false);
      setBooking(null);
      return;
    }

    const isParticipant = currentUser.id === b.mentorId || currentUser.id === b.menteeId;
    if (!isParticipant) {
      setNotAllowed(true);
      setLoading(false);
      return;
    }

    setBooking(b);
    setLoading(false);
  }, [bookingId, router]);

  const currentUser = auth.getCurrentUser();

  const otherParty = useMemo(() => {
    if (!booking || !currentUser) return null;
    const isMentor = currentUser.id === booking.mentorId;
    if (isMentor) {
      return mockUsers.find(u => u.id === booking.menteeId) || null;
    }
    return mentors.getById(booking.mentorId) || null;
  }, [booking, currentUser]);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-gray-600">Preparing your session...</p>
        </div>
      </div>
    );
  }

  if (notAllowed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="rounded-2xl shadow-sm max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-brand-dark mb-2">Access denied</h2>
            <p className="text-gray-600 mb-6">You are not a participant in this session.</p>
            <Button onClick={() => router.push('/bookings')} className="bg-brand hover:bg-brand/90">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="rounded-2xl shadow-sm max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-brand-dark mb-2">Session not found</h2>
            <p className="text-gray-600 mb-6">This session does not exist or was removed.</p>
            <Button onClick={() => router.push('/bookings')} className="bg-brand hover:bg-brand/90">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build Jitsi URL with config to disable lobby and enable direct join
  const roomName = `mentora-${booking.id}`;
  const jitsiConfig = [
    'config.prejoinPageEnabled=false',
    'config.startWithAudioMuted=true',
    'config.startWithVideoMuted=false',
    'config.disableModeratorIndicator=true',
    'config.enableLobbyChat=false',
  ].join('&');
  const joinUrl = booking.videoCallLink || `https://meet.jit.si/${roomName}#${jitsiConfig}`;
  const sessionDate = new Date(booking.datetime);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/bookings')}> 
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Live Session</h1>
            <p className="text-gray-600 text-sm">
              {sessionDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • {sessionDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(joinUrl, '_blank')}> 
            <ExternalLink className="w-4 h-4 mr-2" /> Open in new tab
          </Button>
        </div>
      </div>

      {/* Session Info */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParty && 'avatar' in otherParty ? otherParty.avatar : undefined} alt={otherParty?.name || 'Participant'} />
              <AvatarFallback className="bg-brand-light/20 text-brand">{otherParty?.name ? getInitials(otherParty.name) : '?'}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm text-gray-600">Session with</p>
              <p className="font-medium text-gray-900 truncate">{otherParty?.name || 'Participant'}</p>
            </div>
            <div className="ml-auto">
              <Badge variant="outline">{booking.sessionType}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jitsi IFrame */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black">
        <iframe
          src={joinUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full"
          style={{ height: '70vh' }}
        />
      </div>
    </div>
  );
}


