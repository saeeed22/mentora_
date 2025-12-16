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
    const remoteVideoRef = useRef<HTMLDivElement>(null);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
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
                    if (mediaType === 'video' && remoteVideoRef.current) {
                        user.videoTrack?.play(remoteVideoRef.current);
                    }
                    if (mediaType === 'audio') {
                        user.audioTrack?.play();
                    }
                    setRemoteUsers((prev) => {
                        const exists = prev.find((u) => u.uid === user.uid);
                        if (exists) return prev;
                        console.log('[Agora] Adding remote user:', user.uid);
                        return [...prev, user];
                    });
                });

                client.on('user-unpublished', (user, mediaType) => {
                    if (mediaType === 'video') {
                        user.videoTrack?.stop();
                    }
                    if (mediaType === 'audio') {
                        user.audioTrack?.stop();
                    }
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
            localAudioTrackRef.current?.close();
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
        localAudioTrackRef.current?.close();
        localVideoTrackRef.current?.close();
        await clientRef.current?.leave();
        setIsJoined(false);
        setRemoteUsers([]);
        onLeave?.();
    }, [onLeave]);

    return (
        <div className="flex flex-col h-full">
            {/* Connection status */}
            {connectionState !== 'CONNECTED' && isJoined && (
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-center text-sm">
                    Connection: {connectionState}
                </div>
            )}

            {/* Video grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-900 rounded-t-2xl">
                {/* Local video */}
                <Card className="relative overflow-hidden bg-gray-800 border-gray-700">
                    <CardContent className="p-0 aspect-video">
                        <div
                            ref={localVideoRef}
                            className="w-full h-full"
                            style={{ minHeight: '300px' }}
                        />
                        {isVideoMuted && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={userAvatar} alt={userName} />
                                    <AvatarFallback className="text-2xl bg-brand-light/20 text-brand">
                                        {getInitials(userName)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        )}
                        <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded text-sm flex items-center gap-2">
                            <span>{userName} (You)</span>
                            {isAudioMuted && <MicOff className="w-3 h-3 text-red-400" />}
                        </div>
                    </CardContent>
                </Card>

                {/* Remote video */}
                <Card className="relative overflow-hidden bg-gray-800 border-gray-700">
                    <CardContent className="p-0 aspect-video">
                        {remoteUsers.length > 0 ? (
                            <div
                                ref={remoteVideoRef}
                                className="w-full h-full"
                                style={{ minHeight: '300px' }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
                                <Avatar className="h-24 w-24 mb-4">
                                    <AvatarImage src={participantAvatar} alt={participantName} />
                                    <AvatarFallback className="text-2xl bg-brand-light/20 text-brand">
                                        {getInitials(participantName)}
                                    </AvatarFallback>
                                </Avatar>
                                <p className="text-gray-400">Waiting for {participantName} to join...</p>
                            </div>
                        )}
                        {remoteUsers.length > 0 && (
                            <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded text-sm">
                                {participantName}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="bg-gray-800 rounded-b-2xl p-4">
                <div className="flex items-center justify-center gap-3">
                    {/* Mic toggle */}
                    <Button
                        variant={isAudioMuted ? 'destructive' : 'secondary'}
                        size="lg"
                        className="rounded-full w-14 h-14"
                        onClick={toggleAudio}
                    >
                        {isAudioMuted ? (
                            <MicOff className="w-6 h-6" />
                        ) : (
                            <Mic className="w-6 h-6" />
                        )}
                    </Button>

                    {/* Video toggle */}
                    <Button
                        variant={isVideoMuted ? 'destructive' : 'secondary'}
                        size="lg"
                        className="rounded-full w-14 h-14"
                        onClick={toggleVideo}
                    >
                        {isVideoMuted ? (
                            <VideoOff className="w-6 h-6" />
                        ) : (
                            <Video className="w-6 h-6" />
                        )}
                    </Button>

                    {/* Screen share toggle */}
                    <Button
                        variant={isScreenSharing ? 'default' : 'secondary'}
                        size="lg"
                        className="rounded-full w-14 h-14"
                        onClick={toggleScreenShare}
                    >
                        {isScreenSharing ? (
                            <MonitorOff className="w-6 h-6" />
                        ) : (
                            <Monitor className="w-6 h-6" />
                        )}
                    </Button>

                    {/* Participants count */}
                    <Button
                        variant="secondary"
                        size="lg"
                        className="rounded-full w-14 h-14"
                    >
                        <Users className="w-6 h-6" />
                        <span className="sr-only">{remoteUsers.length + 1} participants</span>
                    </Button>

                    {/* Leave call */}
                    <Button
                        variant="destructive"
                        size="lg"
                        className="rounded-full w-14 h-14 ml-4"
                        onClick={leaveCall}
                    >
                        <PhoneOff className="w-6 h-6" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
