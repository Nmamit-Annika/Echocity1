import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MapPin, Calendar, User, Building } from 'lucide-react';
import { format } from 'date-fns';

interface ComplaintCardProps {
  complaint: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    address: string;
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
  };
  onStatusUpdate?: (id: string, status: string) => void;
  isAdmin?: boolean;
  showUserInfo?: boolean;
}

const statusColors = {
  pending: 'bg-warning text-warning-foreground',
  approved: 'bg-primary text-primary-foreground',
  in_progress: 'bg-primary text-primary-foreground',
  resolved: 'bg-accent text-accent-foreground',
  rejected: 'bg-destructive text-destructive-foreground',
};

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/20 text-warning',
  high: 'bg-secondary text-secondary-foreground',
  critical: 'bg-destructive text-destructive-foreground',
};

export function ComplaintCard({ complaint, onStatusUpdate, isAdmin, showUserInfo }: ComplaintCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{complaint.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(complaint.created_at), 'PPp')}
            </div>
            {showUserInfo && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>By {complaint.profiles?.full_name || 'Anonymous'}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Badge className={statusColors[complaint.status as keyof typeof statusColors]}>
              {complaint.status}
            </Badge>
            <Badge className={priorityColors[complaint.priority as keyof typeof priorityColors]}>
              {complaint.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{complaint.description}</p>

        {complaint.image_urls && complaint.image_urls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {complaint.image_urls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Complaint evidence ${idx + 1}`}
                className="rounded-lg w-full h-32 object-cover"
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{complaint.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{complaint.departments?.name || 'No department assigned'}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{complaint.profiles?.full_name || 'Unknown user'}</span>
          </div>
        </div>

        {isAdmin && complaint.status === 'pending' && onStatusUpdate && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="default"
              onClick={() => onStatusUpdate(complaint.id, 'approved')}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusUpdate(complaint.id, 'in_progress')}
            >
              In Progress
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onStatusUpdate(complaint.id, 'rejected')}
            >
              Reject
            </Button>
          </div>
        )}

        {isAdmin && (complaint.status === 'approved' || complaint.status === 'in_progress') && onStatusUpdate && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="default"
              className="bg-accent hover:bg-accent/90"
              onClick={() => onStatusUpdate(complaint.id, 'resolved')}
            >
              Mark Resolved
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}