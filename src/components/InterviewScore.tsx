import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Award, MessageSquare, Clock } from 'lucide-react';

interface ScoreMetrics {
  overall: number;
  clarity: number;
  technical: number;
  communication: number;
  questionsAnswered: number;
  timeSpent: string;
}

interface InterviewScoreProps {
  metrics: ScoreMetrics;
}

export const InterviewScore = ({ metrics }: InterviewScoreProps) => {
  return (
    <Card className="p-6 mb-6 bg-gradient-to-br from-card to-accent/5 border-accent/20 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Award className="h-5 w-5 text-accent" />
        <h3 className="font-semibold text-lg">Interview Performance</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Overall Score</span>
            <span className="text-2xl font-bold text-accent animate-pulse-glow">
              {metrics.overall}%
            </span>
          </div>
          <Progress value={metrics.overall} className="h-2 mb-4" />
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Clarity</span>
                <span className="font-medium">{metrics.clarity}%</span>
              </div>
              <Progress value={metrics.clarity} className="h-1.5" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Technical Depth</span>
                <span className="font-medium">{metrics.technical}%</span>
              </div>
              <Progress value={metrics.technical} className="h-1.5" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Communication</span>
                <span className="font-medium">{metrics.communication}%</span>
              </div>
              <Progress value={metrics.communication} className="h-1.5" />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Questions Answered</p>
              <p className="text-xl font-semibold">{metrics.questionsAnswered}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Session Duration</p>
              <p className="text-xl font-semibold">{metrics.timeSpent}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <TrendingUp className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-medium">Keep practicing!</p>
              <p className="text-xs text-muted-foreground">You're improving steadily</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
