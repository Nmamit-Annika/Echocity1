import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, TrendingUp, Calendar } from 'lucide-react';
import { ComplaintCard } from '@/components/ComplaintCard';
import { GeminiChatbot } from '@/components/GeminiChatbot';

interface CommunityComplaint {
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

interface DashboardStats {
  total: number;
  today: number;
  thisWeek: number;
  resolved: number;
  pending: number;
  topCategory: string;
}

export default function CommunityDashboard() {
  const [complaints, setComplaints] = useState<CommunityComplaint[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('map');

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const fetchCommunityData = async () => {
    try {
      console.log('Fetching community data...');
      
      // Test Supabase connection first
      const { error: testError } = await supabase
        .from('complaints')
        .select('count')
        .limit(1);
        
      if (testError) {
        console.error('Supabase connection test failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }
      
      console.log('Supabase connection successful, fetching full data...');
      
      // Fetch all public complaints
      const { data: complaintsData, error } = await supabase
        .from('complaints')
        .select(`
          *,
          categories (name, icon),
          departments (name),
          profiles (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching complaints:', error);
        throw new Error(`Failed to fetch complaints: ${error.message}`);
      }

      console.log('Fetched complaints data:', complaintsData?.length || 0, 'items');
      
      const complaintsList = (complaintsData || []) as CommunityComplaint[];
      setComplaints(complaintsList);

      // Calculate stats
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const todayStr = today.toISOString().split('T')[0];

      const todayCount = complaintsList.filter(c => 
        c.created_at.startsWith(todayStr)
      ).length;

      const weekCount = complaintsList.filter(c => 
        new Date(c.created_at) >= weekAgo
      ).length;

      const resolvedCount = complaintsList.filter(c => c.status === 'resolved').length;
      const pendingCount = complaintsList.filter(c => c.status === 'pending').length;

      // Find top category
      const categoryCount: Record<string, number> = {};
      complaintsList.forEach(c => {
        const cat = c.categories?.name || 'Other';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
      const topCategory = Object.keys(categoryCount).reduce((a, b) => 
        categoryCount[a] > categoryCount[b] ? a : b, 'None'
      );

      setStats({
        total: complaintsList.length,
        today: todayCount,
        thisWeek: weekCount,
        resolved: resolvedCount,
        pending: pendingCount,
        topCategory
      });

      console.log('Community data loaded successfully');

    } catch (error: any) {
      console.error('Error fetching community data:', error);
      
      // Show user-friendly error message
      const errorMessage = error?.message || 'Unknown error occurred';
      setError(`Network Error: ${errorMessage}`);
      
      // Create a toast or alert for user feedback
      setStats({
        total: 0,
        today: 0,
        thisWeek: 0,
        resolved: 0,
        pending: 0,
        topCategory: 'Error loading data'
      });
      
      // You could also add a toast notification here
      console.error('Network Error Details:', {
        message: errorMessage,
        stack: error?.stack,
        originalError: error
      });
      
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading community data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="space-y-2 text-sm text-left">
                <p><strong>Possible causes:</strong></p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Check your internet connection</li>
                  <li>Supabase service might be temporarily unavailable</li>
                  <li>Environment variables might be missing</li>
                </ul>
              </div>
              <Button 
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetchCommunityData();
                }}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
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
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Community Dashboard</h1>
                <p className="text-sm text-muted-foreground">See what's happening in your city</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <div className="text-2xl font-bold">{stats.total}</div>
                </div>
                <p className="text-xs text-muted-foreground">Total Reports</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <div className="text-2xl font-bold">{stats.today}</div>
                </div>
                <p className="text-xs text-muted-foreground">Today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <div className="text-2xl font-bold">{stats.thisWeek}</div>
                </div>
                <p className="text-xs text-muted-foreground">This Week</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="text-2xl font-bold">{stats.resolved}</div>
                </div>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                </div>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Badge variant="outline" className="text-xs">
                  {stats.topCategory}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Top Issue</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="map">Community Map</TabsTrigger>
            <TabsTrigger value="list">Recent Reports</TabsTrigger>
            <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  City-wide Issues Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Interactive Map</h3>
                    <p className="text-muted-foreground mb-4">
                      Showing {complaints.length} community reports across the city
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Map functionality will be restored once leaflet types are properly installed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Community Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {complaints.slice(0, 20).map((complaint) => (
                    <ComplaintCard
                      key={complaint.id}
                      complaint={complaint}
                      showUserInfo={true}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <div className="h-[700px]">
              <GeminiChatbot complaints={complaints} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}