import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, Calendar, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Employee {
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  position: string;
  join_date: string;
}

const EmployeeInfo = () => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setEmployee(data);
      } catch (error) {
        console.error('Error fetching employee:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!employee) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No employee information available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Employee Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
          <User className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium">{employee.full_name}</p>
          </div>
          <Badge variant="outline">{employee.employee_id}</Badge>
        </div>

        <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
          <Mail className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{employee.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
          <Briefcase className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Department & Position</p>
            <p className="font-medium">{employee.department} - {employee.position}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
          <Calendar className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Join Date</p>
            <p className="font-medium">{new Date(employee.join_date).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeInfo;