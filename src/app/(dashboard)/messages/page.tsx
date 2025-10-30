'use client';

import { useState } from 'react';
import { Search, Send, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock conversation data
const mockConversations = [
  {
    id: '1',
    participant: {
      id: '1',
      name: 'Priya Sharma',
      title: 'Senior Software Engineer at Google',
      avatar: '/avatars/mentor1.jpg',
      isOnline: true,
    },
    lastMessage: {
      content: "Looking forward to our session today! I've prepared some great resources for you.",
      timestamp: '2 hours ago',
      sender: 'them',
    },
    unreadCount: 2,
    sessionId: 'session-1',
  },
  {
    id: '2',
    participant: {
      id: '2',
      name: 'Rahul Thapa',
      title: 'Senior Product Manager at Microsoft',
      avatar: '/avatars/mentor2.jpg',
      isOnline: false,
    },
    lastMessage: {
      content: 'Thanks for sharing your resume. I have some feedback to discuss.',
      timestamp: '1 day ago',
      sender: 'them',
    },
    unreadCount: 0,
    sessionId: 'session-2',
  },
  {
    id: '3',
    participant: {
      id: '3',
      name: 'Dr. Sita Rai',
      title: 'Data Scientist at Netflix',
      avatar: '/avatars/mentor3.jpg',
      isOnline: true,
    },
    lastMessage: {
      content: 'The machine learning project looks great! Let me know if you need any clarification.',
      timestamp: '3 days ago',
      sender: 'you',
    },
    unreadCount: 0,
    sessionId: 'session-3',
  },
  {
    id: '4',
    participant: {
      id: '4',
      name: 'Maya Gurung',
      title: 'UX Designer at Airbnb',
      avatar: '/avatars/mentor5.jpg',
      isOnline: false,
    },
    lastMessage: {
      content: 'The design portfolio feedback session was really helpful. Thank you!',
      timestamp: '1 week ago',
      sender: 'you',
    },
    unreadCount: 1,
    sessionId: 'session-4',
  },
];

// Mock messages for selected conversation
const mockMessages = [
  {
    id: '1',
    content: 'Hi! I\'m excited about our upcoming session on career planning.',
    timestamp: '10:30 AM',
    sender: 'you',
    type: 'text',
  },
  {
    id: '2',
    content: 'Hello! I\'m looking forward to it as well. I\'ve reviewed your background and have some great insights to share.',
    timestamp: '10:35 AM',
    sender: 'them',
    type: 'text',
  },
  {
    id: '3',
    content: 'That sounds perfect! Should I prepare anything specific for our session?',
    timestamp: '10:36 AM',
    sender: 'you',
    type: 'text',
  },
  {
    id: '4',
    content: 'Yes, if you could prepare a list of your top 3 career goals and any specific challenges you\'re facing, that would be great!',
    timestamp: '10:40 AM',
    sender: 'them',
    type: 'text',
  },
  {
    id: '5',
    content: 'I\'ve also attached a career planning worksheet that might help you organize your thoughts.',
    timestamp: '10:41 AM',
    sender: 'them',
    type: 'text',
  },
  {
    id: '6',
    content: 'Perfect! I\'ll work on that before our session. Thank you for being so prepared!',
    timestamp: '11:15 AM',
    sender: 'you',
    type: 'text',
  },
  {
    id: '7',
    content: 'Looking forward to our session today! I\'ve prepared some great resources for you.',
    timestamp: '2:20 PM',
    sender: 'them',
    type: 'text',
  },
];

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // In a real app, this would send the message via API
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  const filteredConversations = mockConversations.filter(conversation =>
    conversation.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversation.id === conversation.id ? 'bg-teal-50 border-r-2 border-teal-600' : ''
              }`}
              onClick={() => setSelectedConversation(conversation)}
            >
              <div className="flex items-start space-x-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.participant.avatar} alt={conversation.participant.name} />
                    <AvatarFallback className="bg-teal-100 text-teal-700">
                      {getInitials(conversation.participant.name)}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.participant.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {conversation.participant.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">{conversation.lastMessage.timestamp}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-1 truncate">
                    {conversation.participant.title}
                  </p>
                  <p className={`text-sm truncate ${
                    conversation.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
                  }`}>
                    {conversation.lastMessage.sender === 'you' ? 'You: ' : ''}
                    {conversation.lastMessage.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
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
                      <AvatarImage src={selectedConversation.participant.avatar} alt={selectedConversation.participant.name} />
                      <AvatarFallback className="bg-teal-100 text-teal-700">
                        {getInitials(selectedConversation.participant.name)}
                      </AvatarFallback>
                    </Avatar>
                    {selectedConversation.participant.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedConversation.participant.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedConversation.participant.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
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
              {mockMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'you' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.sender === 'you'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === 'you' ? 'text-teal-100' : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end space-x-2">
                <Button variant="ghost" size="sm">
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
