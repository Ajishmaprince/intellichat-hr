-- Create employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  employee_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leave_records table
CREATE TABLE public.leave_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payroll_info table
CREATE TABLE public.payroll_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  payment_date DATE NOT NULL,
  gross_amount DECIMAL(10, 2) NOT NULL,
  net_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_conversations table
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees
CREATE POLICY "Employees can view their own data"
  ON public.employees FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for leave_records
CREATE POLICY "Employees can view their own leave records"
  ON public.leave_records FOR SELECT
  USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can create their own leave records"
  ON public.leave_records FOR INSERT
  WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- RLS Policies for payroll_info
CREATE POLICY "Employees can view their own payroll info"
  ON public.payroll_info FOR SELECT
  USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- RLS Policies for chat_conversations
CREATE POLICY "Employees can view their own conversations"
  ON public.chat_conversations FOR SELECT
  USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can create their own conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can update their own conversations"
  ON public.chat_conversations FOR UPDATE
  USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- RLS Policies for chat_messages
CREATE POLICY "Employees can view their conversation messages"
  ON public.chat_messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM public.chat_conversations 
    WHERE employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  ));

CREATE POLICY "Employees can create messages in their conversations"
  ON public.chat_messages FOR INSERT
  WITH CHECK (conversation_id IN (
    SELECT id FROM public.chat_conversations 
    WHERE employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  ));

-- Create function to auto-create employee profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.employees (user_id, employee_id, full_name, email, department, position)
  VALUES (
    NEW.id,
    'EMP' || LPAD((SELECT COUNT(*) + 1 FROM public.employees)::TEXT, 6, '0'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Employee'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'department', 'General'),
    COALESCE(NEW.raw_user_meta_data->>'position', 'Employee')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create update timestamp function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add update triggers
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_leave_records_updated_at BEFORE UPDATE ON public.leave_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_payroll_info_updated_at BEFORE UPDATE ON public.payroll_info
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();