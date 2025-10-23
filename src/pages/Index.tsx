import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import ChatInterface from '@/components/ChatInterface';
import { LogOut, Briefcase, Target, Award, MessageSquare } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      } else {
        navigate('/auth');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-12">
          <div className="flex justify-end mb-6">
            <Button 
              variant="ghost" 
              onClick={handleSignOut} 
              className="gap-2 text-slate-300 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
          
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              InterviewPrep AI
            </h1>
          </div>
          <p className="text-slate-300 text-lg mb-2">
            AI-powered interview coach powered by Gemini for career success
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Button 
              variant="outline" 
              className="bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/50"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Technical Roles
            </Button>
            <Button 
              variant="outline"
              className="bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50"
            >
              <Target className="h-4 w-4 mr-2" />
              Behavioral Questions
            </Button>
            <Button 
              variant="outline"
              className="bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50"
            >
              <Award className="h-4 w-4 mr-2" />
              Leadership Interviews
            </Button>
          </div>
        </header>

        <div className="h-[calc(100vh-340px)] max-h-[650px]">
          <ChatInterface />
        </div>

        <footer className="text-center mt-8 text-slate-400 text-sm">
          <p>Empowering Careers • Building Confidence • Achieving Success</p>
          <p className="text-slate-500 text-xs mt-2">Powered by Gemini API</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
