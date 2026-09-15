/**
 * LazyModal - Lazy-loaded modal/dialog component wrapper
 * 
 * Defers loading of modal components until they're actually opened.
 * Modals are typically hidden and only needed when user interacts with them.
 */

import { lazy, Suspense, useState, useCallback, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Skeleton } from './ui/skeleton';

interface LazyModalProps {
  triggerElement?: ReactNode;
  title?: string;
  description?: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  componentProps?: any;
  onOpenChange?: (open: boolean) => void;
}

/**
 * LoadingContent - Skeleton loader for modal content
 */
function LoadingContent() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-32 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

/**
 * LazyModal - Wrapper that lazy-loads modal components
 * 
 * Benefits:
 * - Modal code only loads when dialog is opened
 * - Reduces initial bundle size
 * - Typical use cases: detail modals, forms, confirmation dialogs
 */
export function LazyModal({
  triggerElement,
  title,
  description,
  component: ModalComponent,
  componentProps = {},
  onOpenChange,
}: LazyModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange]
  );

  return (
    <>
      {triggerElement && (
        <div onClick={() => handleOpenChange(true)}>
          {triggerElement}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          {(title || description) && (
            <DialogHeader>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
          )}
          
          <Suspense fallback={<LoadingContent />}>
            <ModalComponent {...componentProps} onClose={() => handleOpenChange(false)} />
          </Suspense>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * createLazyModal - Factory function to create a lazy-loaded modal component
 * 
 * Usage:
 *   const LazyDetailsModal = createLazyModal(
 *     () => import('./DetailsModal'),
 *     { title: 'Details', description: 'View details' }
 *   );
 *   <LazyDetailsModal triggerElement={<Button>Open</Button>} {...props} />
 */
export function createLazyModal(
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  options?: { title?: string; description?: string }
) {
  const LazyComponent = lazy(importFn);

  return function RenderLazyModal(props: any) {
    const { triggerElement, componentProps, onOpenChange } = props;
    return (
      <LazyModal
        triggerElement={triggerElement}
        title={options?.title}
        description={options?.description}
        component={LazyComponent}
        componentProps={componentProps}
        onOpenChange={onOpenChange}
      />
    );
  };
}

export default LazyModal;
