import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ChevronLeft,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { ComplaintCard } from '@/components/ComplaintCard';
import { AdminAnalytics } from '@/components/AdminAnalytics';

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  address: string;
  latitude: number;
  longitude: number;
  image_urls: string[] | null;
  categories: {
    name: string;
    icon: string;
  };
  departments: {
    name: string;
  };
  profiles: {
    full_name: string;
  };
}

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading, signOut } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    resolved: 0,
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/app');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchComplaints();
    }
  }, [isAdmin]);

  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        categories (name, icon),
        departments (name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch complaints');
      return;
    }
    
    if (data) {
      // Fetch user profiles for all complaints
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Transform data to include profiles
      const transformedData = data.map(item => ({
        ...item,
        profiles: profilesMap.get(item.user_id) || { full_name: 'Unknown User' }
      }));
      
      setComplaints(transformedData as Complaint[]);
      
      // Calculate stats
      setStats({
        total: data.length,
        pending: data.filter(c => c.status === 'pending').length,
        approved: data.filter(c => c.status === 'approved' || c.status === 'in_progress').length,
        resolved: data.filter(c => c.status === 'resolved').length,
      });
    }
  };

  const updateComplaintStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('complaints')
      .update({ 
        status,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update complaint');
    } else {
      toast.success(`Complaint ${status}`);
      fetchComplaints();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/app')}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <LayoutDashboard className="h-6 w-6 text-primary" />
                  Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Manage civic complaints</p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-warning">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-primary">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-accent">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        {/* Complaints List */}
        <Card>
          <CardHeader>
            <CardTitle>All Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Active</TabsTrigger>
                <TabsTrigger value="verification">Awaiting Verification</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-4">
                {complaints.map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onStatusUpdate={updateComplaintStatus}
                    isAdmin
                  />
                ))}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4 mt-4">
                {complaints
                  .filter((c) => c.status === 'pending')
                  .map((complaint) => (
                    <ComplaintCard
                      key={complaint.id}
                      complaint={complaint}
                      onStatusUpdate={updateComplaintStatus}
                      isAdmin
                    />
                  ))}
              </TabsContent>

              <TabsContent value="approved" className="space-y-4 mt-4">
                {complaints
                  .filter((c) => c.status === 'approved' || c.status === 'in_progress')
                  .map((complaint) => (
                    <ComplaintCard
                      key={complaint.id}
                      complaint={complaint}
                      onStatusUpdate={updateComplaintStatus}
                      isAdmin
                    />
                  ))}
              </TabsContent>

              <TabsContent value="resolved" className="space-y-4 mt-4">
                {complaints
                  .filter((c) => c.status === 'resolved')
                  .map((complaint) => (
                    <ComplaintCard
                      key={complaint.id}
                      complaint={complaint}
                      onStatusUpdate={updateComplaintStatus}
                      isAdmin
                    />
                  ))}
              </TabsContent>

              <TabsContent value="analytics" className="mt-4">
                <AdminAnalytics complaints={complaints} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;