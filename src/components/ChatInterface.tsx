import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: Message[];
}

const ChatInterface = ({ conversationId, initialMessages = [] }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const streamChat = async (messages: Message[]) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
    
    // Get the user's session token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages, conversationId }),
    });

    if (!response.ok || !response.body) {
      if (response.status === 429) {
        throw new Error('Too many requests. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI service unavailable. Please contact support.');
      }
      throw new Error('Failed to get response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let assistantContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: 'assistant', content: assistantContent }];
            });
          }
        } catch {
          // Ignore parsing errors for incomplete chunks
        }
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(newMessages);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-2xl border border-indigo-500/20">
      <div className="p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600">
        <h2 className="text-lg font-semibold text-white">Interview Coach</h2>
        <p className="text-sm text-white/90">Practice interviews and get AI-powered feedback</p>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-300 py-12">
              <p className="text-lg font-medium mb-2">👋 Welcome to InterviewPrep AI</p>
              <p className="text-sm">Tell me what role you're preparing for, and I'll conduct a mock interview with personalized feedback!</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'rounded-lg px-4 py-2 max-w-[80%] shadow-sm transition-all',
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : 'bg-slate-800/80 text-slate-100 border border-slate-700/50'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8 bg-slate-700">
                  <AvatarFallback className="bg-slate-700 text-slate-200 text-xs">
                    You
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                  AI
                </AvatarFallback>
              </Avatar>
              <div className="bg-slate-800/80 border border-slate-700/50 rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-indigo-500/20 bg-slate-900/30">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your response or question..."
            disabled={isLoading}
            className="flex-1 bg-slate-800/50 border-slate-700/50 text-slate-100 placeholder:text-slate-400"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;