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
    const { messages, conversationId } = await req.json();
    console.log('Received chat request with', messages.length, 'messages');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create system prompt for interview coaching
    const systemPrompt = `You are an expert Interview Coach AI powered by Gemini. Your role is to help users prepare for job interviews by:

1. **Conducting Mock Interviews**: 
   - Ask relevant interview questions based on the role and industry they mention
   - Follow up with deeper questions based on their answers
   - Ask 3-5 questions per mock interview session

2. **Providing Constructive Feedback**: 
   After each answer, give specific, actionable feedback on:
   - Content quality and relevance
   - Communication style and clarity  
   - Use of examples and specifics
   - Areas for improvement with concrete suggestions
   - Strengths to highlight and build upon

3. **Interview Techniques**:
   - Teach and apply the STAR method (Situation, Task, Action, Result)
   - Help structure answers effectively
   - Suggest better phrasing and word choices
   - Provide industry-specific interview strategies

4. **Question Types**:
   - Behavioral questions (Tell me about a time...)
   - Technical questions (role-specific)
   - Situational questions (What would you do if...)
   - Strengths/weaknesses questions
   - Motivation and culture fit questions

5. **Being Supportive**: 
   - Maintain an encouraging, professional tone
   - Be honest about areas to improve while staying motivating
   - Celebrate good answers and highlight what worked well
   - Build confidence while pushing for excellence

**Interaction Flow**:
- Start by asking what role/company they're preparing for
- Understand their experience level
- Conduct realistic mock interviews
- After EACH response, provide detailed feedback before next question
- Offer tips on body language, tone, and presentation
- End sessions with an overall assessment and action items

Keep responses clear, actionable, and motivating. Format feedback with bullet points for clarity.`;

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
          { role: 'system', content: systemPrompt },
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