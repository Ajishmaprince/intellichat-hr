import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, DollarSign, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  remainingLeave: number;
  nextPaymentDate: string;
  pendingLeaveRequests: number;
}

const QuickStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!employee) return;

        // Fetch leave records
        const { data: leaveRecords } = await supabase
          .from('leave_records')
          .select('*')
          .eq('employee_id', employee.id);

        // Calculate remaining leave
        const totalLeave = 25;
        const usedLeave = leaveRecords?.reduce((sum, record) => {
          return record.status === 'approved' ? sum + record.days_count : sum;
        }, 0) || 0;

        const pendingRequests = leaveRecords?.filter(r => r.status === 'pending').length || 0;

        // Fetch next payment date
        const { data: payrollData } = await supabase
          .from('payroll_info')
          .select('payment_date')
          .eq('employee_id', employee.id)
          .gte('payment_date', new Date().toISOString())
          .order('payment_date', { ascending: true })
          .limit(1)
          .single();

        setStats({
          remainingLeave: totalLeave - usedLeave,
          nextPaymentDate: payrollData?.payment_date || 'N/A',
          pendingLeaveRequests: pendingRequests,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-l-4 border-l-accent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Remaining Leave</p>
              <p className="text-3xl font-bold text-accent">{stats?.remainingLeave || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">days available</p>
            </div>
            <Calendar className="h-10 w-10 text-accent/20" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Next Payment</p>
              <p className="text-lg font-bold text-primary">
                {stats?.nextPaymentDate && stats.nextPaymentDate !== 'N/A'
                  ? new Date(stats.nextPaymentDate).toLocaleDateString()
                  : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">upcoming payroll</p>
            </div>
            <DollarSign className="h-10 w-10 text-primary/20" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
              <p className="text-3xl font-bold text-orange-500">{stats?.pendingLeaveRequests || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">awaiting approval</p>
            </div>
            <Clock className="h-10 w-10 text-orange-500/20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickStats;