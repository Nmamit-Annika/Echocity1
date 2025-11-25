import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, User, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdminSetup = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [currentRole, setCurrentRole] = useState<string>('citizen');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching role:', error);
      return;
    }

    setCurrentRole(data?.role || 'citizen');
  };

  const makeAdmin = async () => {
    if (!user) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('You are now an admin! Redirecting to admin dashboard...');
      setCurrentRole('admin');
      
      // Reload the page to refresh AuthContext
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  const makeCitizen = async () => {
    if (!user) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'citizen' })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Switched back to citizen role');
      setCurrentRole('citizen');
      
      // Reload to refresh AuthContext
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    } finally {
      setUpdating(false);
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
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/app')} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Admin Access Setup
            </CardTitle>
            <CardDescription>
              Toggle your role for testing and development purposes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Status */}
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Role</p>
                  <div className="flex items-center gap-2">
                    {currentRole === 'admin' ? (
                      <>
                        <Shield className="h-5 w-5 text-purple-600" />
                        <Badge variant="default" className="bg-purple-600">
                          Administrator
                        </Badge>
                      </>
                    ) : (
                      <>
                        <User className="h-5 w-5 text-blue-600" />
                        <Badge variant="secondary">
                          Citizen
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t">
              {currentRole !== 'admin' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Grant yourself admin access to view and manage all complaints
                  </p>
                  <Button
                    onClick={makeAdmin}
                    disabled={updating}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {updating ? 'Updating...' : 'Make Me Admin'}
                  </Button>
                </div>
              )}

              {currentRole === 'admin' && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium mb-2">
                      ✓ Admin Access Active
                    </p>
                    <p className="text-xs text-green-700">
                      You can now access the admin dashboard and manage all complaints
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => navigate('/admin')}
                    className="w-full"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Go to Admin Dashboard
                  </Button>

                  <Button
                    onClick={makeCitizen}
                    disabled={updating}
                    variant="outline"
                    className="w-full"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {updating ? 'Updating...' : 'Switch Back to Citizen'}
                  </Button>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-2">📝 About Roles:</p>
              <ul className="space-y-1 text-xs">
                <li><strong>Citizen:</strong> Can create and track your own complaints</li>
                <li><strong>Admin:</strong> Can view all complaints, approve/deny, assign workers, and request citizen verification</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSetup;
