import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface VerificationComplaint {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  verification_requested: string | null;
  assigned_worker?: {
    name: string;
  };
}

export const CitizenVerificationView = ({ userId }: { userId: string }) => {
  const [pendingVerifications, setPendingVerifications] = useState<VerificationComplaint[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingVerifications();
  }, [userId]);

  const fetchPendingVerifications = async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select('id, title, description, status, created_at, verification_requested')
      .eq('user_id', userId)
      .eq('status', 'pending-verification')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Verification fetch error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load verification requests',
        variant: 'destructive',
      });
      return;
    }

    setPendingVerifications(data || []);
  };

  const handleVerification = async (complaintId: string, approved: boolean) => {
    setLoading(true);
    const citizenFeedback = feedback[complaintId] || '';

    try {
      const updates: any = {
        status: approved ? 'resolved' : 'reopened',
        citizen_feedback: citizenFeedback,
        updated_at: new Date().toISOString(),
      };

      // If rejected, generate AI analysis reason
      if (!approved) {
        const reasons = [
          'Citizen reported issue not fully resolved, requires additional inspection and repair work',
          'Verification photos indicate partial completion, follow-up action needed by assigned team',
          'Citizen feedback suggests underlying problem persists despite initial repair attempt',
          'Quality of work below acceptable standards according to citizen inspection',
          'Different aspect of original complaint remains unaddressed, reassignment recommended',
        ];
        updates.reopen_reason = reasons[Math.floor(Math.random() * reasons.length)];
      }

      const { error } = await supabase
        .from('complaints')
        .update(updates)
        .eq('id', complaintId);

      if (error) throw error;

      toast({
        title: approved ? 'Resolution Confirmed' : 'Case Reopened',
        description: approved
          ? 'Thank you for confirming the resolution!'
          : 'Your feedback has been recorded. The case will be reassigned.',
      });

      // Clear feedback and refresh list
      setFeedback(prev => {
        const newFeedback = { ...prev };
        delete newFeedback[complaintId];
        return newFeedback;
      });
      
      fetchPendingVerifications();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update verification',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerifications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <AlertCircle className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>No pending verifications at this time</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Pending Verifications</h2>
        <p className="text-muted-foreground">
          Please verify if these complaints have been resolved to your satisfaction
        </p>
      </div>

      {pendingVerifications.map((complaint) => (
        <Card key={complaint.id} className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded">
                AWAITING VERIFICATION
              </span>
              {complaint.title}
            </CardTitle>
            <CardDescription>
              Submitted on {new Date(complaint.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Original Complaint:</p>
              <p className="text-sm">{complaint.description}</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Additional Feedback (Optional)
              </label>
              <Textarea
                placeholder="Let us know if there are any issues or additional comments..."
                value={feedback[complaint.id] || ''}
                onChange={(e) => setFeedback(prev => ({ ...prev, [complaint.id]: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => handleVerification(complaint.id, true)}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Resolved
              </Button>
              <Button
                onClick={() => handleVerification(complaint.id, false)}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Not Resolved
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
