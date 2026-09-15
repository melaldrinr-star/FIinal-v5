import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertTriangle, Calendar, User, Package, Phone } from 'lucide-react';
import { OverdueLending } from '../services/overdueNotificationService';
import overdueNotificationService from '../services/overdueNotificationService';
import { Link } from 'react-router-dom';

interface OverdueDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overdueItems: OverdueLending[];
  onRefresh?: () => void;
}

export default function OverdueDetailsModal({
  open,
  onOpenChange,
  overdueItems,
}: OverdueDetailsModalProps) {
  const getSeverityColor = (daysOverdue: number) => {
    if (daysOverdue > 7) return 'destructive';
    if (daysOverdue > 3) return 'default';
    return 'secondary';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl mx-auto p-4 sm:p-6 max-h-[85vh] overflow-y-auto" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-sm sm:text-base flex items-center gap-2">
            <AlertTriangle className="h-4 sm:h-5 w-4 sm:w-5 text-destructive flex-shrink-0" />
            <span>Overdue Items ({overdueItems.length})</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Items that have passed their expected return date and require immediate attention.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {overdueItems.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <AlertTriangle className="h-8 sm:h-12 w-8 sm:w-12 mx-auto mb-2 sm:mb-4 opacity-50" />
              <p className="text-xs sm:text-sm">No overdue items found.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table className="text-xs sm:text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Item</TableHead>
                    <TableHead className="text-xs">Borrower</TableHead>
                    <TableHead className="text-xs">Due Date</TableHead>
                    <TableHead className="text-xs">Days</TableHead>
                    <TableHead className="text-xs">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueItems.map((item) => {
                    const daysOverdue = overdueNotificationService.calculateDaysOverdue(
                      item.expected_return_date
                    );
                    const borrowerName = item.trainee
                      ? `${item.trainee.first_name} ${item.trainee.last_name}`
                      : item.borrower_name || 'Unknown';

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-xs truncate">{item.item?.name || 'Unknown'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs truncate">{borrowerName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">{formatDate(item.expected_return_date)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityColor(daysOverdue)} className="text-xs">
                            {daysOverdue}d
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium">{item.quantity}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Legend:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">1-3 days</Badge>
                <Badge variant="default" className="text-xs">4-7 days</Badge>
                <Badge variant="destructive" className="text-xs">7+ days</Badge>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
