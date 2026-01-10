'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC, {
    IAgoraRTCClient,
    IAgoraRTCRemoteUser,
    ICameraVideoTrack,
    IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    PhoneOff,
    Monitor,
    MonitorOff,
    Users,
} from 'lucide-react';

interface AgoraVideoCallProps {
    appId: string;
    channel: string;
    token: string;
    uid: number;
    userName: string;
    userAvatar?: string;
    participantName: string;
    participantAvatar?: string;
    onLeave?: () => void;
}

// Sub-component for individual remote players
function RemotePlayer({
    user,
    fallbackName,
    fallbackAvatar
}: {
    user: IAgoraRTCRemoteUser;
    fallbackName: string;
    fallbackAvatar?: string;
}) {
    const videoRef = useRef<HTMLDivElement>(null);
    const [isVideoMuted, setIsVideoMuted] = useState(!user.hasVideo);
    const [isAudioMuted, setIsAudioMuted] = useState(!user.hasAudio);

    useEffect(() => {
        if (videoRef.current && user.videoTrack) {
            user.videoTrack.play(videoRef.current);
        }
        return () => {
            user.videoTrack?.stop();
        };
    }, [user.videoTrack]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase() || '?';
    };

    return (
        <Card className="relative overflow-hidden bg-gray-800 border-gray-700 h-full min-h-[200px] sm:min-h-[300px]">
            <CardContent className="p-0 h-full w-full relative">
                <div
                    ref={videoRef}
                    className="w-full h-full object-cover"
                />
                {(!user.hasVideo || isVideoMuted) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <Avatar className="h-16 w-16 sm:h-24 sm:w-24">
                            <AvatarImage src={fallbackAvatar} alt={fallbackName} />
                            <AvatarFallback className="text-xl sm:text-2xl bg-brand-light/20 text-brand">
                                {getInitials(fallbackName)}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                )}
                <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-black/60 text-white px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm flex items-center gap-2">
                    <span>{fallbackName}</span>
                    {!user.hasAudio && <MicOff className="w-3 h-3 text-red-400" />}
                </div>
            </CardContent>
        </Card>
    );
}

export function AgoraVideoCall({
    appId,
    channel,
    token,
    uid,
    userName,
    userAvatar,
    participantName,
    participantAvatar,
    onLeave,
}: AgoraVideoCallProps) {
    const [isJoined, setIsJoined] = useState(false);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
    const [connectionState, setConnectionState] = useState<string>('DISCONNECTED');

    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
    const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
    const localVideoRef = useRef<HTMLDivElement>(null);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase() || '?';
    };

    // Initialize and join channel
    useEffect(() => {
        const initAgora = async () => {
            try {
                console.log('[Agora] Initializing with:', {
                    appId: appId ? 'SET' : 'MISSING',
                    channel,
                    uid,
                    tokenLength: token?.length
                });

                // Create client
                const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
                clientRef.current = client;

                console.log('[Agora] Client created');

                // Set up event handlers
                client.on('user-published', async (user, mediaType) => {
                    console.log('[Agora] User published:', { uid: user.uid, mediaType });
                    await client.subscribe(user, mediaType);

                    if (mediaType === 'audio') {
                        user.audioTrack?.play();
                    }

                    setRemoteUsers((prev) => {
                        const exists = prev.find((u) => u.uid === user.uid);
                        if (exists) return prev.map(u => u.uid === user.uid ? user : u);
                        console.log('[Agora] Adding remote user:', user.uid);
                        return [...prev, user];
                    });
                });

                client.on('user-unpublished', (user, mediaType) => {
                    setRemoteUsers((prev) => prev.map(u => u.uid === user.uid ? user : u));
                });

                client.on('user-left', (user) => {
                    console.log('[Agora] User left:', user.uid);
                    setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
                });

                client.on('connection-state-change', (curState) => {
                    console.log('[Agora] Connection state changed:', curState);
                    setConnectionState(curState);
                });

                // Join channel
                console.log('[Agora] Joining channel:', channel, 'with UID:', uid);
                await client.join(appId, channel, token, uid);
                console.log('[Agora] Successfully joined channel');
                setIsJoined(true);

                // Create and publish local tracks
                console.log('[Agora] Creating local tracks...');
                const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
                localAudioTrackRef.current = audioTrack;
                localVideoTrackRef.current = videoTrack;

                // Play local video
                if (localVideoRef.current) {
                    videoTrack.play(localVideoRef.current);
                }

                // Publish tracks
                console.log('[Agora] Publishing local tracks...');
                await client.publish([audioTrack, videoTrack]);
                console.log('[Agora] Local tracks published successfully');
            } catch (error) {
                console.error('[Agora] Failed to initialize:', error);
            }
        };

        if (appId && channel && token) {
            initAgora();
        }

        return () => {
            // Cleanup
            localAudioTrackRef.current?.stop();
            localAudioTrackRef.current?.close();
            localVideoTrackRef.current?.stop();
            localVideoTrackRef.current?.close();
            clientRef.current?.leave();
        };
    }, [appId, channel, token, uid]);

    const toggleAudio = useCallback(async () => {
        if (localAudioTrackRef.current) {
            await localAudioTrackRef.current.setEnabled(isAudioMuted);
            setIsAudioMuted(!isAudioMuted);
        }
    }, [isAudioMuted]);

    const toggleVideo = useCallback(async () => {
        if (localVideoTrackRef.current) {
            await localVideoTrackRef.current.setEnabled(isVideoMuted);
            setIsVideoMuted(!isVideoMuted);
        }
    }, [isVideoMuted]);

    const toggleScreenShare = useCallback(async () => {
        if (!clientRef.current) return;

        if (isScreenSharing) {
            // Stop screen share, resume camera
            if (localVideoTrackRef.current) {
                await clientRef.current.unpublish(localVideoTrackRef.current);
                localVideoTrackRef.current.close();
            }
            const videoTrack = await AgoraRTC.createCameraVideoTrack();
            localVideoTrackRef.current = videoTrack;
            if (localVideoRef.current) {
                videoTrack.play(localVideoRef.current);
            }
            await clientRef.current.publish(videoTrack);
            setIsScreenSharing(false);
        } else {
            // Start screen share
            try {
                if (localVideoTrackRef.current) {
                    await clientRef.current.unpublish(localVideoTrackRef.current);
                    localVideoTrackRef.current.close();
                }
                const screenTrack = await AgoraRTC.createScreenVideoTrack({}, 'disable');
                const track = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;
                localVideoTrackRef.current = track as ICameraVideoTrack;
                if (localVideoRef.current) {
                    track.play(localVideoRef.current);
                }
                await clientRef.current.publish(track);
                setIsScreenSharing(true);

                // Handle when user stops sharing via browser UI
                track.on('track-ended', async () => {
                    const videoTrack = await AgoraRTC.createCameraVideoTrack();
                    localVideoTrackRef.current = videoTrack;
                    if (localVideoRef.current) {
                        videoTrack.play(localVideoRef.current);
                    }
                    await clientRef.current?.publish(videoTrack);
                    setIsScreenSharing(false);
                });
            } catch (error) {
                console.error('Screen share failed:', error);
            }
        }
    }, [isScreenSharing]);

    const leaveCall = useCallback(async () => {
        localAudioTrackRef.current?.stop();
        localAudioTrackRef.current?.close();
        localVideoTrackRef.current?.stop();
        localVideoTrackRef.current?.close();
        await clientRef.current?.leave();
        setIsJoined(false);
        setRemoteUsers([]);
        onLeave?.();
    }, [onLeave]);

    // Dynamic grid classes based on participant count
    const totalParticipants = remoteUsers.length + 1;
    const getGridClasses = () => {
        if (totalParticipants === 1) return 'grid-cols-1';
        if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2';
        if (totalParticipants <= 4) return 'grid-cols-1 sm:grid-cols-2';
        return 'grid-cols-2 lg:grid-cols-3';
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-gray-950">
            {/* Connection status */}
            {connectionState !== 'CONNECTED' && isJoined && (
                <div className="bg-yellow-500/10 text-yellow-500 border-b border-yellow-500/20 px-4 py-2 text-center text-xs sm:text-sm animate-pulse">
                    Connection: {connectionState}
                </div>
            )}

            {/* Video grid */}
            <div className={`flex-1 grid ${getGridClasses()} gap-2 sm:gap-4 p-2 sm:p-4 bg-gray-950 overflow-y-auto min-h-0`}>
                {/* Local video */}
                <Card className="relative overflow-hidden bg-gray-800 border-gray-700 h-full min-h-[200px] sm:min-h-[300px]">
                    <CardContent className="p-0 h-full w-full relative">
                        <div
                            ref={localVideoRef}
                            className="w-full h-full object-cover"
                        />
                        {isVideoMuted && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                <Avatar className="h-16 w-16 sm:h-24 sm:w-24">
                                    <AvatarImage src={userAvatar} alt={userName} />
                                    <AvatarFallback className="text-xl sm:text-2xl bg-brand-light/20 text-brand">
                                        {getInitials(userName)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-black/60 text-white px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm flex items-center gap-2">
                            <span>{userName} (You)</span>
                            {isAudioMuted && <MicOff className="w-3 h-3 text-red-400" />}
                        </div>
                    </CardContent>
                </Card>

                {/* Remote users */}
                {remoteUsers.map((user) => (
                    <RemotePlayer
                        key={user.uid}
                        user={user}
                        fallbackName={participantName}
                        fallbackAvatar={participantAvatar}
                    />
                ))}

                {/* Waiting placeholder if only 1 participant */}
                {totalParticipants === 1 && (
                    <Card className="relative overflow-hidden bg-gray-900/50 border-gray-800 border-dashed border-2 h-full min-h-[200px] sm:min-h-[300px] flex flex-col items-center justify-center text-center p-6">
                        <Avatar className="h-16 w-16 sm:h-24 sm:w-24 mb-4 opacity-50">
                            <AvatarImage src={participantAvatar} alt={participantName} />
                            <AvatarFallback className="text-xl sm:text-2xl bg-gray-800 text-gray-500">
                                {getInitials(participantName)}
                            </AvatarFallback>
                        </Avatar>
                        <p className="text-gray-500 text-sm sm:text-base max-w-[200px]">
                            Waiting for {participantName} to join...
                        </p>
                    </Card>
                )}
            </div>

            {/* Controls */}
            <div className="bg-gray-900/80 backdrop-blur-md border-t border-gray-800 p-3 sm:p-4 pb-8 sm:pb-4">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 max-w-screen-md mx-auto">
                    {/* Mic toggle */}
                    <Button
                        variant={isAudioMuted ? 'destructive' : 'secondary'}
                        size="icon"
                        className="rounded-full w-10 h-10 sm:w-14 sm:h-14 transition-all active:scale-95"
                        onClick={toggleAudio}
                    >
                        {isAudioMuted ? (
                            <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : (
                            <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                    </Button>

                    {/* Video toggle */}
                    <Button
                        variant={isVideoMuted ? 'destructive' : 'secondary'}
                        size="icon"
                        className="rounded-full w-10 h-10 sm:w-14 sm:h-14 transition-all active:scale-95"
                        onClick={toggleVideo}
                    >
                        {isVideoMuted ? (
                            <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : (
                            <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                    </Button>

                    {/* Screen share toggle */}
                    <Button
                        variant={isScreenSharing ? 'default' : 'secondary'}
                        size="icon"
                        className="rounded-full w-10 h-10 sm:w-14 sm:h-14 transition-all active:scale-95 hidden sm:flex"
                        onClick={toggleScreenShare}
                    >
                        {isScreenSharing ? (
                            <MonitorOff className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : (
                            <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                    </Button>

                    {/* Participants count indicator */}
                    <div className="bg-gray-800 text-gray-300 rounded-full h-10 px-3 sm:px-4 flex items-center gap-2 text-xs sm:text-sm font-medium border border-gray-700">
                        <Users className="w-4 h-4" />
                        <span>{totalParticipants}</span>
                    </div>

                    {/* Leave call */}
                    <Button
                        variant="destructive"
                        size="icon"
                        className="rounded-full w-10 h-10 sm:w-14 sm:h-14 sm:ml-4 transition-all hover:rotate-12 active:scale-95"
                        onClick={leaveCall}
                    >
                        <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
