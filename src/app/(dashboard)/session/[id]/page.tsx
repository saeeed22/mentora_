'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/api/auth';
import { sessions, type SessionInfo } from '@/lib/api/sessions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { AgoraVideoCall } from '@/components/agora-video-call';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    const info = sessions.getSessionInfo(bookingId);
    if (!info) {
      setError('Session not found or you are not a participant.');
      setLoading(false);
      return;
    }

    setSessionInfo(info);
    setLoading(false);
  }, [bookingId, router]);

  const handleLeaveCall = () => {
    router.push('/bookings');
  };

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

  if (error || !sessionInfo) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="rounded-2xl shadow-sm max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-brand-dark mb-2">
              {error ? 'Access Denied' : 'Session Not Found'}
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'This session does not exist or was removed.'}
            </p>
            <Button
              onClick={() => router.push('/bookings')}
              className="bg-brand hover:bg-brand/90"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sessionDate = new Date(sessionInfo.booking.datetime);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/bookings')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Live Session</h1>
            <div className="flex items-center gap-3 text-gray-600 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {sessionDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {sessionDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{sessionInfo.booking.topic}</Badge>
          <Badge
            variant={sessionInfo.booking.status === 'confirmed' ? 'default' : 'secondary'}
          >
            {sessionInfo.booking.status}
          </Badge>
        </div>
      </div>

      {/* Agora Video Call */}
      <div className="rounded-2xl overflow-hidden" style={{ minHeight: '70vh' }}>
        <AgoraVideoCall
          appId={sessionInfo.appId}
          channel={sessionInfo.channel}
          token={sessionInfo.token}
          uid={sessionInfo.uid}
          userName={sessionInfo.user.name}
          userAvatar={sessionInfo.user.avatar}
          participantName={sessionInfo.participant.name}
          participantAvatar={sessionInfo.participant.avatar}
          onLeave={handleLeaveCall}
        />
      </div>
    </div>
  );
}
