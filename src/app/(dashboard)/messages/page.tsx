'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Send,
  MessageCircle,
  Heart,
  MoreVertical,
  Linkedin,
  Twitter,
  Globe,
  Star,
  Rocket,
  Award,
  Briefcase,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  ThumbsUp,
  Loader2,
  Clock,
  Check,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { messagingApi, ConversationResponse, MessageResponse } from '@/lib/api/messaging-api';
import { mentorsApi } from '@/lib/api/mentors-api';
import { MentorDetailResponse } from '@/lib/types';
import { auth } from '@/lib/api/auth';
import { tokenManager } from '@/lib/api-client';
import HumanDate from '@/components/HumanDate'

// Extended conversation type to include suggested mentors
interface ConversationOrMentor extends ConversationResponse {
  isSuggestedMentor?: boolean;
  mentorData?: MentorDetailResponse;
  isMessageable?: boolean; // whether mentor has a valid UUID for messaging
}

const isUuid = (value: string | undefined | null) => {
  if (!value) return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);
};

const ONLINE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes considered "online"

const emitUnreadCount = (conversationList: ConversationOrMentor[]) => {
  const currentUser = auth.getCurrentUser();
  const totalUnread = conversationList.reduce((sum, c) => sum + getDisplayUnread(c, currentUser), 0);
  window.dispatchEvent(new CustomEvent('unreadMessagesChange', { detail: { count: totalUnread } }));
};

const filterConversationsForRole = (list: ConversationOrMentor[], currentUser: ReturnType<typeof auth.getCurrentUser>) => {
  if (currentUser?.role === 'mentor') {
    return list.filter(conv => (conv.last_message != null) || (conv.unread_count || 0) > 0);
  }
  return list;
};

const normalizeUnreadForSelf = (list: ConversationOrMentor[], currentUser: ReturnType<typeof auth.getCurrentUser>) => {
  if (!currentUser) return list;
  return list.map(conv => {
    const lastSender = conv.last_message?.sender_id;
    const lastIsRead = conv.last_message?.is_read;
    if ((lastSender && lastSender === currentUser.id) || lastIsRead) {
      return { ...conv, unread_count: 0 };
    }
    return conv;
  });
};

const getDisplayUnread = (conversation: ConversationOrMentor, currentUser: ReturnType<typeof auth.getCurrentUser>) => {
  const lastSender = conversation.last_message?.sender_id;
  if (lastSender && currentUser && lastSender === currentUser.id) return 0;
  return conversation.unread_count || 0;
};

const isConversationOnline = (conversation: ConversationOrMentor) => {
  // Only show online if they have recent activity AND it's not just the initial conversation creation
  // (initial creation doesn't indicate they're logged in)
  if (conversation.isSuggestedMentor) return false;

  // Check if there's actual message activity (not just conversation creation)
  if (!conversation.last_message || !conversation.last_message.created_at) return false;

  const lastActivity = conversation.last_message.created_at;
  return Date.now() - new Date(lastActivity).getTime() <= ONLINE_WINDOW_MS;
};

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<ConversationOrMentor[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationOrMentor | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);
  const shouldScrollOnSend = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to latest message (skip initial load to avoid jumping)
  useEffect(() => {
    if (!initialScrollDone.current) {
      initialScrollDone.current = true;
      return;
    }

    if (shouldScrollOnSend.current) {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
      shouldScrollOnSend.current = false;
    }
  }, [messages]);

  // Emit unread count to sidebar when conversations change
  useEffect(() => {
    emitUnreadCount(conversations);
  }, [conversations]);

  // Load conversations and suggested mentors for mentees
  useEffect(() => {
    const loadConversations = async () => {
      const currentUser = auth.getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setIsLoading(true);
      console.log('[Messages] Loading conversations...');
      const result = await messagingApi.getConversations();
      console.log('[Messages] Conversations result:', result);

      let conversationList: ConversationOrMentor[] = [];

      if (result.success && result.data) {
        console.log('[Messages] Loaded conversations:', result.data.data.length);
        const normalized = normalizeUnreadForSelf(result.data.data, currentUser);
        conversationList = filterConversationsForRole(normalized, currentUser);
      }

      // For mentees: Load top 10 mentors as suggested contacts
      // For mentors: Only show conversations with mentees (no suggestions)
      if (currentUser.role === 'mentee') {
        console.log('[Messages] Loading suggested mentors for mentee...');
        const mentorsResult = await mentorsApi.searchMentors({ limit: 10, sort: 'experience' });

        if (mentorsResult.success && mentorsResult.data) {
          const mentorsData = mentorsResult.data.data || [];

          // Prefer mentors with decent profiles; if none qualify, fall back to all returned mentors
          const filteredMentors = mentorsData.filter(mentor => {
            // Backend search returns top-level 'id' field as user UUID
            const mentorUserId = (mentor as any).id || mentor.user?.id || mentor.profile?.user_id;
            const experience = mentor.mentor_profile?.experience_years ?? 0;
            const hasHeadline = Boolean(mentor.mentor_profile?.headline?.length);
            const hasSkills = Boolean(mentor.mentor_profile?.skills?.length);
            return Boolean(mentorUserId) && experience > 0 && hasHeadline && hasSkills;
          });

          const usableMentors = filteredMentors.length > 0 ? filteredMentors : mentorsData;

          // Convert mentors to conversation format (exclude ones we already have conversations with)
          const existingParticipantIds = conversationList.flatMap(c =>
            c.participants?.map(p => p.id) || []
          );

          const suggestedMentors: ConversationOrMentor[] = usableMentors
            .map((mentor, idx) => {
              // Backend search returns top-level 'id' field as user UUID
              const mentorUserId = (mentor as any).id || mentor.user?.id || mentor.profile?.user_id;
              const fallbackId = mentor.profile?.id || mentor.user?.email || `mentor-fallback-${idx}`;
              const participantId = mentorUserId || fallbackId;
              if (!participantId || existingParticipantIds.includes(participantId)) return null;

              const isMessageable = isUuid(mentorUserId);

              return {
                id: `mentor-${participantId}`,
                isSuggestedMentor: true,
                isMessageable,
                mentorData: mentor,
                created_at: new Date().toISOString(),
                unread_count: 0,
                participants: [{
                  id: participantId,
                  email: (mentor as any).email || mentor.user?.email || '',
                  full_name: mentor.profile?.full_name || 'Mentor',
                  avatar_url: mentor.profile?.avatar_url,
                }],
              } as ConversationOrMentor;
            })
            .filter((m): m is ConversationOrMentor => m !== null)
            .slice(0, 10);

          conversationList = [...conversationList, ...suggestedMentors];
        }
      }

      setConversations(conversationList);

      // Check if a conversation ID is specified in the URL (PRIORITY 1)
      const c = searchParams.get('c');
      if (c) {
        const found = conversationList.find(conv => conv.id === c);
        if (found) {
          setSelectedConversation(found);
          // Save to sessionStorage for future visits
          sessionStorage.setItem('mentora_last_conversation', c);
          if (!found.isSuggestedMentor) {
            loadMessages(found.id);
          }
        }
      } else {
        // No URL parameter - check sessionStorage (PRIORITY 2)
        const lastConversationId = sessionStorage.getItem('mentora_last_conversation');
        if (lastConversationId) {
          const found = conversationList.find(conv => conv.id === lastConversationId);
          if (found) {
            setSelectedConversation(found);
            if (!found.isSuggestedMentor) {
              loadMessages(found.id);
            }
            // Exit early - we found the last conversation
            setIsLoading(false);
            return;
          }
        }

        // No URL and no valid sessionStorage - use defaults (PRIORITY 3)
        // Default to "no chat selected" for both mentors and mentees on fresh login/session
        setSelectedConversation(null);
      }

      if (!result.success) {
        console.error('[Messages] Failed to load conversations:', result.error);
      }

      setIsLoading(false);
    };

    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh conversations periodically to keep presence and unread counts fresh
  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) return;

    const interval = setInterval(async () => {
      const result = await messagingApi.getConversations();
      if (result.success && result.data) {
        setConversations(prev => {
          const suggested = prev.filter(c => c.isSuggestedMentor);
          const normalized = normalizeUnreadForSelf(result.data!.data, currentUser);
          const updatedList = filterConversationsForRole(normalized, currentUser);
          return [...updatedList, ...suggested];
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Poll messages for the selected conversation to catch read receipts and new messages
  useEffect(() => {
    if (!selectedConversation || selectedConversation.isSuggestedMentor) return;

    const interval = setInterval(() => {
      console.log('[Polling] Fetching messages...');
      loadMessages(selectedConversation.id, { silent: true });
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConversation]);

  // WebSocket connection for real-time messaging (DISABLED - backend CORS issue)
  // TODO: Re-enable when backend CORS is configured for WebSocket
  /*
  useEffect(() => {
    if (!selectedConversation || selectedConversation.isSuggestedMentor) return;

    const connectWebSocket = () => {
      const token = tokenManager.getAccessToken();
      if (!token) {
        console.log('[WebSocket] No token, skipping WS connection');
        return;
      }

      // Always use wss:// for Railway production (they don't allow ws://)
      const wsUrl = `wss://mentora-backend-production-d4c3.up.railway.app/v1/conversations/ws?token=${token}`;
      
      console.log('[WebSocket] Attempting connection...');
      console.log('[WebSocket] URL:', wsUrl.replace(token, 'TOKEN_HIDDEN'));
      console.log('[WebSocket] Token present:', !!token);

      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[WebSocket] ✅ Connected successfully');
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[WebSocket] 📨 Received:', data);

            // Handle new message
            if (data.type === 'new_message' && data.message) {
              console.log('[WebSocket] ➕ Adding new message:', data.message.id);
              setMessages(prev => {
                const exists = prev.some(m => m.id === data.message.id);
                if (exists) {
                  console.log('[WebSocket] Message already exists, skipping');
                  return prev;
                }
                return [...prev, data.message];
              });
              shouldScrollOnSend.current = true;
            }

            // Handle read receipts
            if (data.type === 'messages_read' && data.message_id && selectedConversation) {
              console.log('[WebSocket] ✅ Messages marked as read:', {
                conversation: data.conversation_id,
                upToMessage: data.message_id,
                reader: data.reader_id
              });
              
              // Refetch messages to get updated is_read flags from backend
              // This is more reliable than trying to compare UUIDs
              if (data.conversation_id === selectedConversation.id) {
                console.log('[WebSocket] 🔄 Refreshing messages to show green ticks');
                loadMessages(selectedConversation.id, { silent: true });
              }
            }
          } catch (error) {
            console.error('[WebSocket] ❌ Error parsing message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('[WebSocket] ⚠️ Error event (details in close event)');
          setWsConnected(false);
        };

        ws.onclose = (event) => {
          console.log('[WebSocket] 🔌 Connection closed');
          console.log('[WebSocket] Close code:', event.code);
          console.log('[WebSocket] Close reason:', event.reason || 'None provided');
          console.log('[WebSocket] Was clean:', event.wasClean);
          
          // Common close codes:
          // 1000 = Normal closure
          // 1006 = Abnormal closure (no close frame, likely connection failure)
          // 1008 = Policy violation (e.g., CORS, authentication failed)
          // 1011 = Server error
          
          if (event.code === 1006) {
            console.error('[WebSocket] ❌ Connection failed - likely CORS or network issue');
          } else if (event.code === 1008) {
            console.error('[WebSocket] ❌ Authentication or policy error');
          }
          
          setWsConnected(false);
          wsRef.current = null;
          // Attempt reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[WebSocket] 🔄 Attempting reconnect...');
            connectWebSocket();
          }, 3000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('[WebSocket] Connection error:', error);
        setWsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setWsConnected(false);
    };
  }, [selectedConversation]);
  */

  const loadMessages = async (conversationId: string, options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoadingMessages(true);
    }
    const result = await messagingApi.getMessages(conversationId);
    if (result.success && result.data) {
      // Log is_read states for debugging
      console.log('[Messages] Fetched messages:', result.data.data.map(m => ({ id: m.id, sender_id: m.sender_id, is_read: m.is_read })));
      // Messages are returned newest first, reverse for display
      setMessages(result.data.data.reverse());

      // Don't call markAsRead if WebSocket is connected (it broadcasts messages_read event)
      if (wsConnected) {
        console.log('[Messages] WebSocket connected, skipping redundant markAsRead call');
      }

      // Always mark as read regardless of WebSocket status (ensures backend is updated)
      const viewer = auth.getCurrentUser();
      const latestOther = result.data.data.find(m => m.sender_id !== viewer?.id);

      // Always zero unread locally once messages are viewed
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unread_count: 0 } : c));

      if (latestOther) {
        console.log('[Messages] Calling markAsRead for message:', latestOther.id);
        const readResult = await messagingApi.markAsRead(conversationId, latestOther.id);
        console.log('[Messages] markAsRead result:', readResult);
      }
    }
    if (!options?.silent) {
      setIsLoadingMessages(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleSendMessage = async () => {
    console.log('[Messages] handleSendMessage called, newMessage:', newMessage);
    if (!newMessage.trim() || !selectedConversation) {
      console.log('[Messages] Early return: empty message or no conversation');
      return;
    }

    const messageText = newMessage.trim();
    const currentUser = auth.getCurrentUser();

    // If messaging a suggested mentor, create conversation first
    let conversationId = selectedConversation.id;
    if (selectedConversation.isSuggestedMentor && currentUser) {
      const mentorId = selectedConversation.participants[0].id;
      if (!isUuid(mentorId)) {
        console.error('[Messages] Cannot message mentor: invalid ID (not UUID).');
        setIsSending(false);
        return;
      }

      console.log('[Messages] Creating new conversation with mentor...');
      const createResult = await messagingApi.createConversation([currentUser.id, mentorId] as [string, string]);

      if (createResult.success && createResult.data) {
        conversationId = createResult.data.id;
        // Update the conversation in the list, preserving mentor data from suggestion
        const newConversation = {
          ...createResult.data!,
          isSuggestedMentor: false,
          isMessageable: true,
          mentorData: selectedConversation.mentorData,
        };
        const updatedConversations = conversations.map(c =>
          c.id === selectedConversation.id ? newConversation : c
        );
        setConversations(updatedConversations);
        setSelectedConversation(newConversation);
      } else {
        console.error('[Messages] Failed to create conversation');
        setIsSending(false);
        return;
      }
    }

    // Optimistic update - show message immediately
    const optimisticMessage: MessageResponse = {
      id: 'temp-' + Date.now(),
      conversation_id: conversationId,
      sender_id: currentUser?.id || '',
      content: messageText,
      attachments: [],
      is_read: false,
      created_at: new Date().toISOString(),
    };

    console.log('[Messages] Adding optimistic message, clearing input');
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setIsSending(true);
    shouldScrollOnSend.current = true;

    console.log('[Messages] Calling API...');
    const result = await messagingApi.sendMessage(conversationId, messageText);
    console.log('[Messages] API result:', result);

    if (result.success && result.data) {
      // Replace optimistic message with real one, but keep sender read receipt false until receiver actually reads
      const currentUserId = currentUser?.id;
      const deliveredMessage = result.data!;
      const normalizedMessage = (deliveredMessage.sender_id === currentUserId)
        ? { ...deliveredMessage, is_read: false }
        : deliveredMessage;

      setMessages(prev => prev.map(m =>
        m.id === optimisticMessage.id ? normalizedMessage : m
      ));

      // Refresh conversations to update last message (background)
      messagingApi.getConversations().then(convResult => {
        if (convResult.success && convResult.data) {
          setConversations(prev => {
            const currentUser = auth.getCurrentUser();
            const normalized = normalizeUnreadForSelf(convResult.data!.data, currentUser);
            const updated = filterConversationsForRole(normalized, currentUser);
            const suggested = prev.filter(c => c.isSuggestedMentor);
            return [...updated, ...suggested];
          });
        }
      });
    } else {
      console.log('[Messages] API returned error, but message may have been sent (backend bug)');
      // WORKAROUND: Backend returns 500 but actually saves the message
      // Keep the optimistic message and don't restore input
      // The message ID will be temporary but it will display correctly
    }
    setIsSending(false);
  };

  const handleSelectConversation = (conversation: ConversationOrMentor) => {
    setSelectedConversation(conversation);
    // Save to sessionStorage for future visits (unless it's a suggested mentor)
    if (!conversation.isSuggestedMentor) {
      sessionStorage.setItem('mentora_last_conversation', conversation.id);
    }
    // Optimistically clear unread locally when opening the conversation
    setConversations(prev => prev.map(c => c.id === conversation.id ? { ...c, unread_count: 0 } : c));
    if (!conversation.isSuggestedMentor) {
      loadMessages(conversation.id);
    }
  };

  const getParticipantName = (conversation: ConversationResponse) => {
    // Get name from participants array
    const currentUser = auth.getCurrentUser();
    if (conversation.participants && currentUser) {
      const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
      if (otherParticipant) {
        return otherParticipant.full_name || otherParticipant.email.split('@')[0];
      }
    }
    return 'Participant';
  };

  const getParticipantAvatar = (conversation: ConversationResponse) => {
    const currentUser = auth.getCurrentUser();
    if (conversation.participants && currentUser) {
      const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
      return otherParticipant?.avatar_url;
    }
    return undefined;
  };

  const filteredConversations = [...conversations]
    .sort((a, b) => {
      // Pin the currently selected conversation to the top
      if (selectedConversation) {
        const aSelected = a.id === selectedConversation.id;
        const bSelected = b.id === selectedConversation.id;
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
      }

      // Unread conversations come next (use display unread to avoid self-sent messages counting)
      const currentUser = auth.getCurrentUser();
      const aUnread = selectedConversation?.id === a.id ? 0 : getDisplayUnread(a, currentUser);
      const bUnread = selectedConversation?.id === b.id ? 0 : getDisplayUnread(b, currentUser);
      if (aUnread !== bUnread) {
        return bUnread - aUnread; // Higher unread count first
      }

      // Then sort by timestamp for read conversations
      const aTime = new Date(a.updated_at || a.created_at).getTime();
      const bTime = new Date(b.updated_at || b.created_at).getTime();
      return bTime - aTime; // Newest first
    })
    .filter((conversation) => {
      const name = getParticipantName(conversation);
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const selectedOnline = selectedConversation ? isConversationOnline(selectedConversation) : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand mx-auto mb-4" />
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] flex bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Conversations Sidebar */}
      <div className={`${selectedConversation ? 'hidden md:block' : 'block'
        } w-full md:w-80 border-r border-gray-200 flex flex-col overflow-y-auto`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start a conversation with a mentor</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const displayName = getParticipantName(conversation);
              const avatar = getParticipantAvatar(conversation);
              const lastTimestamp = conversation.updated_at || conversation.created_at;
              const lastMessagePreview = conversation.isSuggestedMentor
                ? (conversation.mentorData?.mentor_profile?.headline || 'Mentor')
                : (conversation.last_message?.content || 'No messages yet');

              const canMessage = conversation.isSuggestedMentor ? conversation.isMessageable !== false : true;
              const currentUser = auth.getCurrentUser();
              const displayUnread = selectedConversation?.id === conversation.id
                ? 0
                : getDisplayUnread(conversation, currentUser);
              const isOnline = isConversationOnline(conversation);

              return (
                <div
                  key={conversation.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedConversation?.id === conversation.id ? 'bg-brand-light/10 border-r-2 border-brand' : ''
                    } ${conversation.isSuggestedMentor ? 'opacity-75' : ''} ${!canMessage ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={avatar} alt={displayName} />
                        <AvatarFallback className="bg-brand-light/20 text-brand">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                      )}
                      {conversation.isSuggestedMentor && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                          <span className="text-white text-xs font-bold">+</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm truncate ${(conversation.unread_count || 0) > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                          }`}>
                          {displayName}
                          {conversation.isSuggestedMentor && (
                            <span className="ml-2 text-xs text-gray-500 font-normal">• Suggested</span>
                          )}
                          {isOnline && (
                            <span className="ml-2 inline-flex items-center text-[11px] font-semibold text-green-600">
                              <span className="h-2 w-2 rounded-full bg-green-500 mr-1" />
                              Online
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2">
                          {displayUnread > 0 && (
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
                              {displayUnread}
                            </span>
                          )}
                          {!conversation.isSuggestedMentor && (
                            <span className="text-xs text-gray-500">
                              <HumanDate timestamp={new Date(lastTimestamp).getTime()} />
                            </span>
                          )}
                        </div>
                      </div>
                      <p className={`text-sm truncate ${(conversation.unread_count || 0) > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                        }`}>
                        {lastMessagePreview}
                        {!canMessage && ' · Cannot message (invalid ID)'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!selectedConversation ? 'hidden md:flex' : 'flex'
        } flex-1 flex-col`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Back button for mobile */}
                  <button
                    className="md:hidden p-1 hover:bg-gray-100 rounded"
                    onClick={() => {
                      setSelectedConversation(null);
                      sessionStorage.removeItem('mentora_last_conversation');
                    }}
                    aria-label="Back to conversations"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={getParticipantAvatar(selectedConversation)}
                      alt={getParticipantName(selectedConversation)}
                    />
                    <AvatarFallback className="bg-brand-light/20 text-brand">
                      {getInitials(getParticipantName(selectedConversation))}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {getParticipantName(selectedConversation)}
                    </h3>
                    {selectedOnline && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-green-600">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Online
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-end" ref={chatScrollRef}>
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-brand" />
                </div>
              ) : selectedConversation.isSuggestedMentor ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                  <div className="mb-4">
                    <Avatar className="h-20 w-20 mx-auto mb-4">
                      <AvatarImage src={getParticipantAvatar(selectedConversation)} alt={getParticipantName(selectedConversation)} />
                      <AvatarFallback className="bg-brand-light/20 text-brand text-2xl">
                        {getInitials(getParticipantName(selectedConversation))}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {getParticipantName(selectedConversation)}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      {selectedConversation.mentorData?.mentor_profile?.headline}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.mentorData?.mentor_profile?.experience_years} years of experience
                    </p>
                  </div>
                  <p className="text-gray-500 mb-4">Start a conversation with this mentor</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto">
                  {messages.map((message) => {
                    const currentUser = auth.getCurrentUser();
                    const isYou = currentUser && message.sender_id === currentUser.id;
                    const time = new Date(message.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${isYou
                            ? 'bg-brand text-white'
                            : 'bg-gray-100 text-gray-900'
                            }`}
                        >
                          <div className="flex items-baseline gap-2">
                            <p className="text-sm">{message.content}</p>
                            {isYou && (
                              <div className="flex-shrink-0">
                                <CheckCheck
                                  className={`h-3.5 w-3.5 filter drop-shadow-[0_0_2px_rgba(0,0,0,0.35)] ${message.is_read ? 'text-green-500' : 'text-gray-300'
                                    }`}
                                />
                              </div>
                            )}
                          </div>
                          <p
                            className={`text-xs mt-1 ${isYou ? 'text-white/90' : 'text-gray-500'
                              }`}
                          >
                            {time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Scroll anchor - always at bottom */}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[40px] max-h-32 resize-none"
                    rows={1}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="bg-brand hover:bg-brand/90"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-gray-600">Choose a conversation from the sidebar to start messaging.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
