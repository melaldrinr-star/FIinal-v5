import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import QR_Scanner_Modal from '../components/QR_Scanner_Modal';
import BorrowingSlipModal from '../components/BorrowingSlipModal';
import AddLendingModal from '../components/AddLendingModal';
import { InventoryItem } from '../services/inventoryService';
import lendingService from '../services/lendingService';
import { toast } from 'sonner';

/**
 * ScanPage Route Wrapper
 * 
 * This component serves as a route wrapper for the /scan route.
 * It renders the QR_Scanner_Modal as an overlay on top of the dashboard.
 * Handles borrow/return actions for scanned items.
 */
export default function ScanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastLendingId, setLastLendingId] = useState<string | null>(null);
  const [lastLendingData, setLastLendingData] = useState<any | null>(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [addLendingModalOpen, setAddLendingModalOpen] = useState(false);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  
  // Extract initial state from route state
  const initialMode = location.state?.mode as 'item' | 'attendance' | undefined;
  const initialProgramId = location.state?.programId as string | undefined;
  const initialSessionId = location.state?.sessionId as string | undefined;
  
  useEffect(() => {
    // Open modal when route is accessed
    setIsOpen(true);
  }, []);
  
  const handleClose = () => {
    setIsOpen(false);
    setSlipModalOpen(false);
    // Small delay to allow modal close animation
    setTimeout(() => {
      navigate(-1); // Go back to previous page
    }, 200);
  };

  const handlePrintSlip = async () => {
    if (!lastLendingId) {
      toast.error('No lending slip to print');
      return;
    }
    setSlipModalOpen(true);
  };

  const handleSlipModalOpen = (open: boolean) => {
    setSlipModalOpen(open);
    
    // When slip modal closes, redirect to lendings page
    if (!open && lastLendingId) {
      setTimeout(() => {
        navigate('/lendings');
      }, 300);
    }
  };

  const handleLendingCreated = (lendingId: string, lendingData: any) => {
    console.log('[BORROW] Lending created from modal, showing slip:', lendingId, lendingData);
    setLastLendingId(lendingId);
    setLastLendingData(lendingData);
    setAddLendingModalOpen(false);
    
    // Open slip modal after brief delay
    setTimeout(() => {
      setSlipModalOpen(true);
    }, 200);
  };

  const handleBorrow = async (item: InventoryItem, borrowerName: string, borrowerContact: string) => {
    console.log('[BORROW] Scanned item - opening full lending form');
    
    // Store the scanned item and borrower info
    setScannedItem(item);
    
    // Close the scanner and open the lending modal for full details
    setIsOpen(false);
    setTimeout(() => {
      setAddLendingModalOpen(true);
    }, 300);
  };

  const handleReturn = async (item: InventoryItem) => {
    console.log('[RETURN] Starting return flow for item:', { id: item.id, name: item.name });
    if (!item) {
      console.error('[RETURN] Item is null/undefined');
      return;
    }
    
    setIsProcessing(true);
    try {
      console.log('[RETURN] Searching for active lending with item_id:', item.id);
      
      // Find active lending records for this item
      const lendings = await lendingService.getLendingRecords({
        item_id: item.id,
        status: 'active',
      });

      console.log('[RETURN] Lending records returned:', {
        total: lendings.data?.length || 0,
        data: lendings.data,
      });

      // Get the first active lending for this item
      const activeLending = lendings.data?.[0];

      if (!activeLending) {
        console.error('[RETURN] No active lending found for item:', item.id);
        toast.error('No active lending found for this item');
        setIsProcessing(false);
        return;
      }

      console.log('[RETURN] Found active lending record:', activeLending);
      console.log('[RETURN] Calling return API with lending ID:', activeLending.id);

      // Return the item
      const result = await lendingService.returnItem(activeLending.id, {
        notes: `Returned via QR code scan: ${item.name}`,
      });

      console.log('[RETURN] Item returned successfully:', result);
      toast.success(`Item "${item.name}" returned successfully`);
      
      // Close modal and navigate back
      handleClose();
    } catch (err: any) {
      console.error('[RETURN] Error occurred:', {
        message: err.message,
        error: err,
        response: err.response?.data,
      });
      toast.error(err.message || 'Failed to return item');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Lending Scanner</h1>
            <p className="mt-1 text-slate-600">Scan items to borrow them</p>
          </div>
          {lastLendingId && (
            <button
              onClick={handlePrintSlip}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition"
            >
              📄 Print Last Slip
            </button>
          )}
        </div>
      </div>
      
      <QR_Scanner_Modal
        isOpen={isOpen}
        onClose={handleClose}
        onBorrow={handleBorrow}
        onReturn={handleReturn}
        isProcessing={isProcessing}
        initialMode={initialMode}
        initialProgramId={initialProgramId}
        initialSessionId={initialSessionId}
      />

      <AddLendingModal
        open={addLendingModalOpen}
        onOpenChange={setAddLendingModalOpen}
        preselectedItem={scannedItem}
        onLendingCreated={handleLendingCreated}
      />

      <BorrowingSlipModal
        open={slipModalOpen}
        onOpenChange={handleSlipModalOpen}
        lendingId={lastLendingId || undefined}
        lendingData={lastLendingData}
      />
    </DashboardLayout>
  );
}
