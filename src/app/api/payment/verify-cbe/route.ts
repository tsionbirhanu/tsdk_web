import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get API key from environment
    const apiKey = process.env.VERIFY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let reference = '';
    let suffix = '';
    let file: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      reference = (formData.get('reference') as string) || '';
      suffix = (formData.get('suffix') as string) || '';
      const uploadedFile = formData.get('file');
      if (uploadedFile instanceof File) {
        file = uploadedFile;
      } else if (uploadedFile) {
        file = uploadedFile as unknown as File;
      }
    } else {
      const body = await req.json();
      reference = body.reference || '';
      suffix = body.suffix || '';
    }

    if (!reference && !file) {
      return NextResponse.json(
        { error: 'Reference or PDF file is required' },
        { status: 400 }
      );
    }

    // Call external API
    const externalResponse = await fetch('https://verifyapi.leulzenebe.pro/verify-cbe', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: file
        ? (() => {
            const externalFormData = new FormData();
            externalFormData.append('file', file);
            externalFormData.append('pdf', file);
            externalFormData.append('autoVerify', 'true');
            if (reference) {
              externalFormData.append('reference', reference);
            }
            if (suffix) {
              externalFormData.append('suffix', suffix);
            }
            return externalFormData;
          })()
        : JSON.stringify({
            reference,
            ...(suffix && { accountSuffix: suffix }),
          }),
    });

    if (!externalResponse.ok) {
      const errorText = await externalResponse.text();
      return NextResponse.json(
        { error: errorText || 'CBE verification failed' },
        { status: externalResponse.status }
      );
    }

    const data = await externalResponse.json();
    
    // Check if the external API says verification was successful
    if (data.success === false) {
      return NextResponse.json(
        { success: false, error: data.error || 'Verification failed' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
