import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { profiles as profilesApi, stats } from '@/integrations/supabase/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ProfileForm {
  full_name: string;
  phone: string | null;
  address: string | null;
  city: string;
  state: string;
  pincode: string | null;
  dob: string | null; // ISO string (YYYY-MM-DD)
  avatar_url: string | null;
}

function computeBadge(count: number) {
  if (count >= 25) return { label: 'City Champion', className: 'bg-yellow-500 text-white' };
  if (count >= 10) return { label: 'Active Reporter', className: 'bg-primary text-primary-foreground' };
  if (count >= 3) return { label: 'Contributor', className: 'bg-secondary text-secondary-foreground' };
  if (count >= 1) return { label: 'First Report', className: 'bg-muted text-foreground' };
  return { label: 'New Citizen', className: 'bg-slate-200 text-slate-700' };
}

export default function Profile() {
  const { user, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [complaintCount, setComplaintCount] = useState<number>(0);
  const [form, setForm] = useState<ProfileForm | null>(null);

  const email = user?.email ?? '';
  const initials = useMemo(() => (form?.full_name || email || 'EC').slice(0,2).toUpperCase(), [form?.full_name, email]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const existing = await profilesApi.get(user.id);
        setForm({
          full_name: existing.full_name,
          phone: existing.phone,
          address: existing.address,
          city: existing.city,
          state: existing.state,
          pincode: existing.pincode,
          // @ts-ignore - columns may be missing until migration runs
          dob: (existing as any).dob ?? null,
          // @ts-ignore
          avatar_url: (existing as any).avatar_url ?? null,
        });
        const count = await stats.complaintsCount(user.id);
        setComplaintCount(count);
      } catch (e: any) {
        // If profile row missing, create a default record
        if ((e?.message || '').includes('No rows')) {
          await profilesApi.upsert({ id: user.id, full_name: user.user_metadata?.full_name || 'Citizen', city: '—', state: '—' });
          const created = await profilesApi.get(user.id);
          setForm({
            full_name: created.full_name,
            phone: created.phone,
            address: created.address,
            city: created.city,
            state: created.state,
            pincode: created.pincode,
            // @ts-ignore
            dob: (created as any).dob ?? null,
            // @ts-ignore
            avatar_url: (created as any).avatar_url ?? null,
          });
        } else {
          console.error(e);
          toast.error('Failed to load profile');
        }
      }
    })();
  }, [user]);

  const badge = computeBadge(complaintCount);

  if (loading || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile…</p>
        </div>
      </div>
    );
  }

  const onChange = (key: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => prev ? { ...prev, [key]: e.target.value } as ProfileForm : prev);
  };

  const onSave = async () => {
    if (!user || !form) return;
    setSaving(true);
    try {
      await profilesApi.update(user.id, {
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        // @ts-ignore
        dob: form.dob,
        // @ts-ignore
        avatar_url: form.avatar_url,
      });
      toast.success('Profile updated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: identity */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center gap-3">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={form.avatar_url ?? undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="text-lg font-semibold">{form.full_name}</div>
                  <div className="text-sm text-muted-foreground">{email}</div>
                </div>
                <Badge className={badge.className}>{badge.label}</Badge>
                <div className="text-xs text-muted-foreground">Complaints filed: {complaintCount}</div>
              </div>
            </CardContent>
          </Card>

          {/* Right column: editable details */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full name</Label>
                  <Input id="full_name" value={form.full_name || ''} onChange={onChange('full_name')} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone || ''} onChange={onChange('phone')} />
                </div>
                <div>
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input id="dob" type="date" value={form.dob || ''} onChange={onChange('dob')} />
                </div>
                <div>
                  <Label htmlFor="avatar">Photo URL</Label>
                  <Input id="avatar" placeholder="https://…" value={form.avatar_url || ''} onChange={onChange('avatar_url')} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={form.address || ''} onChange={onChange('address')} />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city || ''} onChange={onChange('city')} />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={form.state || ''} onChange={onChange('state')} />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" value={form.pincode || ''} onChange={onChange('pincode')} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={onSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
