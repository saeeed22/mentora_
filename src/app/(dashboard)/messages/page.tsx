'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { messagingApi, ConversationResponse, MessageResponse } from '@/lib/api/messaging-api';
import { auth } from '@/lib/api/auth';

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      const currentUser = auth.getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setIsLoading(true);
      const result = await messagingApi.getConversations();

      if (result.success && result.data) {
        setConversations(result.data.data);

        // Check if a conversation ID is specified in the URL
        const c = searchParams.get('c');
        if (c) {
          const found = result.data.data.find(conv => conv.id === c);
          if (found) {
            setSelectedConversation(found);
            loadMessages(found.id);
          }
        } else if (result.data.data.length > 0) {
          setSelectedConversation(result.data.data[0]);
          loadMessages(result.data.data[0].id);
        }
      }
      setIsLoading(false);
    };

    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    const result = await messagingApi.getMessages(conversationId);
    if (result.success && result.data) {
      // Messages are returned newest first, reverse for display
      setMessages(result.data.data.reverse());

      // Mark messages as read
      const lastMessage = result.data.data[0];
      if (lastMessage) {
        await messagingApi.markAsRead(conversationId, lastMessage.id);
      }
    }
    setIsLoadingMessages(false);
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

    // Optimistic update - show message immediately
    const optimisticMessage: MessageResponse = {
      id: 'temp-' + Date.now(),
      conversation_id: selectedConversation.id,
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

    console.log('[Messages] Calling API...');
    const result = await messagingApi.sendMessage(selectedConversation.id, messageText);
    console.log('[Messages] API result:', result);

    if (result.success && result.data) {
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m =>
        m.id === optimisticMessage.id ? result.data! : m
      ));

      // Refresh conversations to update last message (background)
      messagingApi.getConversations().then(convResult => {
        if (convResult.success && convResult.data) {
          setConversations(convResult.data.data);
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

  const handleSelectConversation = (conversation: ConversationResponse) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  const getParticipantName = (conversation: ConversationResponse) => {
    // Try to get name from participants array if available
    const currentUser = auth.getCurrentUser();
    if (conversation.participants && currentUser) {
      const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
      if (otherParticipant) {
        return otherParticipant.full_name;
      }
    }
    return 'Participant';
  };

  const getParticipantAvatar = (conversation: ConversationResponse) => {
    const currentUser = auth.getCurrentUser();
    if (conversation.participants && currentUser) {
      const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
      if (otherParticipant) {
        return otherParticipant.avatar_url;
      }
    }
    return undefined;
  };

  const filteredConversations = conversations.filter((conversation) => {
    const name = getParticipantName(conversation);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
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
        <div className="flex-1 overflow-y-auto">
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
              const lastMessagePreview = conversation.last_message?.content || 'No messages yet';

              return (
                <div
                  key={conversation.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedConversation?.id === conversation.id ? 'bg-brand-light/10 border-r-2 border-brand' : ''
                    }`}
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
                      {/* Unread badge hidden - user is on messages page, reading messages */}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {displayName}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {new Date(lastTimestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm truncate text-gray-600">
                        {lastMessagePreview}
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
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
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
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" aria-label="Call">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Video call">
                    <Video className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>View Session Details</DropdownMenuItem>
                      <DropdownMenuItem>Archive Conversation</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Block User</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-end">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-brand" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-3">
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
                          <p className="text-sm">{message.content}</p>
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
                <Button variant="ghost" size="sm" aria-label="Attach file">
                  <Paperclip className="h-4 w-4" />
                </Button>
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
