import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type jsQRType from 'jsqr';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import {
  X, Flashlight, FlashlightOff, Package, CheckCircle2,
  Camera, AlertCircle, ScanLine, QrCode, Clock, Calendar,
  Pause, Play, Keyboard, RotateCw, ArrowRight, ArrowLeft,
  Info, AlertTriangle
} from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner';
import inventoryService, { InventoryItem } from '../services/inventoryService';
import lendingService from '../services/lendingService';
import traineeService, { Trainee } from '../services/traineeService';
import { useAuth } from '../contexts/AuthContext';

type ScanMode = 'borrow' | 'return';

interface ScannedItemInfo {
  item: InventoryItem;
  status: 'available' | 'out_of_stock';
  message: string;
}

interface LendingQRScannerProps {
  /** Controls modal visibility */
  isOpen: boolean;
  
  /** Callback invoked when modal should close */
  onClose: () => void;
  
  /** Optional callback when lending/return is successful */
  onSuccess?: () => void;
  
  /** Initial mode (defaults to 'borrow') */
  initialMode?: 'borrow' | 'return';
}

export default function LendingQRScanner({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'borrow',
}: LendingQRScannerProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const cooldownRef = useRef(false);
  const accessToastShownRef = useRef(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Lazy-loaded jsQR module
  const [jsQR, setJsQR] = useState<typeof jsQRType | null>(null);

  // Camera and scanner state
  const [mode, setMode] = useState<ScanMode>(initialMode);
  const [torch, setTorch] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Borrow mode state
  const [scannedItem, setScannedItem] = useState<ScannedItemInfo | null>(null);
  const [itemLoading, setItemLoading] = useState(false);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>('');
  const [borrowQuantity, setBorrowQuantity] = useState('1');
  const [borrowDueDate, setBorrowDueDate] = useState('');
  const [borrowNotes, setBorrowNotes] = useState('');
  const [creatingLending, setCreatingLending] = useState(false);

  // Return mode state
  const [scannedLendingId, setScannedLendingId] = useState<string | null>(null);
  const [lendingInfo, setLendingInfo] = useState<any | null>(null);
  const [lendingLoading, setLendingLoading] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');
  const [returningItem, setReturningItem] = useState(false);

  // UI state
  const [now, setNow] = useState(new Date());

  // UUID validation helper
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Check permissions
  const canManageLending = ['super_admin', 'local_admin', 'staff_inventory_manager'].includes(user?.role ?? '');

  // ── Camera lifecycle ────────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
  }, [stream]);

  const startCamera = async (deviceId?: string) => {
    const targetDeviceId = deviceId || selectedDeviceId;
    setCameraError(null);
    setPermissionDenied(false);
    setTorch(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera not supported on this device');
        return;
      }

      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: targetDeviceId
          ? { deviceId: { exact: targetDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameraDevices = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(cameraDevices);
        if (!selectedDeviceId && cameraDevices.length > 0) {
          setSelectedDeviceId(cameraDevices[0].deviceId);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => startDecoding();
      }
      setStream(mediaStream);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied');
        setPermissionDenied(true);
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device');
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is already in use by another application');
      } else {
        setCameraError('Failed to access camera');
      }
    }
  };

  const handleCameraDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    await new Promise(resolve => setTimeout(resolve, 300));
    await startCamera(deviceId);
  };

  // ── Torch control ───────────────────────────────────────────────────────────

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    const caps = track.getCapabilities() as any;
    if (caps.torch) {
      try {
        await track.applyConstraints({ advanced: [{ torch: !torch } as any] });
        setTorch(!torch);
      } catch {
        toast.error('Torch control failed');
      }
    } else {
      toast.error('Torch not supported on this device');
    }
  };

  // ── QR decode loop ──────────────────────────────────────────────────────────

  const startDecoding = () => {
    if (!jsQR) return;
    cancelAnimationFrame(rafRef.current);
    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (scannerPaused) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { rafRef.current = requestAnimationFrame(tick); return; }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });
      if (code && !cooldownRef.current) {
        handleQRDetected(code.data);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const triggerCooldown = (ms = 2000) => {
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, ms);
  };

  // ── QR detection handlers ───────────────────────────────────────────────────

  const handleQRDetected = useCallback(async (raw: string) => {
    if (scannerPaused) return;

    if (mode === 'borrow') {
      await handleBorrowScan(raw);
    } else {
      await handleReturnScan(raw);
    }
  }, [mode, scannerPaused]);

  // ── Borrow mode: scan item QR ───────────────────────────────────────────────

  const handleBorrowScan = async (raw: string) => {
    let itemId: string | null = null;
    try {
      const parsed = JSON.parse(raw);
      itemId = parsed.id ?? null;
    } catch {
      itemId = raw.trim();
    }

    if (!itemId || !isValidUUID(itemId)) {
      toast.error('Invalid item QR code');
      return;
    }

    setItemLoading(true);
    try {
      const item = await inventoryService.getInventoryItemById(itemId);
      triggerCooldown();
      
      setScannedItem({
        item,
        status: item.available_quantity > 0 ? 'available' : 'out_of_stock',
        message: item.available_quantity > 0 
          ? `Available: ${item.available_quantity} units`
          : 'Out of stock',
      });

      // Auto-focus trainee selector
      setTimeout(() => {
        const traineeSelect = document.querySelector('[data-lending-trainee-select]') as HTMLElement;
        traineeSelect?.focus();
      }, 100);
    } catch (err) {
      toast.error('Item not found. QR code may be outdated.');
      setScannedItem(null);
    } finally {
      setItemLoading(false);
    }
  };

  // ── Return mode: scan lending slip QR ───────────────────────────────────────

  const handleReturnScan = async (raw: string) => {
    let lendingId: string | null = null;
    try {
      // Try to parse as JSON first (if it contains lending info)
      const parsed = JSON.parse(raw);
      lendingId = parsed.lending_id ?? parsed.id ?? null;
    } catch {
      // Otherwise treat as direct lending ID
      lendingId = raw.trim();
    }

    if (!lendingId || !isValidUUID(lendingId)) {
      toast.error('Invalid lending slip QR code');
      return;
    }

    setLendingLoading(true);
    try {
      const lending = await lendingService.getLendingById(lendingId);
      triggerCooldown();
      
      if (lending.status === 'returned') {
        toast.warning('This item has already been returned');
        setLendingInfo(null);
        return;
      }

      setScannedLendingId(lendingId);
      setLendingInfo(lending);
      toast.info(`Ready to return: ${lending.item?.name}`);
    } catch (err) {
      toast.error('Lending record not found. Slip may be invalid.');
      setLendingInfo(null);
    } finally {
      setLendingLoading(false);
    }
  };

  // ── Borrow action: create lending ───────────────────────────────────────────

  const handleCreateLending = async () => {
    if (!scannedItem) {
      toast.error('No item scanned');
      return;
    }

    if (scannedItem.status === 'out_of_stock') {
      toast.error('Item is out of stock');
      return;
    }

    if (!selectedTraineeId) {
      toast.error('Please select a trainee');
      return;
    }

    const qty = parseInt(borrowQuantity, 10);
    if (!qty || qty < 1 || qty > scannedItem.item.available_quantity) {
      toast.error(`Invalid quantity. Available: ${scannedItem.item.available_quantity}`);
      return;
    }

    if (!borrowDueDate) {
      toast.error('Please set a return date');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (borrowDueDate < today) {
      toast.error('Return date must be in the future');
      return;
    }

    setCreatingLending(true);
    try {
      await lendingService.createLending({
        item_id: scannedItem.item.id,
        trainee_id: selectedTraineeId,
        quantity: qty,
        expected_return_date: borrowDueDate,
        notes: borrowNotes || undefined,
      });

      toast.success(`✓ Item borrowed successfully`);
      
      // Reset form
      setScannedItem(null);
      setSelectedTraineeId('');
      setBorrowQuantity('1');
      setBorrowDueDate('');
      setBorrowNotes('');
      
      onSuccess?.();

      // Auto-reset scanner
      setTimeout(() => {
        triggerCooldown(500);
      }, 500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create lending');
    } finally {
      setCreatingLending(false);
    }
  };

  // ── Return action: mark item as returned ─────────────────────────────────────

  const handleReturnItem = async () => {
    if (!scannedLendingId || !lendingInfo) {
      toast.error('No lending record loaded');
      return;
    }

    setReturningItem(true);
    try {
      await lendingService.returnItem(scannedLendingId, {
        notes: returnNotes || undefined,
      });

      toast.success(`✓ Item returned successfully`);
      
      // Reset form
      setScannedLendingId(null);
      setLendingInfo(null);
      setReturnNotes('');
      
      onSuccess?.();

      // Auto-reset scanner
      setTimeout(() => {
        triggerCooldown(500);
      }, 500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to return item');
    } finally {
      setReturningItem(false);
    }
  };

  // ── Manual code entry ────────────────────────────────────────────────────────

  const handleManualCodeSubmit = async () => {
    const code = manualCode.trim();
    if (!code) {
      toast.warning('Enter a code first');
      return;
    }
    setManualCode('');
    await handleQRDetected(code);
  };

  // ── Effects ──────────────────────────────────────────────────────────────────

  // Load jsQR
  useEffect(() => {
    if (isOpen && !jsQR) {
      import('jsqr').then(module => {
        setJsQR(() => module.default);
      }).catch(err => {
        console.error('Failed to load jsQR:', err);
        toast.error('Failed to load QR scanner library');
      });
    }
  }, [isOpen, jsQR]);

  // Start camera
  useEffect(() => {
    if (!canManageLending || !isOpen) return;
    startCamera();
    return () => stopCamera();
  }, [canManageLending, selectedDeviceId, isOpen]);

  // Load trainees for borrow mode
  useEffect(() => {
    if (mode === 'borrow' && isOpen) {
      traineeService.getTrainees()
        .then(res => setTrainees(res.data ?? []))
        .catch(() => toast.error('Failed to load trainees'));
    }
  }, [mode, isOpen]);

  // Check permissions
  useEffect(() => {
    if (!canManageLending && !accessToastShownRef.current && isOpen) {
      accessToastShownRef.current = true;
      toast.error('You do not have permission to use lending scanner');
    }
  }, [canManageLending, isOpen]);

  // Reset on mode change
  useEffect(() => {
    setScannedItem(null);
    setLendingInfo(null);
    setSelectedTraineeId('');
    setBorrowQuantity('1');
    setBorrowDueDate('');
    setBorrowNotes('');
    setReturnNotes('');
  }, [mode]);

  // Live clock
  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [isOpen]);

  // Restart decode on state changes
  useEffect(() => {
    if (stream && videoRef.current && isOpen && jsQR) startDecoding();
  }, [isOpen, jsQR]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => { document.removeEventListener('keydown', handleKeyDown); };
  }, [isOpen]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  // Determine modal size based on content
  const getModalClasses = () => {
    const base = "relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-white shadow-2xl";
    
    // Mobile: near full screen
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return `${base} sm:h-[95vh] sm:max-h-[95vh] sm:max-w-[95vw]`;
    }
    
    // Tablet/Desktop: fixed aspect ratio card
    return `${base} h-auto max-h-[90vh] w-auto max-w-2xl`;
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lending-scanner-title"
    >
      <div className={getModalClasses()}>
        <canvas ref={canvasRef} className="hidden" />

        {/* ── Header Card ─────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/50 px-5 py-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200/80 ring-1 ring-slate-300/50">
                <QrCode className="h-5 w-5 text-slate-700" strokeWidth={1.5} />
              </div>
              <div>
                <h2 id="lending-scanner-title" className="text-base font-semibold text-slate-900">Circulation</h2>
                <p className="text-xs text-slate-600 tracking-wide uppercase">Item Lending & Return</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 rounded-lg hover:bg-slate-200/50 text-slate-600"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          </div>

          {/* Mode toggle - Card style */}
          <div className="flex gap-2 p-1 bg-white rounded-lg border border-slate-200">
            <Button
              variant={mode === 'borrow' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('borrow')}
              className={`flex-1 text-xs font-medium gap-2 transition-all ${
                mode === 'borrow' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              Borrow
            </Button>
            <Button
              variant={mode === 'return' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('return')}
              className={`flex-1 text-xs font-medium gap-2 transition-all ${
                mode === 'return' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
              Return
            </Button>
          </div>
        </div>

        {/* ── Camera view ─────────────────────────────────────────────────────── */}
        {!cameraError ? (
          <div className="relative flex-1 overflow-hidden bg-black/90 min-h-[300px] max-h-[400px]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
              style={{ WebkitTransform: 'scaleX(-1)', transform: 'scaleX(-1)' }}
            />
            
            {/* Scan frame overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-52 w-52 border border-slate-300/30 rounded-2xl bg-white/5">
                {/* Corner brackets */}
                <div className="absolute -top-1 -left-1 h-5 w-5 border-t border-l border-slate-300/60" />
                <div className="absolute -top-1 -right-1 h-5 w-5 border-t border-r border-slate-300/60" />
                <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b border-l border-slate-300/60" />
                <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b border-r border-slate-300/60" />
                
                {/* Center focus point */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-1 w-1 rounded-full bg-slate-300/40" />
                </div>
              </div>
            </div>

            {/* Camera status text */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2">
              <p className="text-xs text-slate-400 font-mono">
                {cameraError ? 'Camera oFF' : scannerPaused ? 'PAUSED' : 'tap start to scan an item tag'}
              </p>
            </div>

            {/* Camera controls - Bottom bar */}
            <div className="pointer-events-auto absolute bottom-0 left-0 right-0 flex gap-2 p-3 bg-gradient-to-t from-black/40 to-transparent">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setScannerPaused(!scannerPaused)}
                className="flex-1 h-9 text-xs font-medium gap-2 bg-white/90 hover:bg-white text-slate-900 rounded-lg"
              >
                {scannerPaused ? <Play className="h-3.5 w-3.5" strokeWidth={2} /> : <Pause className="h-3.5 w-3.5" strokeWidth={2} />}
                {scannerPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleTorch}
                className={`flex-1 h-9 text-xs font-medium gap-2 rounded-lg transition-all ${
                  torch 
                    ? 'bg-yellow-400/90 hover:bg-yellow-400 text-yellow-900' 
                    : 'bg-white/90 hover:bg-white text-slate-900'
                }`}
              >
                {torch ? <Flashlight className="h-3.5 w-3.5" strokeWidth={2} /> : <FlashlightOff className="h-3.5 w-3.5" strokeWidth={2} />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-[300px]">
            <Alert className="mx-4 w-auto" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{cameraError}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* ── Form panel - Card-based ─────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-slate-200 bg-slate-50/50 p-5 max-h-64 overflow-y-auto">
          {mode === 'borrow' ? (
            // ── Borrow Form ──
            <div className="space-y-4">
              {/* Item scanned card */}
              {scannedItem ? (
                <Card className="border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">{scannedItem.item.name}</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {scannedItem.item.available_quantity > 0 
                            ? `${scannedItem.item.available_quantity} available` 
                            : 'Out of stock'}
                        </p>
                      </div>
                      <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 text-xs shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                        Scanned
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ) : itemLoading ? (
                <Skeleton className="h-14 w-full rounded-lg" />
              ) : (
                <Card className="border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-3.5 text-center">
                    <p className="text-xs text-slate-600 font-mono">Position item QR code in frame</p>
                  </CardContent>
                </Card>
              )}

              {/* Borrower details form */}
              {scannedItem && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">Trainee *</label>
                    <Select value={selectedTraineeId} onValueChange={setSelectedTraineeId}>
                      <SelectTrigger 
                        data-lending-trainee-select
                        className="h-9 text-sm border-slate-200 rounded-lg"
                      >
                        <SelectValue placeholder="Select trainee" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {trainees.map(t => (
                          <SelectItem key={t.id} value={t.id} className="text-sm">
                            {t.first_name} {t.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700 mb-1.5 block">Quantity *</label>
                      <Input
                        type="number"
                        min="1"
                        max={scannedItem.item.available_quantity}
                        value={borrowQuantity}
                        onChange={(e) => setBorrowQuantity(e.target.value)}
                        className="h-9 text-sm border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-700 mb-1.5 block">Return Date *</label>
                      <Input
                        type="date"
                        min={today}
                        value={borrowDueDate}
                        onChange={(e) => setBorrowDueDate(e.target.value)}
                        className="h-9 text-sm border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">Notes (optional)</label>
                    <Input
                      placeholder="Special instructions..."
                      value={borrowNotes}
                      onChange={(e) => setBorrowNotes(e.target.value)}
                      className="h-9 text-sm border-slate-200 rounded-lg"
                    />
                  </div>

                  <Button
                    onClick={handleCreateLending}
                    disabled={!selectedTraineeId || !borrowDueDate || creatingLending}
                    className="w-full h-9 text-sm font-medium gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                  >
                    {creatingLending ? (
                      <>
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
                        Create Lending
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // ── Return Form ──
            <div className="space-y-4">
              {/* Lending info card */}
              {lendingInfo ? (
                <Card className="border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-3.5">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 text-sm">{lendingInfo.item?.name}</p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {lendingInfo.trainee 
                              ? `${lendingInfo.trainee.first_name} ${lendingInfo.trainee.last_name}` 
                              : lendingInfo.borrower_name}
                          </p>
                        </div>
                        <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 text-xs shrink-0">
                          <CheckCircle2 className="h-3 w-3" />
                          Scanned
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 font-mono">
                        Due: {new Date(lendingInfo.expected_return_date).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : lendingLoading ? (
                <Skeleton className="h-14 w-full rounded-lg" />
              ) : (
                <Card className="border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-3.5 text-center">
                    <p className="text-xs text-slate-600 font-mono">Scan the lending slip QR code</p>
                  </CardContent>
                </Card>
              )}

              {/* Return details form */}
              {lendingInfo && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">Return Notes (optional)</label>
                    <Input
                      placeholder="Item condition, damage, etc."
                      value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)}
                      className="h-9 text-sm border-slate-200 rounded-lg"
                    />
                  </div>

                  <Button
                    onClick={handleReturnItem}
                    disabled={returningItem}
                    className="w-full h-9 text-sm font-medium gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                  >
                    {returningItem ? (
                      <>
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
                        Confirm Return
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Manual entry fallback */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <label className="text-xs font-medium text-slate-700 mb-1.5 flex gap-2 items-center">
              <Keyboard className="h-3.5 w-3.5" strokeWidth={1.5} />
              Manual Entry
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Paste QR code..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualCodeSubmit()}
                className="h-8 text-xs flex-1 border-slate-200 rounded-lg"
              />
              <Button
                onClick={handleManualCodeSubmit}
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Go
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
