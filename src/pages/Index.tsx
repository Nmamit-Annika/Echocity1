import { useEffect, useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
const CityMap = lazy(() => import('@/components/CityMap').then((m) => ({ default: m.CityMap })));
import { ComplaintCard } from '@/components/ComplaintCard';
import { CreateComplaintDialog } from '@/components/CreateComplaintDialog';
import { MapPin, LogOut, Plus, Shield, AlertCircle, User } from 'lucide-react';
import { toast } from 'sonner';

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

const Index = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading, signOut } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        categories (name, icon),
        departments (name)
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch complaints');
      return;
    }

    if (data) {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', user?.id)
        .single();

      // Transform data to include profile
      const transformedData = data.map(item => ({
        ...item,
        profiles: profile || { full_name: 'Unknown User' }
      }));
      
      setComplaints(transformedData as Complaint[]);
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Echocity</h1>
                <p className="text-sm text-muted-foreground">Voice of the Citizens</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate('/profile')}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              {isAdmin && (
                <Button variant="outline" onClick={() => navigate('/admin')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              )}
              <Button variant="outline" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map Section */}
          <Card className="lg:sticky lg:top-24 lg:h-fit order-2 lg:order-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>City Map</span>
                <Button onClick={() => setShowDialog(true)} size="sm" className="sm:size-default">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">New Complaint</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px] lg:h-[600px] rounded-lg overflow-hidden">
                <Suspense fallback={<div className="flex items-center justify-center h-full">Loading map…</div>}>
                  <CityMap complaints={complaints} />
                </Suspense>
              </div>
            </CardContent>
          </Card>

          {/* Complaints Section */}
          <div className="space-y-6 order-1 lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Complaints</CardTitle>
              </CardHeader>
              <CardContent>
                {complaints.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Complaints Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start reporting civic issues in your area
                    </p>
                    <Button onClick={() => setShowDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Report an Issue
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {complaints.map((complaint) => (
                      <ComplaintCard key={complaint.id} complaint={complaint} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <CreateComplaintDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSuccess={fetchComplaints}
      />
    </div>
  );
};

export default Index;