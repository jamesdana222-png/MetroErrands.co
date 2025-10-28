'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Send, Phone, Video, MoreVertical, ChevronDown, User, Clock, MessageSquare } from 'lucide-react';

// Mock data for contacts
const MOCK_CONTACTS = [
  {
    id: 1,
    name: 'Admin Support',
    avatar: '/avatars/admin.png',
    role: 'Admin',
    status: 'online',
    lastMessage: 'Please update your location when you arrive',
    timestamp: '10:30 AM'
  },
  {
    id: 2,
    name: 'John Manager',
    avatar: '/avatars/john.png',
    role: 'Manager',
    status: 'online',
    lastMessage: 'How is the delivery going?',
    timestamp: '09:45 AM'
  },
  {
    id: 3,
    name: 'Sarah Coordinator',
    avatar: '/avatars/sarah.png',
    role: 'Coordinator',
    status: 'away',
    lastMessage: 'New errand assigned for tomorrow',
    timestamp: 'Yesterday'
  },
  {
    id: 4,
    name: 'Tech Support',
    avatar: '/avatars/tech.png',
    role: 'Support',
    status: 'offline',
    lastMessage: 'Your app has been updated',
    timestamp: 'Yesterday'
  },
  {
    id: 5,
    name: 'Team Chat',
    avatar: '/avatars/team.png',
    role: 'Group',
    status: 'online',
    lastMessage: 'Mike: Does anyone have extra supplies?',
    timestamp: '2 days ago'
  }
];

// Mock data for messages
const MOCK_MESSAGES = {
  1: [
    {
      id: 1,
      sender: 'Admin Support',
      senderId: 1,
      content: 'Good morning! How are you today?',
      timestamp: '2023-07-10T09:30:00',
      isRead: true
    },
    {
      id: 2,
      sender: 'Me',
      senderId: 'me',
      content: 'Good morning! I\'m doing well, thanks for asking.',
      timestamp: '2023-07-10T09:32:00',
      isRead: true
    },
    {
      id: 3,
      sender: 'Admin Support',
      senderId: 1,
      content: 'Great to hear! Just a reminder that you have 3 errands scheduled for today.',
      timestamp: '2023-07-10T09:33:00',
      isRead: true
    },
    {
      id: 4,
      sender: 'Admin Support',
      senderId: 1,
      content: 'Please update your location when you arrive at each destination.',
      timestamp: '2023-07-10T09:33:30',
      isRead: true
    },
    {
      id: 5,
      sender: 'Me',
      senderId: 'me',
      content: 'Will do! I\'m heading to my first location now.',
      timestamp: '2023-07-10T09:35:00',
      isRead: true
    },
    {
      id: 6,
      sender: 'Admin Support',
      senderId: 1,
      content: 'Perfect! Let me know if you need any assistance.',
      timestamp: '2023-07-10T09:36:00',
      isRead: true
    },
    {
      id: 7,
      sender: 'Admin Support',
      senderId: 1,
      content: 'Also, there\'s a team meeting scheduled for tomorrow at 9 AM. Will you be able to attend?',
      timestamp: '2023-07-10T10:15:00',
      isRead: true
    },
    {
      id: 8,
      sender: 'Me',
      senderId: 'me',
      content: 'Yes, I\'ll be there. Is it in-person or virtual?',
      timestamp: '2023-07-10T10:20:00',
      isRead: true
    },
    {
      id: 9,
      sender: 'Admin Support',
      senderId: 1,
      content: 'It will be virtual. I\'ll send you the meeting link shortly.',
      timestamp: '2023-07-10T10:25:00',
      isRead: true
    },
    {
      id: 10,
      sender: 'Admin Support',
      senderId: 1,
      content: 'Please update your location when you arrive',
      timestamp: '2023-07-10T10:30:00',
      isRead: false
    }
  ],
  2: [
    {
      id: 1,
      sender: 'John Manager',
      senderId: 2,
      content: 'Hi there! How is your day going?',
      timestamp: '2023-07-10T08:30:00',
      isRead: true
    },
    {
      id: 2,
      sender: 'Me',
      senderId: 'me',
      content: 'Hi John! It\'s going well, just started my shift.',
      timestamp: '2023-07-10T08:35:00',
      isRead: true
    },
    {
      id: 3,
      sender: 'John Manager',
      senderId: 2,
      content: 'Great! I wanted to check in on the Smith delivery from yesterday. Did everything go smoothly?',
      timestamp: '2023-07-10T08:40:00',
      isRead: true
    },
    {
      id: 4,
      sender: 'Me',
      senderId: 'me',
      content: 'Yes, it went well. The customer was very satisfied with the service.',
      timestamp: '2023-07-10T08:45:00',
      isRead: true
    },
    {
      id: 5,
      sender: 'John Manager',
      senderId: 2,
      content: 'Excellent! That\'s what I like to hear.',
      timestamp: '2023-07-10T08:50:00',
      isRead: true
    },
    {
      id: 6,
      sender: 'John Manager',
      senderId: 2,
      content: 'How is the delivery going?',
      timestamp: '2023-07-10T09:45:00',
      isRead: false
    }
  ]
};

// Helper function to group messages by date
const groupMessagesByDate = (messages: any[]) => {
  const groups: Record<string, any[]> = {};
  
  messages.forEach(message => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });
  
  return Object.entries(groups).map(([date, messages]) => ({
    date,
    messages
  }));
};

export default function EmployeeChat() {
  const [contacts, setContacts] = useState(MOCK_CONTACTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate API call to fetch contacts
    setTimeout(() => {
      setLoading(false);
      // Select first contact by default
      if (MOCK_CONTACTS.length > 0) {
        handleSelectContact(MOCK_CONTACTS[0]);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    // Scroll to bottom of messages
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSelectContact = (contact: any) => {
    setSelectedContact(contact);
    // Fetch messages for selected contact
    setMessages(MOCK_MESSAGES[contact.id as keyof typeof MOCK_MESSAGES] || []);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedContact) return;
    
    const newMsg = {
      id: messages.length + 1,
      sender: 'Me',
      senderId: 'me',
      content: newMessage,
      timestamp: new Date().toISOString(),
      isRead: true
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // Simulate response after 1 second
    setTimeout(() => {
      const responseMsg = {
        id: messages.length + 2,
        sender: selectedContact.name,
        senderId: selectedContact.id,
        content: 'Thanks for the update!',
        timestamp: new Date().toISOString(),
        isRead: false
      };
      
      setMessages(prevMessages => [...prevMessages, responseMsg]);
    }, 1000);
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Contacts Sidebar */}
      <div className="w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500 dark:text-gray-400">No contacts found</p>
            </div>
          ) : (
            <ul>
              {filteredContacts.map((contact) => (
                <li 
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 ${
                    selectedContact?.id === contact.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="relative flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300">
                        {contact.name.charAt(0)}
                      </div>
                      <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${
                        contact.status === 'online' ? 'bg-green-500' : 
                        contact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></span>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{contact.timestamp}</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{contact.lastMessage}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Chat Area */}
      {selectedContact ? (
        <div className="hidden md:flex flex-1 flex-col bg-gray-50 dark:bg-gray-900">
          {/* Chat Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300">
                    {selectedContact.name.charAt(0)}
                  </div>
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${
                    selectedContact.status === 'online' ? 'bg-green-500' : 
                    selectedContact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{selectedContact.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedContact.status}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Phone className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Video className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <MoreVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {new Date(group.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
                
                {group.messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex mb-4 ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.senderId !== 'me' && (
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 mr-2">
                        {message.sender.charAt(0)}
                      </div>
                    )}
                    
                    <div className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl ${
                      message.senderId === 'me' 
                        ? 'bg-primary-500 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg' 
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-lg rounded-tr-lg rounded-br-lg shadow-sm'
                    } px-4 py-2 relative`}>
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs text-gray-300 dark:text-gray-500 absolute bottom-1 right-2">
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                    
                    {message.senderId === 'me' && (
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 ml-2">
                        M
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <form onSubmit={handleSendMessage} className="flex items-center">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button 
                type="submit"
                className="ml-2 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={!newMessage.trim()}
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Select a conversation</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose a contact from the list to start chatting</p>
          </div>
        </div>
      )}
      
      {/* Mobile Chat View */}
      <div className="md:hidden flex flex-1 flex-col bg-gray-50 dark:bg-gray-900">
        {selectedContact ? (
          <>
            {/* Mobile Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setSelectedContact(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
                
                <div className="flex items-center">
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300">
                      {selectedContact.name.charAt(0)}
                    </div>
                    <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white dark:border-gray-800 ${
                      selectedContact.status === 'online' ? 'bg-green-500' : 
                      selectedContact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}></span>
                  </div>
                  <div className="ml-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{selectedContact.name}</h3>
                  </div>
                </div>
                
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <MoreVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Mobile Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {groupedMessages.map((group, groupIndex) => (
                <div key={groupIndex} className="mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {new Date(group.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  {group.messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex mb-4 ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.senderId !== 'me' && (
                        <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 mr-2">
                          {message.sender.charAt(0)}
                        </div>
                      )}
                      
                      <div className={`max-w-[75%] ${
                        message.senderId === 'me' 
                          ? 'bg-primary-500 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg' 
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-lg rounded-tr-lg rounded-br-lg shadow-sm'
                      } px-3 py-2 relative`}>
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs text-gray-300 dark:text-gray-500 absolute bottom-1 right-2">
                          {formatMessageTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Mobile Message Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
              <form onSubmit={handleSendMessage} className="flex items-center">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  className="ml-2 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Messages</h2>
            
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            
            <ul className="space-y-2">
              {filteredContacts.map((contact) => (
                <li 
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer"
                >
                  <div className="flex items-start">
                    <div className="relative flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300">
                        {contact.name.charAt(0)}
                      </div>
                      <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${
                        contact.status === 'online' ? 'bg-green-500' : 
                        contact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></span>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{contact.timestamp}</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{contact.lastMessage}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
