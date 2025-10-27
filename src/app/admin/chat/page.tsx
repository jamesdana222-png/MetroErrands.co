'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Search, User, Phone, Video, MoreHorizontal, Paperclip, Smile } from 'lucide-react';

type Contact = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  lastSeen: string;
  status: 'online' | 'offline' | 'away';
  unreadCount?: number;
  lastMessage?: string;
};

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  read: boolean;
};

export default function ChatPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load contacts - real employees from the system
  useEffect(() => {
    const [isLoading, setIsLoading] = useState(true);
    
    const loadEmployees = async () => {
      try {
        setIsLoading(true);
        
        // Fetch real employees from Supabase
        const { data: employees, error } = await supabase
          .from('users')
          .select('id, name, role, last_seen')
          .eq('role', 'employee');
          
        if (error) throw error;
        
        // Create contact list with group chat first
        const employeeContacts: Contact[] = [
          {
            id: 'group',
            name: 'Team Chat',
            role: 'Group',
            lastSeen: new Date().toISOString(),
            status: 'online',
            unreadCount: 0,
            lastMessage: 'Welcome to the team chat!'
          },
          ...(employees || []).map(emp => ({
            id: emp.id,
            name: emp.name,
            role: emp.role,
            lastSeen: emp.last_seen || new Date().toISOString(),
            status: 'online' as const,
            unreadCount: 0,
            lastMessage: ''
          }))
        ];
        
        setContacts(employeeContacts);
        
        // Set group chat as selected by default
        if (employeeContacts.length > 0 && !selectedContact) {
          setSelectedContact(employeeContacts[0]);
        }
      } catch (error) {
        console.error('Error loading employees:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEmployees();
    
    // Subscribe to presence updates for online status
    const presenceSubscription = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        // Update online status based on presence state
        // This would be implemented with actual presence tracking
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(presenceSubscription);
    };
  }, []);

  // Load messages when selected contact changes
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  useEffect(() => {
    if (!selectedContact) return;
    
    let messageSubscription: any;
    
    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        
        // Fetch messages from Supabase
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`receiver_id.eq.${selectedContact.id},sender_id.eq.${selectedContact.id}`)
          .order('timestamp', { ascending: true });
          
        if (error) throw error;
        
        // If no messages found, initialize with a welcome message for group chats
        if ((!data || data.length === 0) && selectedContact.id === 'group') {
          const welcomeMessage = {
            id: `welcome-${Date.now()}`,
            sender_id: 'system',
            receiver_id: 'group',
            content: 'Welcome to the team chat! This is a group conversation between admin and all employees.',
            timestamp: new Date().toISOString(),
            read: true
          };
          
          // Insert welcome message into Supabase
          const { error: insertError } = await supabase
            .from('messages')
            .insert([welcomeMessage]);
            
          if (insertError) throw insertError;
          
          setMessages([welcomeMessage]);
        } else {
          setMessages(data || []);
        }
        
        // Mark messages as read
        const unreadMessages = (data || []).filter(msg => 
          msg.receiver_id === 'admin' && !msg.read
        );
        
        if (unreadMessages.length > 0) {
          const { error: updateError } = await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadMessages.map(msg => msg.id));
            
          if (updateError) throw updateError;
          
          // Update contacts state
          const updatedContacts = contacts.map(contact => 
            contact.id === selectedContact.id 
              ? { ...contact, unreadCount: 0 }
              : contact
          );
          setContacts(updatedContacts);
        }
        
        // Subscribe to new messages for this contact
        messageSubscription = supabase
          .channel(`messages:${selectedContact.id}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${selectedContact.id}` 
          }, (payload) => {
            // Add new message to state
            setMessages(prevMessages => [...prevMessages, payload.new as Message]);
          })
          .subscribe();
          
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    loadMessages();
    
    // Scroll to bottom after messages load
    const scrollTimeout = setTimeout(scrollToBottom, 100);
    
    // Clean up on unmount
    return () => {
      clearTimeout(scrollTimeout);
      if (messageSubscription) {
        supabase.removeChannel(messageSubscription);
      }
    };
  }, [selectedContact, contacts]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send a new message
  const sendMessage = async () => {
    try {
      // Validate inputs
      if (newMessage.trim() === '') {
        return; // Don't send empty messages
      }
      
      if (!selectedContact || !selectedContact.id) {
        console.error('No chat selected');
        return;
      }

      // Sanitize message content to prevent XSS
      const sanitizedMessage = newMessage
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      // Create new message object
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        sender_id: 'admin', // Admin is the sender
        receiver_id: selectedContact.id,
        content: sanitizedMessage,
        timestamp: new Date().toISOString(),
        read: true
      };
      
      // Send message to Supabase
      const { error } = await supabase
        .from('messages')
        .insert([newMsg]);
        
      if (error) throw error;
      
      // Update state with new message (optimistic update)
      setMessages(prevMessages => [...prevMessages, newMsg]);
      setNewMessage('');
      
      // Update the last message in contacts
      const updatedContacts = contacts.map(contact => 
        contact.id === selectedContact.id 
          ? { 
              ...contact, 
              lastMessage: sanitizedMessage.substring(0, 30) + (sanitizedMessage.length > 30 ? '...' : ''), 
              lastSeen: new Date().toISOString() 
            }
          : contact
      );
      setContacts(updatedContacts);
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error toast
      alert('Failed to send message. Please try again.');
    }
  };

  // Filter contacts by search term
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for message groups
  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden">
      {/* Contacts sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 rounded-l-xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Messages</h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search contacts..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map(contact => (
            <div
              key={contact.id}
              className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                selectedContact?.id === contact.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
              }`}
              onClick={() => setSelectedContact(contact)}
            >
              <div className="flex items-start">
                <div className="relative flex-shrink-0">
                  <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${
                    contact.status === 'online' ? 'bg-green-500' : 
                    contact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(contact.lastSeen).toLocaleDateString([], { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{contact.role}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-40">
                      {contact.lastMessage}
                    </p>
                    {contact.unreadCount && contact.unreadCount > 0 ? (
                      <span className="bg-primary-600 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                        {contact.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-r-xl">
        {selectedContact ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center">
                <div className="relative">
                  <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-800 ${
                    selectedContact.status === 'online' ? 'bg-green-500' : 
                    selectedContact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{selectedContact.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedContact.status === 'online' ? 'Online' : 
                     selectedContact.status === 'away' ? 'Away' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                  <Phone className="h-5 w-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                  <Video className="h-5 w-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
              {isLoadingMessages ? (
                <div className="h-full flex items-center justify-center">
                  <div className="space-y-4 w-full max-w-md">
                    <div className="bg-gray-200 dark:bg-gray-700 h-10 w-24 rounded-full mx-auto animate-pulse"></div>
                    <div className="flex justify-start">
                      <div className="bg-gray-200 dark:bg-gray-700 h-16 w-2/3 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-primary-200 dark:bg-primary-900/30 h-12 w-1/2 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-gray-200 dark:bg-gray-700 h-14 w-3/4 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {/* Group messages by date */}
                  {(() => {
                    const messagesByDate: { [date: string]: Message[] } = {};
                    
                    messages.forEach(message => {
                      const date = formatMessageDate(message.timestamp);
                      if (!messagesByDate[date]) {
                        messagesByDate[date] = [];
                      }
                      messagesByDate[date].push(message);
                    });
                    
                    return Object.entries(messagesByDate).map(([date, dateMessages]) => (
                      <div key={date}>
                        <div className="flex justify-center my-4">
                          <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                            {date}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {dateMessages.map(message => (
                            <div 
                              key={message.id} 
                              className={`flex ${message.sender_id === 'current-user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div 
                                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                                  message.sender_id === 'current-user'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <div 
                                  className={`text-xs mt-1 flex justify-end ${
                                    message.sender_id === 'current-user'
                                      ? 'text-primary-100'
                                      : 'text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  {formatTime(message.timestamp)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-2">No messages yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Send a message to start the conversation</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Message input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 mx-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                  <Smile className="h-5 w-5" />
                </button>
                <button 
                  className="ml-2 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-colors"
                  onClick={sendMessage}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Send className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No conversation selected</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Choose a contact to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}