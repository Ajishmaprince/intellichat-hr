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

    // Create Supabase client to fetch employee data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Authenticated user:', user.id);

    // Get employee data
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (employeeError || !employee) {
      console.error('Employee fetch error:', employeeError);
      throw new Error('Employee not found');
    }

    console.log('Found employee:', employee.employee_id);

    // Fetch employee's leave records
    const { data: leaveRecords } = await supabase
      .from('leave_records')
      .select('*')
      .eq('employee_id', employee.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch employee's payroll info
    const { data: payrollInfo } = await supabase
      .from('payroll_info')
      .select('*')
      .eq('employee_id', employee.id)
      .order('payment_date', { ascending: false })
      .limit(5);

    console.log('Fetched', leaveRecords?.length || 0, 'leave records and', payrollInfo?.length || 0, 'payroll records');

    // Calculate leave balance
    const totalLeaveDays = 25; // Annual leave allowance
    const usedLeaveDays = leaveRecords?.reduce((sum, record) => {
      return record.status === 'approved' ? sum + record.days_count : sum;
    }, 0) || 0;
    const remainingLeave = totalLeaveDays - usedLeaveDays;

    // Create system prompt with employee context
    const systemPrompt = `You are an HR assistant chatbot for the company. You help employees with questions about payroll, leave, and company policies.

Current Employee Information:
- Name: ${employee.full_name}
- Employee ID: ${employee.employee_id}
- Department: ${employee.department}
- Position: ${employee.position}
- Email: ${employee.email}
- Join Date: ${employee.join_date}

Leave Balance:
- Total Annual Leave: ${totalLeaveDays} days
- Used Leave: ${usedLeaveDays} days
- Remaining Leave: ${remainingLeave} days

Recent Leave Records:
${leaveRecords?.slice(0, 3).map(lr => 
  `- ${lr.leave_type}: ${lr.start_date} to ${lr.end_date} (${lr.days_count} days, ${lr.status})`
).join('\n') || 'No leave records'}

Recent Payroll Information:
${payrollInfo?.slice(0, 2).map(pi => 
  `- Payment Date: ${pi.payment_date}, Net Amount: $${pi.net_amount} (${pi.status})`
).join('\n') || 'No payroll records'}

Company Policies:
- Annual Leave: 25 days per year
- Sick Leave: 10 days per year (separate from annual leave)
- Payroll: Processed on the 25th of each month
- Leave Requests: Submit at least 2 weeks in advance
- Working Hours: Monday-Friday, 9 AM - 5 PM

Guidelines:
- Be professional, helpful, and concise
- Provide specific information based on the employee's data
- For policy questions, refer to the company policies above
- If you don't have specific data, explain what you can access
- Format numbers clearly (use currency symbols for money)
- Use friendly but professional tone`;

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