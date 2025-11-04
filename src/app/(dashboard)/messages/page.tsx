'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Send, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';
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

import { messaging } from '@/lib/api/messages';
import { auth } from '@/lib/api/auth';
import { mentors } from '@/lib/api/mentors';
import { mockUsers } from '@/lib/mock-auth';
import type { Conversation, Message } from '@/lib/types';

// data now comes from messaging service

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    const convs = messaging.listConversationsByUser(currentUser.id);
    setConversations(convs);

    const c = searchParams.get('c');
    if (c) {
      const found = messaging.getConversationById(c);
      if (found) {
        setSelectedConversation(found);
        setMessages(messaging.listMessages(found.id));
        return;
      }
    }
    if (convs.length > 0) {
      setSelectedConversation(convs[0]);
      setMessages(messaging.listMessages(convs[0].id));
    }
  }, [router, searchParams]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    const currentUser = auth.getCurrentUser();
    if (!currentUser) return;
    messaging.sendMessage(selectedConversation.id, currentUser.id, newMessage.trim());
    setMessages(messaging.listMessages(selectedConversation.id));
    setNewMessage('');
    setConversations(messaging.listConversationsByUser(currentUser.id));
  };

  const filteredConversations = conversations.filter((conversation) => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) return false;
    const isMentor = currentUser.id === conversation.mentorId;
    const other = isMentor ? mockUsers.find(u => u.id === conversation.menteeId) : mentors.getById(conversation.mentorId);
    const displayName = other?.name || 'Unknown';
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
          {filteredConversations.map((conversation) => {
            const currentUser = auth.getCurrentUser();
            const isMentor = currentUser && currentUser.id === conversation.mentorId;
            const other = isMentor ? mockUsers.find(u => u.id === conversation.menteeId) : mentors.getById(conversation.mentorId);
            const displayName = other?.name || 'Unknown';
            const title = isMentor ? (other?.title || 'Mentee') : (other?.title || 'Mentor');
            const avatar = other && 'avatar' in other ? other.avatar : undefined;
            const lastTimestamp = conversation.lastMessageAt || conversation.createdAt;
            return (
            <div
              key={conversation.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversation?.id === conversation.id ? 'bg-teal-50 border-r-2 border-teal-600' : ''
              }`}
              onClick={() => {
                setSelectedConversation(conversation);
                setMessages(messaging.listMessages(conversation.id));
              }}
            >
              <div className="flex items-start space-x-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={avatar} alt={displayName} />
                    <AvatarFallback className="bg-teal-100 text-teal-700">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {displayName}
                    </h3>
                    <span className="text-xs text-gray-500">{new Date(lastTimestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1 truncate">
                    {title}
                  </p>
                  <p className="text-sm truncate text-gray-600">
                    Conversation started
                  </p>
                </div>
              </div>
            </div>
          );})}
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
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      {(() => {
                        const currentUser = auth.getCurrentUser();
                        const isMentor = currentUser && currentUser.id === selectedConversation.mentorId;
                        const other = isMentor ? mockUsers.find(u => u.id === selectedConversation.menteeId) : mentors.getById(selectedConversation.mentorId);
                        const avatar = other && 'avatar' in other ? other.avatar : undefined;
                        const name = other?.name || 'Participant';
                        return <>
                          <AvatarImage src={avatar} alt={name} />
                          <AvatarFallback className="bg-teal-100 text-teal-700">{getInitials(name)}</AvatarFallback>
                        </>;
                      })()}
                    </Avatar>
                  </div>
                  <div>
                    {(() => {
                      const currentUser = auth.getCurrentUser();
                      const isMentor = currentUser && currentUser.id === selectedConversation.mentorId;
                      const other = isMentor ? mockUsers.find(u => u.id === selectedConversation.menteeId) : mentors.getById(selectedConversation.mentorId);
                      const name = other?.name || 'Participant';
                      return <h3 className="font-medium text-gray-900">{name}</h3>;
                    })()}
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const currentUser = auth.getCurrentUser();
                const isYou = currentUser && message.senderUserId === currentUser.id;
                const time = new Date(message.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                return (
                <div
                  key={message.id}
                  className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isYou
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isYou ? 'text-teal-100' : 'text-gray-500'
                      }`}
                    >
                      {time}
                    </p>
                  </div>
                </div>
              );})}
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
                  disabled={!newMessage.trim()}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="h-4 w-4" />
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
