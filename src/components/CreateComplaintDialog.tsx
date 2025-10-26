import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Suspense, lazy } from 'react';
const CityMap = lazy(() => import('./CityMap').then((m) => ({ default: m.CityMap })));
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  icon: string;
  department_id: string;
}

interface CreateComplaintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateComplaintDialog({ open, onOpenChange, onSuccess }: CreateComplaintDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    latitude: 19.0760,
    longitude: 72.8777,
    address: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    if (data) {
      setCategories(data);
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setFormData({ ...formData, latitude: lat, longitude: lng, address });
    toast.success('Location selected!');
  };

  const handleImageChange = (file?: File) => {
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check for duplicate complaints
      const { data: existingComplaints } = await supabase
        .from('complaints')
        .select('id')
        .eq('title', formData.title)
        .eq('user_id', user?.id);

      if (existingComplaints && existingComplaints.length > 0) {
        toast.error('You have already reported a similar complaint');
        setLoading(false);
        return;
      }

      // Upload image if present
      let imageUrls: string[] | null = null;
      if (imageFile) {
        // Ensure a bucket named 'complaint-images' exists in your Supabase project
        const fileName = `${user?.id}/${Date.now()}_${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('complaint-images')
          .upload(fileName, imageFile, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          console.warn('Image upload failed:', uploadError);
          // continue without image
        } else {
          const { data: publicData } = await supabase.storage
            .from('complaint-images')
            .getPublicUrl(fileName);
          imageUrls = [publicData.publicUrl];

          // Try to call analysis endpoint (serverless) to get suggested category using Gemini
          try {
            const analyzeEndpoint = import.meta.env.VITE_ANALYZE_URL || 'http://localhost:8787/analyze';
            const res = await fetch(analyzeEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_url: publicData.publicUrl }),
            });
            if (res.ok) {
              const result = await res.json();
              // If model returns a suggested label that maps to your categories, apply it
              if (result?.label) {
                const matched = categories.find(c => c.name.toLowerCase() === result.label.toLowerCase());
                if (matched) setFormData(prev => ({ ...prev, category_id: matched.id }));
              }
            }
          } catch (err) {
            console.warn('Analysis endpoint error (optional):', err);
          }
        }
      }

      // Get department_id from selected category
      const selectedCategory = categories.find(c => c.id === formData.category_id);
      
      const { error } = await supabase.from('complaints').insert({
        user_id: user?.id,
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id,
        department_id: selectedCategory?.department_id,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address,
        image_urls: imageUrls,
      });

      if (error) throw error;

      toast.success('Complaint submitted successfully!');
      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category_id: '',
        latitude: 19.0760,
        longitude: 72.8777,
        address: '',
      });
    } catch (error) {
      toast.error('Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report a Civic Issue</DialogTitle>
          <DialogDescription>
            Help us improve your city by reporting issues
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Pothole on Main Street"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Location *</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Click on the map to select location
            </p>
            <div className="space-y-2 mb-4">
              <Label htmlFor="photo">Photo (optional)</Label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files?.[0])}
                className="w-full"
              />
              {imagePreview && (
                <img src={imagePreview} alt="preview" className="mt-2 max-h-40 object-cover rounded" />
              )}
            </div>
            <div className="h-[300px] border rounded-lg overflow-hidden">
              <Suspense fallback={<div className="flex items-center justify-center h-full">Loading map…</div>}>
                <CityMap
                  onLocationSelect={handleLocationSelect}
                  center={[formData.longitude, formData.latitude]}
                />
              </Suspense>
            </div>
            {formData.address && (
              <p className="text-sm text-muted-foreground mt-2">
                📍 {formData.address}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.address}>
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}