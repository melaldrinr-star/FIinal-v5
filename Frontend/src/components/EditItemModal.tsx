import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import QRCodeDisplay from './QRCodeDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Save, Download } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { api } from '../services';
import inventoryService from '../services/inventoryService';

interface Item {
  id: string;
  name: string;
  category: string;
  quantity: number;
  available: number;
  location: string;
  description?: string;
  purchaseDate?: string;
  condition?: string;
  photoUrl?: string;
  image_path?: string;
}

interface EditItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  onSuccess?: () => void;
}

export default function EditItemModal({ open, onOpenChange, item, onSuccess }: EditItemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: '',
    location: '',
    purchaseDate: '',
    condition: '',
    photoUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Load item data when modal opens or item changes
  useEffect(() => {
    if (item && open) {
      setImageFile(null);
      setFormData({
        name: item.name || '',
        description: item.description || '',
        category: item.category || '',
        quantity: item.quantity.toString() || '',
        location: item.location || '',
        purchaseDate: item.purchaseDate || '',
        condition: item.condition || '',
        photoUrl: item.image_path || item.photoUrl || '',
      });
    }
  }, [item, open]);

  // Generate QR code data
  const qrData = JSON.stringify({
    id: item?.id || 'new',
    name: formData.name || item?.name || 'Item',
    category: formData.category,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (value: string | File) => {
    if (typeof value === 'string') {
      setFormData(prev => ({ ...prev, photoUrl: value }));
      setImageFile(null);
    } else if (value instanceof File) {
      setImageFile(value);
      setFormData(prev => ({ ...prev, photoUrl: URL.createObjectURL(value) }));
    }
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadImageIfNeeded = async (): Promise<string | undefined> => {
    if (imageFile) {
      try {
        const base64 = await toBase64(imageFile);
        const response = await api.post<{ filePath: string; url: string }>('/upload/tenant', {
          file: base64,
          category: 'images/items',
          filename: imageFile.name,
          prefix: `item_${item?.id || 'edit'}`,
        });

        if (response.success && response.data?.filePath) {
          return response.data.filePath;
        }
        toast.error('Image upload failed');
        return undefined;
      } catch {
        toast.error('Image upload error');
        return undefined;
      }
    }
    // No new file - keep existing
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setLoading(true);
    try {
      const imagePath = await uploadImageIfNeeded();
      const updatePayload: any = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        quantity: Number(formData.quantity),
        unit: 'piece(s)',
        location: formData.location,
        purchase_date: formData.purchaseDate || null,
        condition: formData.condition || null,
      };
      if (imagePath !== undefined) {
        updatePayload.image_path = imagePath;
      }
      await inventoryService.updateInventoryItem(String(item.id), updatePayload);
      toast.success('Item updated successfully!');
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const canvas = document.querySelector('.edit-qr-code-canvas canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${formData.name || 'item'}-qr.png`;
      link.href = url;
      link.click();
    }
    toast.success('QR Code downloaded');
  };

  return (
    <Dialog open={open && !!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[92vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 pb-2 sm:pb-3">
          <DialogTitle className="text-lg sm:text-xl">Edit Item</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Update the item details and download QR code
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6">
            <div className="grid gap-3 sm:gap-6 grid-cols-1 lg:grid-cols-3 pb-4 sm:pb-6">
              {/* Form Fields - Desktop: 2 columns, Mobile: 1 column */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                <div className="grid gap-2 sm:gap-4 md:grid-cols-2">
                  <div className="space-y-1 sm:space-y-2 md:col-span-2">
                    <Label htmlFor="edit-name" className="text-xs sm:text-sm">Item Name *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Laptop - HP ProBook 450"
                      required
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2 md:col-span-2">
                    <Label htmlFor="edit-description" className="text-xs sm:text-sm">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Brief description of the item"
                      rows={2}
                      className="text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="edit-category" className="text-xs sm:text-sm">Category *</Label>
                    <Select value={formData.category} onValueChange={(value: string) => handleInputChange('category', value)}>
                      <SelectTrigger id="edit-category" className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="supplies">Supplies</SelectItem>
                        <SelectItem value="tools">Tools</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="edit-quantity" className="text-xs sm:text-sm">Quantity *</Label>
                    <Input
                      id="edit-quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      placeholder="0"
                      min="1"
                      required
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="edit-location" className="text-xs sm:text-sm">Location *</Label>
                    <Input
                      id="edit-location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., Computer Lab"
                      required
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="edit-purchaseDate" className="text-xs sm:text-sm">Purchase Date</Label>
                    <Input
                      id="edit-purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="edit-condition" className="text-xs sm:text-sm">Condition</Label>
                    <Select value={formData.condition} onValueChange={(value: string) => handleInputChange('condition', value)}>
                      <SelectTrigger id="edit-condition" className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="needs-repair">Needs Repair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 sm:space-y-2 md:col-span-2">
                    <ImageUpload
                      value={formData.photoUrl}
                      onChange={handleImageChange}
                      label="Item Photo"
                      description="Upload a clear photo of the item for easy identification"
                    />
                  </div>
                </div>
              </div>

              {/* QR Code Preview - Desktop: Right panel, Mobile: Below form */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-16 z-20 top-0">
                  <Card>
                    <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                      <CardTitle className="text-sm sm:text-base">QR Code</CardTitle>
                      <CardDescription className="text-xs">Item tracking code</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-4 pt-2">
                      <div className="edit-qr-code-canvas flex justify-center rounded-lg border bg-muted/30 p-2 sm:p-4">
                        <QRCodeDisplay value={qrData} />
                      </div>
                      
                      <div className="space-y-1 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ID:</span>
                          <span className="truncate">#{item?.id || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Category:</span>
                          <span className="capitalize truncate">{formData.category || '-'}</span>
                        </div>

                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs sm:text-sm h-8 sm:h-9"
                        onClick={downloadQR}
                      >
                        <Download className="mr-1 size-3 sm:size-4" />
                        Download QR
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 border-t bg-muted/30 mt-2 sm:mt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs sm:text-sm h-8 sm:h-9"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm"
              disabled={loading}
              className="text-xs sm:text-sm h-8 sm:h-9"
            >
              {loading ? (
                <span className="flex items-center gap-1 sm:gap-2">
                  <span className="size-3 sm:size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span className="hidden sm:inline">Saving...</span>
                </span>
              ) : (
                <><Save className="mr-1 size-3 sm:size-4" />Update Item</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}