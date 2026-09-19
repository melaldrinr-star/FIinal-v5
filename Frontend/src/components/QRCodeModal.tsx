import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import QRCodeDisplay from './QRCodeDisplay';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  category: string;
  qr_code?: string;  // Add the backend-generated QR code
}

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
}

export default function QRCodeModal({ open, onOpenChange, item }: QRCodeModalProps) {
  if (!item) return null;

  // Use the backend's generated qr_code value if available, otherwise fall back to ID
  const qrValue = item.qr_code || item.id;
  
  const qrData = JSON.stringify({
    qrCode: qrValue,
    id: item.id,
    name: item.name,
    category: item.category,
  });

  const downloadQR = () => {
    const canvas = document.querySelector('.qr-modal-canvas canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${item.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-qr.png`;
      link.href = url;
      link.click();
      toast.success('QR Code downloaded');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-h-[85vh] flex flex-col" 
        style={{ width: 'calc(100% - 2rem)', maxWidth: '28rem' }}
        hideCloseButton={true}
      >
        <DialogHeader className="space-y-0.5 shrink-0">
          <DialogTitle className="text-base sm:text-lg">Item QR Code</DialogTitle>
          <DialogDescription className="text-xs">
            Scan or download this QR code for item tracking
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-3 min-h-0">
          <div className="qr-modal-canvas flex justify-center rounded-lg border bg-muted/30 p-3 sm:p-4">
            <QRCodeDisplay value={qrData} />
          </div>

          <div className="space-y-1.5 rounded-lg bg-muted/50 p-3 shrink-0">
            <h4 className="line-clamp-1 text-sm font-semibold">{item.name}</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between gap-2">
                <span className="shrink-0">ID:</span>
                <span className="text-right break-all font-mono text-[10px]">#{item.id}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="shrink-0">Category:</span>
                <span className="capitalize text-right">{item.category}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Button
              variant="outline"
              className="w-full h-10 text-sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              className="w-full h-10 text-sm"
              onClick={downloadQR}
            >
              <Download className="mr-1.5 size-3.5" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
