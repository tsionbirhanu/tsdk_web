'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { verifyPayment, VerificationMethod, VerificationResponse } from '@/lib/payment-verification';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function PaymentVerification() {
  const [method, setMethod] = useState<VerificationMethod>('cbe');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state for text methods
  const [reference, setReference] = useState('');
  const [suffix, setSuffix] = useState('');

  // Form state for image method
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSuffix, setImageSuffix] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP images are allowed');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let result: VerificationResponse;

      if (method === 'image') {
        if (!selectedFile) {
          toast.error('Please select an image file');
          setLoading(false);
          return;
        }
        result = await verifyPayment(method, {
          file: selectedFile,
          suffix: imageSuffix || undefined,
        });
      } else if (method === 'telebirr') {
        if (!reference) {
          toast.error('Reference is required');
          setLoading(false);
          return;
        }
        result = await verifyPayment(method, { reference });
      } else {
        if (!reference) {
          toast.error('Reference is required');
          setLoading(false);
          return;
        }
        result = await verifyPayment(method, {
          reference,
          suffix: suffix || undefined,
        });
      }

      setSuccess(result);
      toast.success('Verification successful!');

      // Clear form
      setReference('');
      setSuffix('');
      setSelectedFile(null);
      setImageSuffix('');
    } catch (err: any) {
      const errorMessage = err?.message || 'Verification failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Payment Verification</h3>
          <p className="text-sm text-muted-foreground">
            Verify your payment using your preferred method
          </p>
        </div>

        <Tabs
          value={method}
          onValueChange={(value) => {
            setMethod(value as VerificationMethod);
            setSuccess(null);
            setError(null);
            setReference('');
            setSuffix('');
            setSelectedFile(null);
            setImageSuffix('');
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cbe">CBE</TabsTrigger>
            <TabsTrigger value="telebirr">Telebirr</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>

          {/* CBE Method */}
          <TabsContent value="cbe" className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reference (Required)</label>
              <Input
                placeholder="Enter reference number"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Suffix (Optional)</label>
              <Input
                placeholder="Enter suffix"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
            </div>
          </TabsContent>

          {/* Telebirr Method */}
          <TabsContent value="telebirr" className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reference (Required)</label>
              <Input
                placeholder="Enter reference number"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
            </div>
          </TabsContent>

          {/* Image Upload Method */}
          <TabsContent value="image" className="space-y-4">
            <div>
              <label className="text-sm font-medium">Receipt Image (Required)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={loading}
                className="mt-1 block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90
                  cursor-pointer"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Supported formats: JPG, PNG, WebP (Max 5MB)
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Suffix (Optional)</label>
              <Input
                placeholder="Enter suffix"
                value={imageSuffix}
                onChange={(e) => setImageSuffix(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {error && (
          <div className="mt-4 rounded-md bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="mt-4 rounded-md bg-green-50 dark:bg-green-900/20 p-3">
            <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
              Verification Successful!
            </p>
            <pre className="text-xs bg-white dark:bg-slate-800 p-2 rounded overflow-auto max-h-48">
              {JSON.stringify(success.data, null, 2)}
            </pre>
          </div>
        )}

        {/* Verify Button */}
        <div className="mt-6">
          <Button
            onClick={handleVerify}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Verifying...' : 'Verify Payment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
