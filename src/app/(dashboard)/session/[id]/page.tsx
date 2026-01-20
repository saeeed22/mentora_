// 'use client';

// import { useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { auth } from '@/lib/api/auth';
// import { bookingsApi, BookingResponse, VideoTokenResponse } from '@/lib/api/bookings-api';
// import { users } from '@/lib/api/users';
// import { Card, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { ArrowLeft, Clock, Calendar, Loader2 } from 'lucide-react';
// import { AgoraVideoCall } from '@/components/agora-video-call';

// // Session info for the video call
// interface SessionInfo {
//   appId: string;
//   channel: string;
//   token: string;
//   uid: number;
//   booking: BookingResponse;
//   userName: string;
//   userAvatar?: string;
//   participantName: string;
//   participantAvatar?: string;
// }

// // Agora App ID - in production, this should come from env or backend
// const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

// export default function SessionPage() {
//   const params = useParams();
//   const router = useRouter();
//   const bookingId = params.id as string;

//   const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const loadSessionData = async () => {
//       const currentUser = auth.getCurrentUser();
//       if (!currentUser) {
//         router.push('/login');
//         return;
//       }

//       try {
//         // 1. Fetch booking details
//         const bookingResult = await bookingsApi.getBookingById(bookingId);
//         if (!bookingResult.success || !bookingResult.data) {
//           setError('Booking not found.');
//           setLoading(false);
//           return;
//         }

//         const booking = bookingResult.data;

//         // Check if user is a participant
//         const isParticipant = currentUser.id === booking.mentor_id || currentUser.id === booking.mentee_id;
//         if (!isParticipant) {
//           setError('You are not a participant in this session.');
//           setLoading(false);
//           return;
//         }

//         // Check if booking is confirmed - Only confirmed sessions can be joined
//         if (booking.status !== 'confirmed') {
//           let errorMessage = '';

//           if (booking.status === 'pending') {
//             const isMentor = currentUser.id === booking.mentor_id;
//             errorMessage = isMentor
//               ? 'This booking is pending your confirmation. Please confirm the booking from the Bookings page before joining.'
//               : 'This session is pending mentor confirmation. You will be able to join once the mentor confirms the booking.';
//           } else if (booking.status === 'cancelled') {
//             errorMessage = 'This session has been cancelled and cannot be joined.';
//           } else if (booking.status === 'completed') {
//             errorMessage = 'This session has already been completed.';
//           } else if (booking.status === 'expired') {
//             errorMessage = 'This session has expired and can no longer be joined.';
//           } else {
//             errorMessage = `This session is ${booking.status}. Only confirmed sessions can be joined.`;
//           }

//           setError(errorMessage);
//           setLoading(false);
//           return;
//         }

//         // 2. Fetch video token from backend
//         console.log('[Video Session] Fetching video token for booking:', bookingId);
//         const tokenResult = await bookingsApi.getVideoToken(bookingId);
//         if (!tokenResult.success || !tokenResult.data) {
//           console.error('[Video Session] Failed to get video token:', !tokenResult.success ? tokenResult.error : 'No data returned');
//           setError('Failed to get video token. Please try again.');
//           setLoading(false);
//           return;
//         }

//         const videoToken = tokenResult.data;
//         console.log('[Video Session] Video token received:', {
//           room_id: videoToken.room_id,
//           provider: videoToken.provider,
//           expires_at: videoToken.expires_at
//         });

//         // 3. Get participant info
//         const isMentor = currentUser.id === booking.mentor_id;
//         const participantId = isMentor ? booking.mentee_id : booking.mentor_id;

//         let participantName = 'Participant';
//         let participantAvatar: string | undefined;

//         try {
//           const participantResult = await users.getUserById(participantId);
//           if (participantResult.success && participantResult.data) {
//             participantName = participantResult.data.email.split('@')[0];
//           }
//         } catch {
//           // Use default name
//         }

//         // 4. Use UID 0 (null) so Agora auto-assigns unique UIDs
//         // The backend generates tokens for UID 0 (wildcard), which means 
//         // clients must join with UID 0/null to let Agora assign unique IDs
//         const userUid = 0; // Agora will auto-assign a unique UID
//         console.log('[Video Session] Using UID 0 (auto-assign) for user:', currentUser.id);

//         // 5. Start video session on backend
//         await bookingsApi.startVideoSession(bookingId);

//         // 6. Set session info
//         console.log('[Video Session] Joining channel:', videoToken.room_id, 'with UID:', userUid);
//         setSessionInfo({
//           appId: AGORA_APP_ID,
//           channel: videoToken.room_id,
//           token: videoToken.rtc_token,
//           uid: userUid,
//           booking,
//           userName: currentUser.name,
//           userAvatar: currentUser.avatar,
//           participantName,
//           participantAvatar,
//         });

//         setLoading(false);
//       } catch (err) {
//         console.error('Error loading session:', err);
//         setError('Failed to load session. Please try again.');
//         setLoading(false);
//       }
//     };

//     loadSessionData();
//   }, [bookingId, router]);

//   const handleLeaveCall = async () => {
//     // End video session on backend
//     if (sessionInfo) {
//       await bookingsApi.endVideoSession(bookingId);
//     }
//     router.push('/bookings');
//   };

//   if (loading) {
//     return (
//       <div className="min-h-[60vh] flex items-center justify-center">
//         <div className="text-center">
//           <Loader2 className="h-12 w-12 animate-spin text-brand mx-auto" />
//           <p className="mt-4 text-gray-600">Preparing your session...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error || !sessionInfo) {
//     return (
//       <div className="min-h-[60vh] flex items-center justify-center">
//         <Card className="rounded-2xl shadow-sm max-w-lg w-full">
//           <CardContent className="p-8 text-center">
//             <h2 className="text-2xl font-bold text-brand-dark mb-2">
//               {error ? 'Cannot Join Session' : 'Session Not Found'}
//             </h2>
//             <p className="text-gray-600 mb-6">
//               {error || 'This session does not exist or was removed.'}
//             </p>
//             <Button
//               onClick={() => router.push('/bookings')}
//               className="bg-brand hover:bg-brand/90"
//             >
//               <ArrowLeft className="w-4 h-4 mr-2" /> Back to bookings
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   const sessionDate = new Date(sessionInfo.booking.start_at);

//   return (
//     <div className="space-y-4">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div className="flex items-center gap-4">
//           <Button variant="outline" onClick={() => router.push('/bookings')}>
//             <ArrowLeft className="w-4 h-4 mr-2" /> Back
//           </Button>
//           <div>
//             <h1 className="text-2xl font-bold text-brand-dark">Live Session</h1>
//             <div className="flex items-center gap-3 text-gray-600 text-sm">
//               <span className="flex items-center gap-1">
//                 <Calendar className="w-4 h-4" />
//                 {sessionDate.toLocaleDateString('en-US', {
//                   weekday: 'long',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </span>
//               <span className="flex items-center gap-1">
//                 <Clock className="w-4 h-4" />
//                 {sessionDate.toLocaleTimeString('en-US', {
//                   hour: 'numeric',
//                   minute: '2-digit',
//                 })}
//               </span>
//             </div>
//           </div>
//         </div>
//         <div className="flex items-center gap-2">
//           <Badge variant="outline">{sessionInfo.booking.duration_minutes} min</Badge>
//           <Badge variant="default">
//             {sessionInfo.booking.status}
//           </Badge>
//         </div>
//       </div>

//       {/* Agora App ID Warning */}
//       {!AGORA_APP_ID && (
//         <div className="bg-yellow-100 text-yellow-800 px-4 py-3 rounded-lg text-sm">
//           <strong>Warning:</strong> Agora App ID is not configured. Set <code>NEXT_PUBLIC_AGORA_APP_ID</code> in your environment variables.
//         </div>
//       )}

//       {/* Agora Video Call */}
//       <div className="rounded-2xl overflow-hidden" style={{ minHeight: '70dvh' }}>
//         <AgoraVideoCall
//           appId={sessionInfo.appId}
//           channel={sessionInfo.channel}
//           token={sessionInfo.token}
//           uid={sessionInfo.uid}
//           userName={sessionInfo.userName}
//           userAvatar={sessionInfo.userAvatar}
//           participantName={sessionInfo.participantName}
//           participantAvatar={sessionInfo.participantAvatar}
//           onLeave={handleLeaveCall}
//         />
//       </div>
//     </div>
//   );
// }








// 'use client';

// import { useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { auth } from '@/lib/api/auth';
// import { bookingsApi, BookingResponse } from '@/lib/api/bookings-api';
// import { users } from '@/lib/api/users';
// import { Card, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { ArrowLeft, Clock, Calendar, Loader2 } from 'lucide-react';
// import { AgoraVideoCall } from '@/components/agora-video-call';

// interface SessionInfo {
//   appId: string;
//   channel: string;
//   token: string;
//   uid: number;
//   booking: BookingResponse;
//   userName: string;
//   userAvatar?: string;
//   participantName: string;
//   participantAvatar?: string;
// }

// const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

// export default function SessionPage() {
//   const params = useParams();
//   const router = useRouter();
//   const bookingId = params.id as string;

//   const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const loadSessionData = async () => {
//       const currentUser = auth.getCurrentUser();
//       if (!currentUser) {
//         router.push('/login');
//         return;
//       }

//       try {
//         // 1) Fetch booking details
//         const bookingResult = await bookingsApi.getBookingById(bookingId);
//         if (!bookingResult.success || !bookingResult.data) {
//           setError('Booking not found.');
//           setLoading(false);
//           return;
//         }
//         const booking = bookingResult.data;

//         // 2) Ensure current user is a participant
//         const isParticipant =
//           currentUser.id === booking.mentor_id || currentUser.id === booking.mentee_id;
//         if (!isParticipant) {
//           setError('You are not a participant in this session.');
//           setLoading(false);
//           return;
//         }

//         // 3) Ensure booking is confirmed
//         if (booking.status !== 'confirmed') {
//           let msg = '';
//           if (booking.status === 'pending') {
//             const isMentor = currentUser.id === booking.mentor_id;
//             msg = isMentor
//               ? 'This booking is pending your confirmation. Please confirm the booking from the Bookings page before joining.'
//               : 'This session is pending mentor confirmation. You will be able to join once the mentor confirms the booking.';
//           } else if (booking.status === 'cancelled') {
//             msg = 'This session has been cancelled and cannot be joined.';
//           } else if (booking.status === 'completed') {
//             msg = 'This session has already been completed.';
//           } else if (booking.status === 'expired') {
//             msg = 'This session has expired and can no longer be joined.';
//           } else {
//             msg = `This session is ${booking.status}. Only confirmed sessions can be joined.`;
//           }
//           setError(msg);
//           setLoading(false);
//           return;
//         }

//         // 4) Fetch backend video token (provides stable room_id)
//         const tokenResult = await bookingsApi.getVideoToken(bookingId);
//         if (!tokenResult.success || !tokenResult.data) {
//           setError('Failed to get video token. Please try again.');
//           setLoading(false);
//           return;
//         }
//         const videoToken = tokenResult.data; // { provider, room_id, rtc_token, expires_at }

//         // 5) Participant info
//         const isMentor = currentUser.id === booking.mentor_id;
//         const participantId = isMentor ? booking.mentee_id : booking.mentor_id;

//         let participantName = 'Participant';
//         let participantAvatar: string | undefined;
//         try {
//           const participantResult = await users.getUserById(participantId);
//           if (participantResult.success && participantResult.data) {
//             participantName = participantResult.data.email.split('@')[0];
//           }
//         } catch {
//           // ignore
//         }

//         // 6) Use UID 0 so Agora auto-assigns unique UIDs
//         // UID 0 tells Agora to assign a unique UID to this client
//         // This works when the backend generates tokens for UID 0 (wildcard)
//         const userUid = 0;

//         // 7) Optional: notify backend session start
//         try {
//           await bookingsApi.startVideoSession(bookingId);
//         } catch {
//           // non-blocking
//         }

//         // 8) Set session info for AgoraVideoCall
//         setSessionInfo({
//           appId: AGORA_APP_ID,               // use env App ID (backend currently doesn't return it)
//           channel: videoToken.room_id,       // stable room id from backend (booking_<id>)
//           token: videoToken.rtc_token,       // rtc token from backend
//           uid: userUid,                      // UID aligned with backend token logic
//           booking,
//           userName: currentUser.name,
//           userAvatar: currentUser.avatar,
//           participantName,
//           participantAvatar,
//         });

//         setLoading(false);
//       } catch (err) {
//         console.error('Error loading session:', err);
//         setError('Failed to load session. Please try again.');
//         setLoading(false);
//       }
//     };

//     loadSessionData();
//   }, [bookingId, router]);

//   const handleLeaveCall = async () => {
//     if (sessionInfo) {
//       try {
//         await bookingsApi.endVideoSession(bookingId);
//       } catch {
//         // non-blocking
//       }
//     }
//     router.push('/bookings');
//   };

//   if (loading) {
//     return (
//       <div className="min-h-[60vh] flex items-center justify-center">
//         <div className="text-center">
//           <Loader2 className="h-12 w-12 animate-spin text-brand mx-auto" />
//         </div>
//       </div>
//     );
//   }

//   if (error || !sessionInfo) {
//     return (
//       <div className="min-h-[60vh] flex items-center justify-center">
//         <Card className="rounded-2xl shadow-sm max-w-lg w-full">
//           <CardContent className="p-8 text-center">
//             <h2 className="text-2xl font-bold text-brand-dark mb-2">
//               {error ? 'Cannot Join Session' : 'Session Not Found'}
//             </h2>
//             <p className="text-gray-600 mb-6">
//               {error || 'This session does not exist or was removed.'}
//             </p>
//             <Button
//               onClick={() => router.push('/bookings')}
//               className="bg-brand hover:bg-brand/90"
//             >
//               <ArrowLeft className="w-4 h-4 mr-2" /> Back to bookings
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   const sessionDate = new Date(sessionInfo.booking.start_at);

//   return (
//     <div className="space-y-4">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div className="flex items-center gap-4">
//           <Button variant="outline" onClick={() => router.push('/bookings')}>
//             <ArrowLeft className="w-4 h-4 mr-2" /> Back
//           </Button>
//           <div>
//             <h1 className="text-2xl font-bold text-brand-dark">Live Session</h1>
//             <div className="flex items-center gap-3 text-gray-600 text-sm">
//               <span className="flex items-center gap-1">
//                 <Calendar className="w-4 h-4" />
//                 {sessionDate.toLocaleDateString('en-US', {
//                   weekday: 'long',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </span>
//               <span className="flex items-center gap-1">
//                 <Clock className="w-4 h-4" />
//                 {sessionDate.toLocaleTimeString('en-US', {
//                   hour: 'numeric',
//                   minute: '2-digit',
//                 })}
//               </span>
//             </div>
//           </div>
//         </div>
//         <div className="flex items-center gap-2">
//           <Badge variant="outline">{sessionInfo.booking.duration_minutes} min</Badge>
//           <Badge variant="default">{sessionInfo.booking.status}</Badge>
//         </div>
//       </div>

//       {/* Agora App ID Warning */}
//       {!AGORA_APP_ID && (
//         <div className="bg-yellow-100 text-yellow-800 px-4 py-3 rounded-lg text-sm">
//           <strong>Warning:</strong> Agora App ID is not configured. Set <code>NEXT_PUBLIC_AGORA_APP_ID</code> in your environment variables.
//         </div>
//       )}

//       {/* Agora Video Call */}
//       <div className="rounded-2xl overflow-hidden" style={{ minHeight: '70dvh' }}>
//         <AgoraVideoCall
//           appId={sessionInfo.appId}
//           channel={sessionInfo.channel}
//           token={sessionInfo.token}
//           uid={sessionInfo.uid}
//           userName={sessionInfo.userName}
//           userAvatar={sessionInfo.userAvatar}
//           participantName={sessionInfo.participantName}
//           participantAvatar={sessionInfo.participantAvatar}
//           onLeave={handleLeaveCall}
//         />
//       </div>
//     </div>
//   );
// }





'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/api/auth';
import { bookingsApi, BookingResponse } from '@/lib/api/bookings-api';
import { users } from '@/lib/api/users';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Calendar, Loader2 } from 'lucide-react';
import { AgoraVideoCall } from '@/components/agora-video-call';

interface SessionInfo {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  booking: BookingResponse;
  userName: string;
  userAvatar?: string;
  participantName: string;
  participantAvatar?: string;
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSessionData = async () => {
      const currentUser = auth.getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      try {
        // 1) Fetch booking details
        const bookingResult = await bookingsApi.getBookingById(bookingId);
        if (!bookingResult.success || !bookingResult.data) {
          setError('Booking not found.');
          setLoading(false);
          return;
        }
        const booking = bookingResult.data;

        // 2) Ensure current user is a participant
        const isParticipant =
          currentUser.id === booking.mentor_id || currentUser.id === booking.mentee_id;
        if (!isParticipant) {
          //  setError('You are not a participant in this session.');
          // setLoading(false);
          //  return;
        }

        // 3) Ensure booking is confirmed
        if (booking.status !== 'confirmed') {
          let msg = '';
          if (booking.status === 'pending') {
            const isMentor = currentUser.id === booking.mentor_id;
            msg = isMentor
              ? 'This booking is pending your confirmation. Please confirm the booking from the Bookings page before joining.'
              : 'This session is pending mentor confirmation. You will be able to join once the mentor confirms the booking.';
          } else if (booking.status === 'cancelled') {
            msg = 'This session has been cancelled and cannot be joined.';
          } else if (booking.status === 'completed') {
            msg = 'This session has already been completed.';
          } else if (booking.status === 'expired') {
            msg = 'This session has expired and can no longer be joined.';
          } else {
            msg = `This session is ${booking.status}. Only confirmed sessions can be joined.`;
          }
          setError(msg);
          setLoading(false);
          return;
        }

        // 4) Fetch backend video token (with app_id and uid from backend)
        const tokenResult = await bookingsApi.getVideoToken(bookingId);
        if (!tokenResult.success || !tokenResult.data) {
          setError('Failed to get video token. Please try again.');
          setLoading(false);
          return;
        }
        const videoToken = tokenResult.data;

        // 5) Participant info
        const isMentor = currentUser.id === booking.mentor_id;
        const participantId = isMentor ? booking.mentee_id : booking.mentor_id;

        let participantName = 'Participant';
        let participantAvatar: string | undefined;
        try {
          const participantResult = await users.getUserById(participantId);
          if (participantResult.success && participantResult.data) {
            participantName = participantResult.data.email.split('@')[0];
          }
        } catch {
          // ignore
        }

        // 6) Optional: notify backend session start
        try {
          await bookingsApi.startVideoSession(bookingId);
        } catch {
          // non-blocking
        }

        // 7) Set session info using EXACT backend values
        setSessionInfo({
          appId: videoToken.app_id,               // ← Use backend app_id
          channel: videoToken.room_id,            // ← Stable room_id from backend
          token: videoToken.rtc_token,            // ← Token from backend
          uid: videoToken.uid,                    // ← Exact uid backend used to build token
          booking,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          participantName,
          participantAvatar,
        });

        setLoading(false);
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Failed to load session. Please try again.');
        setLoading(false);
      }
    };

    loadSessionData();
  }, [bookingId, router]);

  const handleLeaveCall = async () => {
    if (sessionInfo) {
      try {
        await bookingsApi.endVideoSession(bookingId);
      } catch {
        // non-blocking
      }
    }
    router.push('/bookings');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand mx-auto" />
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
              {error ? 'Cannot Join Session' : 'Session Not Found'}
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

  const sessionDate = new Date(sessionInfo.booking.start_at);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/bookings')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-brand-dark">Live Session</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-gray-600 text-xs sm:text-sm">
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
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs sm:text-sm">{sessionInfo.booking.duration_minutes} min</Badge>
          <Badge variant="default" className="text-xs sm:text-sm">{sessionInfo.booking.status}</Badge>
        </div>
      </div>

      {/* Agora Video Call */}
      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-950">
        <AgoraVideoCall
          appId={sessionInfo.appId}
          channel={sessionInfo.channel}
          token={sessionInfo.token}
          uid={sessionInfo.uid}
          userName={sessionInfo.userName}
          userAvatar={sessionInfo.userAvatar}
          participantName={sessionInfo.participantName}
          participantAvatar={sessionInfo.participantAvatar}
          onLeave={handleLeaveCall}
        />
      </div>
    </div>
  );
}
