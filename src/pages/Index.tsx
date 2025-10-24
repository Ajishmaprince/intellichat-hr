import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import { DomainSelector } from "@/components/DomainSelector";
import { InterviewScore } from "@/components/InterviewScore";
import { Sparkles } from "lucide-react";

const Index = () => {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [showScore, setShowScore] = useState(false);
  
  const scoreMetrics = {
    overall: 78,
    clarity: 85,
    technical: 72,
    communication: 81,
    questionsAnswered: 5,
    timeSpent: "12 mins",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iaHNsKHZhcigtLWJvcmRlcikpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
      
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-accent animate-pulse" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              InterviewPrep AI
            </h1>
          </div>
          <p className="text-lg text-muted-foreground mb-2 max-w-2xl mx-auto">
            Master your interview skills with AI-powered coaching powered by Gemini
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            🎤 Voice enabled • 📊 Real-time scoring • 🎯 Domain-specific preparation
          </p>
        </header>

        <DomainSelector onSelect={setSelectedDomain} selectedDomain={selectedDomain} />
        
        {showScore && <InterviewScore metrics={scoreMetrics} />}

        {selectedDomain && (
          <div className="animate-slide-in">
            <ChatInterface 
              domain={selectedDomain}
              onScoreUpdate={(show) => setShowScore(show)}
            />
          </div>
        )}

        {!selectedDomain && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">
              👆 Select a domain above to start your interview practice
            </p>
          </div>
        )}

        <footer className="text-center mt-12 text-muted-foreground text-sm">
          <p>Powered by Gemini 2.5 Flash • Voice-enabled AI coaching</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
