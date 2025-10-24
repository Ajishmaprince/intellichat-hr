import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, domain } = await req.json();
    console.log('Received chat request with', messages.length, 'messages for domain:', domain);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create system prompt based on domain
    const domainPrompts = {
      technical: `You are an expert Technical Interview Coach. Focus on:
- Coding problems (arrays, strings, trees, graphs, dynamic programming)
- System design (scalability, databases, caching, microservices)
- Data structures and algorithms
- Time/space complexity analysis
- Best practices and code optimization
Ask 1-2 focused questions at a time. Give specific, actionable feedback on their technical approach.`,
      
      behavioral: `You are an expert Behavioral Interview Coach. Focus on:
- STAR method (Situation, Task, Action, Result)
- Leadership and teamwork scenarios
- Conflict resolution
- Project management experiences
- Communication and interpersonal skills
Guide them to structure answers clearly. Provide feedback on storytelling and impact demonstration.`,
      
      product: `You are an expert Product Management Interview Coach. Focus on:
- Product sense and strategy
- Metrics and analytics
- User research and design thinking
- Prioritization frameworks
- Go-to-market strategy
Ask thoughtful product scenarios. Give feedback on structured thinking and user-centric approach.`,
      
      sales: `You are an expert Sales & Marketing Interview Coach. Focus on:
- Customer discovery and needs analysis
- Sales methodology (SPIN, Challenger)
- Pipeline management
- Objection handling
- Growth strategies and metrics
Practice realistic sales scenarios. Provide feedback on persuasion, empathy, and business acumen.`
    };

    const systemPrompt = domainPrompts[domain as keyof typeof domainPrompts] || domainPrompts.technical;
    
    const fullSystemPrompt = `${systemPrompt}

**Interview Coaching Guidelines:**

- Ask ONE question at a time
- After their answer, provide constructive feedback highlighting:
  ✓ What they did well
  ✗ Areas to improve with specific examples
  💡 Better phrasing suggestions
- Keep responses concise (2-3 paragraphs max)
- Be encouraging but honest
- Score their answers mentally (you'll see their progress tracked)
- Use emojis sparingly for emphasis

After 3-4 questions, provide a brief summary of strengths and growth areas.`;

    console.log('Calling Lovable AI Gateway...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: fullSystemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits exhausted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI Gateway error');
    }

    console.log('Streaming response from AI Gateway');

    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});