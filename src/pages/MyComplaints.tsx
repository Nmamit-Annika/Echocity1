import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

type Complaint = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  address: string;
  image_urls: string[];
  created_at: string;
  department?: {
    name: string;
  };
  category?: {
    name: string;
  };
  admin_notes?: string;
};

export default function MyComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyComplaints();
    }
  }, [user]);

  async function fetchMyComplaints() {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          department:departments(name),
          category:categories(name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load your complaints');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">My Complaints</h1>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'in_progress', 'resolved'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {complaints
                .filter(c => tab === 'all' || c.status === tab)
                .map(complaint => (
                  <Card key={complaint.id} className="overflow-hidden">
                    {complaint.image_urls?.[0] && (
                      <div className="aspect-video relative">
                        <img
                          src={complaint.image_urls[0]}
                          alt={complaint.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex justify-between items-start gap-4">
                        <CardTitle className="text-xl">{complaint.title}</CardTitle>
                        <Badge>{complaint.status}</Badge>
                      </div>
                      <CardDescription>
                        {complaint.category?.name && (
                          <Badge variant="outline" className="mr-2">
                            {complaint.category.name}
                          </Badge>
                        )}
                        {complaint.department?.name && (
                          <Badge variant="outline">
                            {complaint.department.name}
                          </Badge>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{complaint.description}</p>
                      <div className="text-sm text-gray-500">
                        <p>Location: {complaint.address}</p>
                        <p>Submitted: {new Date(complaint.created_at).toLocaleDateString()}</p>
                        {complaint.admin_notes && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-md">
                            <p className="font-medium text-sm">Admin Notes:</p>
                            <p className="text-sm">{complaint.admin_notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
            {complaints.filter(c => tab === 'all' || c.status === tab).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No {tab === 'all' ? '' : tab} complaints found
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}