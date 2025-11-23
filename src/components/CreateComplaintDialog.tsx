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
import { Badge } from './ui/badge';
import { Suspense, lazy } from 'react';
const CityMap = lazy(() => import('./CityMap').then((m) => ({ default: m.CityMap })));
import { toast } from 'sonner';
import { categorizeIssueWithAI, enhanceIssueDescription } from '@/services/aiCategorization';
import { imageAnalysisService } from '@/services/imageAnalysis';
import { useEnhancedSpeech } from '@/hooks/useEnhancedSpeech';
import { MicIcon, MicOffIcon, SparklesIcon, PhotoIcon, EnhanceIcon } from '@/components/icons/EnhancedIcons';
import { Loader2 } from 'lucide-react';

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
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [suggestion, setSuggestion] = useState<{category: string, confidence: number, reasoning: string} | null>(null);
  
  const { isListening, startListening, stopListening, isSupported } = useEnhancedSpeech((transcript) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description ? `${prev.description} ${transcript}` : transcript
    }));
  });

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      
      if (error) {
        console.error('Categories fetch error:', error);
        toast.error('Failed to load categories. Please run database setup first.');
        return;
      }
      
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load complaint categories. Check database setup.');
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

  const analyzeImage = async () => {
    if (!imageFile) {
      toast.error('Please upload an image first');
      return;
    }

    setAnalyzingImage(true);
    
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      const imageBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data URL prefix
        };
      });

      const analysis = await imageAnalysisService.analyzeComplaintImage(imageBase64, imageFile.type);
      
      // Auto-fill form fields
      setFormData(prev => ({
        ...prev,
        title: analysis.title,
        description: analysis.description + (analysis.details.length > 0 ? '\n\nDetails:\n' + analysis.details.join('\n') : '')
      }));

      // Auto-select category if found
      const matchedCategory = categories.find(c => 
        c.name.toLowerCase().includes(analysis.suggestedCategory.toLowerCase()) ||
        analysis.suggestedCategory.toLowerCase().includes(c.name.toLowerCase())
      );
      
      if (matchedCategory) {
        setFormData(prev => ({ ...prev, category_id: matchedCategory.id }));
        toast.success(`AI analyzed image: ${analysis.title} (${Math.round(analysis.confidence * 100)}% confidence)`);
      } else {
        toast.success('Image analyzed! Please select a category.');
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      toast.error('Image analysis failed. Check console for details.');
    } finally {
      setAnalyzingImage(false);
    }
  };

  const categorizeIssue = async () => {
    if (!formData.description && !imageFile) {
      toast.error('Please provide a description or image for AI categorization');
      return;
    }

    setCategorizing(true);
    try {
      let imageBase64: string | undefined;
      if (imageFile) {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        imageBase64 = await new Promise((resolve) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Remove data URL prefix
          };
        });
      }

      const result = await categorizeIssueWithAI(formData.description, imageBase64);
      setSuggestion(result);

      // Auto-select matching category if confidence is high
      if (result.confidence > 0.7) {
        const matchedCategory = categories.find(c => 
          c.name.toLowerCase().includes(result.category.toLowerCase()) ||
          result.category.toLowerCase().includes(c.name.toLowerCase())
        );
        if (matchedCategory) {
          setFormData(prev => ({ ...prev, category_id: matchedCategory.id }));
          toast.success(`AI categorized as: ${matchedCategory.name} (${Math.round(result.confidence * 100)}% confidence)`);
        }
      }
    } catch (error) {
      toast.error('Failed to categorize');
    } finally {
      setCategorizing(false);
    }
  };

  const enhanceDescription = async () => {
    if (!formData.description.trim()) {
      toast.error('Please enter a description first');
      return;
    }

    setEnhancing(true);
    try {
      const enhanced = await enhanceIssueDescription(formData.description);
      if (enhanced && enhanced !== formData.description) {
        setFormData(prev => ({ ...prev, description: enhanced }));
        toast.success('Description enhanced');
      } else {
        toast.info('Looks good!');
      }
    } catch (error) {
      toast.error('Enhancement failed');
    } finally {
      setEnhancing(false);
    }
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
            const envAnalyzeUrl = (import.meta as any).env?.VITE_ANALYZE_URL;
            const analyzeEndpoint = (envAnalyzeUrl && envAnalyzeUrl.startsWith('http')) 
              ? envAnalyzeUrl 
              : 'http://localhost:8787/analyze';
            
            console.log('Using analyze endpoint:', analyzeEndpoint);
            
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
      
      const { data, error } = await supabase.from('complaints').insert({
        user_id: user?.id,
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id,
        department_id: selectedCategory?.department_id,
        location_lat: formData.latitude,
        location_lng: formData.longitude,
        location_address: formData.address,
        image_url: imageUrls && imageUrls.length > 0 ? imageUrls[0] : null, // Use first image URL
      });

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

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
      console.error('Complete error details:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to submit complaint: ${errorMessage}`);
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
            <div className="flex items-center justify-between">
              <Label htmlFor="category">Category *</Label>
              {suggestion && (
                <Badge variant="outline" className="text-xs">
                  AI Suggestion: {suggestion.category} ({Math.round(suggestion.confidence * 100)}%)
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Select
                value={formData.category_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, category_id: value });
                  // Auto-assign department based on category
                  const selectedCat = categories.find(c => c.id === value);
                  if (selectedCat?.department_id) {
                    console.log('Auto-assigning department:', selectedCat.department_id);
                    toast.success('Department auto-assigned!');
                  }
                }}
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
              <Button
                type="button"
                variant="outline"
                onClick={categorizeIssue}
                disabled={categorizing || (!formData.description && !imageFile)}
                className="px-3"
              >
                {categorizing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SparklesIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description *</Label>
              <div className="flex gap-2">
                {isSupported && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={isListening ? stopListening : startListening}
                    className="px-2"
                  >
                    {isListening ? (
                      <MicOffIcon className="h-4 w-4 text-red-500" />
                    ) : (
                      <MicIcon className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={enhanceDescription}
                  disabled={enhancing || !formData.description.trim()}
                  className="px-2"
                >
                  {enhancing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <EnhanceIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail... (click mic button for voice input)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
              className={isListening ? 'ring-2 ring-red-500' : ''}
            />
            {isListening && (
              <p className="text-sm text-red-600 animate-pulse">
                🎤 Listening... Speak now
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Location *</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Click on the map to select location
            </p>
            <div className="space-y-2 mb-4">
              <Label htmlFor="photo">Photo (optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-teal-500 transition-colors">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="preview" 
                      className="w-full max-h-48 object-cover rounded-lg" 
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={analyzeImage}
                        disabled={analyzingImage}
                      >
                        {analyzingImage ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <SparklesIcon className="h-3 w-3 mr-1" />
                            Analyze Image
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setSuggestion(null);
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label 
                    htmlFor="photo" 
                    className="flex flex-col items-center justify-center py-8 cursor-pointer"
                  >
                    <PhotoIcon className="h-12 w-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Click to upload a photo
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PNG, JPG up to 10MB
                    </span>
                  </label>
                )}
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files?.[0])}
                  className="hidden"
                />
              </div>
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