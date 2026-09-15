import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { OTPInput } from './OTPInput';
import { CheckCircle2, Clock, Mail, MessageSquare, Loader } from 'lucide-react';
import { cn } from '../ui/utils';
import { toast } from 'sonner';

export interface OTPVerificationStepProps {
  // Content
  /** Title displayed at top */
  title: string;
  /** Description under title */
  description: string;
  /** Email where code will be sent */
  recipientEmail: string;
  /** Phone where WhatsApp code will be sent (optional) */
  recipientPhone?: string;

  // State
  /** Whether code has been sent */
  codeSent: boolean;
  /** Whether code has been verified */
  codeVerified: boolean;
  /** Current verification code value */
  verificationCode: string;
  /** Whether currently sending code */
  loading: boolean;
  /** Whether currently verifying code */
  verifying: boolean;
  /** Error message if any */
  error?: string;
  /** Whether user can resend */
  canResend: boolean;
  /** Seconds until can resend (0 means can resend now) */
  resendCountdown: number;

  // Callbacks
  /** Send verification code. Optional method: 'email' | 'whatsapp' | 'both' */
  onSendCode: (method?: 'email' | 'whatsapp' | 'both') => Promise<void>;
  /** Verify the entered code */
  onVerifyCode: (code: string) => Promise<void>;
  /** Resend code */
  onResendCode: () => Promise<void>;
  /** Called when moving to next step (code verified) */
  onNext?: () => void;
  /** Called when going back to previous step */
  onBack?: () => void;

  // Options
  /** Show method selection UI (default: true) */
  showMethodSelection?: boolean;
  /** Allow user to change method after sending (default: false) */
  allowMethodChange?: boolean;
}

/**
 * OTPVerificationStep Component
 *
 * Generic component reusable for:
 * - Email verification
 * - 2FA verification
 * - Password reset verification
 *
 * Manages three states:
 * 1. Initial - Choose method and send code
 * 2. Entered - Verify with OTPInput
 * 3. Success - Show confirmation
 */
export const OTPVerificationStep = React.forwardRef<HTMLDivElement, OTPVerificationStepProps>(
  (
    {
      title,
      description,
      recipientEmail,
      recipientPhone,
      codeSent,
      codeVerified,
      verificationCode,
      loading,
      verifying,
      error,
      canResend,
      resendCountdown,
      onSendCode,
      onVerifyCode,
      onResendCode,
      onNext,
      onBack,
      showMethodSelection = true,
      allowMethodChange = false,
    },
    ref
  ) => {
    const [selectedMethod, setSelectedMethod] = useState<'email' | 'whatsapp' | 'both'>('both');
    const [showMethodSelectionUI, setShowMethodSelectionUI] = useState(!codeSent);
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // Update local state when external state changes
    useEffect(() => {
      setShowMethodSelectionUI(!codeSent && (!codeVerified || allowMethodChange));
    }, [codeSent, codeVerified, allowMethodChange]);

    // Handle send code
    const handleSendCode = useCallback(async () => {
      if (!selectedMethod || isSending) return;

      setIsSending(true);
      try {
        await onSendCode(selectedMethod);
        // Hide method selection after successful send
        if (!allowMethodChange) {
          setShowMethodSelectionUI(false);
        }
      } catch (err) {
        console.error('Failed to send code:', err);
      } finally {
        setIsSending(false);
      }
    }, [selectedMethod, isSending, onSendCode, allowMethodChange]);

    // Handle verify code
    const handleVerifyCode = useCallback(async () => {
      if (!verificationCode || verificationCode.length !== 6 || isVerifying) return;

      setIsVerifying(true);
      try {
        await onVerifyCode(verificationCode);
      } catch (err) {
        console.error('Failed to verify code:', err);
      } finally {
        setIsVerifying(false);
      }
    }, [verificationCode, isVerifying, onVerifyCode]);

    // Handle resend code
    const handleResendCode = useCallback(async () => {
      if (!canResend || isSending) return;

      setIsSending(true);
      try {
        await onResendCode();
        toast.success('Verification code resent!');
      } catch (err) {
        console.error('Failed to resend code:', err);
      } finally {
        setIsSending(false);
      }
    }, [canResend, isSending, onResendCode]);

    const formatCountdown = (seconds: number): string => {
      if (seconds <= 0) return '';
      if (seconds < 60) return `${seconds}s`;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    };

    return (
      <div ref={ref} className="space-y-6 w-full">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* STATE 1: Initial - Choose method and send code */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {!codeSent && showMethodSelectionUI && (
          <div className="space-y-4">
            {/* Method Selection */}
            {showMethodSelectionUI && (
              <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Choose verification method:
                </p>

                <div className="space-y-2">
                  {/* Email Option */}
                  <label
                    className={cn(
                      'flex items-center gap-3 cursor-pointer p-3 rounded-md transition-colors',
                      'hover:bg-blue-100 dark:hover:bg-blue-900/50',
                      selectedMethod === 'email' && 'bg-blue-100 dark:bg-blue-900/50'
                    )}
                  >
                    <input
                      type="radio"
                      name="verificationMethod"
                      value="email"
                      checked={selectedMethod === 'email'}
                      onChange={(e) => setSelectedMethod(e.target.value as 'email' | 'whatsapp' | 'both')}
                      className="w-4 h-4 cursor-pointer"
                      aria-label="Verify via email"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <Mail className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Via Email</p>
                        <p className="text-xs text-muted-foreground">{recipientEmail}</p>
                      </div>
                    </div>
                  </label>

                  {/* WhatsApp Option */}
                  {recipientPhone && (
                    <label
                      className={cn(
                        'flex items-center gap-3 cursor-pointer p-3 rounded-md transition-colors',
                        'hover:bg-blue-100 dark:hover:bg-blue-900/50',
                        selectedMethod === 'whatsapp' && 'bg-blue-100 dark:bg-blue-900/50'
                      )}
                    >
                      <input
                        type="radio"
                        name="verificationMethod"
                        value="whatsapp"
                        checked={selectedMethod === 'whatsapp'}
                        onChange={(e) => setSelectedMethod(e.target.value as 'email' | 'whatsapp' | 'both')}
                        className="w-4 h-4 cursor-pointer"
                        aria-label="Verify via WhatsApp"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <MessageSquare className="size-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Via WhatsApp</p>
                          <p className="text-xs text-muted-foreground">{recipientPhone}</p>
                        </div>
                      </div>
                    </label>
                  )}

                  {/* Both Option */}
                  {recipientPhone && (
                    <label
                      className={cn(
                        'flex items-center gap-3 cursor-pointer p-3 rounded-md transition-colors',
                        'hover:bg-blue-100 dark:hover:bg-blue-900/50',
                        selectedMethod === 'both' && 'bg-blue-100 dark:bg-blue-900/50'
                      )}
                    >
                      <input
                        type="radio"
                        name="verificationMethod"
                        value="both"
                        checked={selectedMethod === 'both'}
                        onChange={(e) => setSelectedMethod(e.target.value as 'email' | 'whatsapp' | 'both')}
                        className="w-4 h-4 cursor-pointer"
                        aria-label="Verify via both email and WhatsApp"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <CheckCircle2 className="size-4 text-primary dark:text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Both Email & WhatsApp</p>
                          <p className="text-xs text-muted-foreground">Recommended for faster delivery</p>
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSendCode}
              disabled={isSending || !selectedMethod}
              className="w-full"
              size="lg"
              aria-busy={isSending}
            >
              {isSending ? (
                <>
                  <Loader className="mr-2 size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* STATE 2: Entered - Verify with OTPInput */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {codeSent && !codeVerified && (
          <div className="space-y-4">
            {/* Success message */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30">
              <div className="flex items-center gap-2 text-sm text-green-900 dark:text-green-300">
                <CheckCircle2 className="size-4 flex-shrink-0" />
                <span>
                  ✓ Code sent to{' '}
                  {selectedMethod === 'both'
                    ? `${recipientEmail} and WhatsApp`
                    : selectedMethod === 'whatsapp'
                      ? 'WhatsApp'
                      : recipientEmail}
                </span>
              </div>
            </div>

            {/* OTP Input */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Enter Verification Code
                </label>
                <OTPInput
                  value={verificationCode}
                  onChange={() => {
                    // onChange is required by OTPInput but parent manages state
                    // Parent component updates via external state
                  }}
                  onComplete={handleVerifyCode}
                  isLoading={isVerifying}
                  error={error}
                  autoFocus={true}
                  disabled={verifying}
                />
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerifyCode}
                disabled={verifying || verificationCode.length !== 6 || isVerifying}
                className="w-full"
                size="lg"
                aria-busy={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader className="mr-2 size-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
            </div>

            {/* Resend Section */}
            <div className="flex flex-col gap-2 pt-2 border-t">
              {canResend ? (
                <Button
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={isSending}
                  className="w-full"
                >
                  {isSending ? (
                    <>
                      <Loader className="mr-2 size-4 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    'Resend Code'
                  )}
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                  <Clock className="size-4" />
                  <span>Resend in {formatCountdown(resendCountdown)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* STATE 3: Success - Show confirmation */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {codeVerified && (
          <div className="space-y-4">
            {/* Success Animation */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse opacity-20" />
                <div className="relative flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Verified!</h3>
              <p className="text-sm text-muted-foreground">
                Your {selectedMethod === 'email' ? 'email' : selectedMethod === 'whatsapp' ? 'WhatsApp' : 'email and WhatsApp'} has been verified successfully.
              </p>
            </div>

            {/* Next Button */}
            {onNext && (
              <Button onClick={onNext} className="w-full" size="lg">
                Continue <CheckCircle2 className="ml-2 size-4" />
              </Button>
            )}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* ACTIONS: Back button */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {onBack && (codeSent || codeVerified) && (
          <Button variant="outline" onClick={onBack} className="w-full">
            Back
          </Button>
        )}
      </div>
    );
  }
);

OTPVerificationStep.displayName = 'OTPVerificationStep';
