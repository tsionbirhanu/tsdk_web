export type VerificationMethod = 'cbe' | 'telebirr' | 'image';

export interface VerificationPayload {
  reference?: string;
  suffix?: string;
  file?: File;
}

export interface VerificationResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Verify payment using the Verifier API through proxy routes
 * @param method - Verification method (cbe, telebirr, image)
 * @param payload - Payload containing verification details
 * @returns Verification response with success status and data
 */
export async function verifyPayment(
  method: VerificationMethod,
  payload: VerificationPayload
): Promise<VerificationResponse> {
  try {
    if (method === 'image' && !payload.file) {
      throw new Error('Receipt image is required');
    }

    if (method === 'telebirr' && !payload.reference) {
      throw new Error('Reference is required');
    }

    if (method === 'cbe' && !payload.file && !payload.reference) {
      throw new Error('Reference or PDF receipt is required');
    }

    // For uploads, use FormData so file-based verifiers can inspect the receipt directly.
    if (method === 'image' || (method === 'cbe' && payload.file)) {
      const formData = new FormData();
      if (payload.file) {
        formData.append('file', payload.file);
      }
      formData.append('autoVerify', 'true');
      if (payload.reference) {
        formData.append('reference', payload.reference);
      }
      if (payload.suffix) {
        formData.append('suffix', payload.suffix);
      }

      const response = await fetch(`/api/payment/verify-${method}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `Verification failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Check if the response indicates success or failure
      if (data.success === false) {
        throw new Error(data.error || 'Verification failed');
      }
      
      return data;
    }

    // For other methods, use JSON
    const requestBody: any = {};
    if (payload.reference) {
      requestBody.reference = payload.reference;
    }
    if (payload.suffix) {
      requestBody.suffix = payload.suffix;
    }

    const response = await fetch(`/api/payment/verify-${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `Verification failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Check if the response indicates success or failure
    if (data.success === false) {
      throw new Error(data.error || 'Verification failed');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred during verification');
  }
}
