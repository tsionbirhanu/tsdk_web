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

    // Get form data
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Create FormData for external API
    const externalFormData = new FormData();
    externalFormData.append('file', file);
    externalFormData.append('autoVerify', formData.get('autoVerify') || 'true');

    if (formData.has('suffix')) {
      externalFormData.append('suffix', formData.get('suffix') as string);
    }

    // Call external API
    const externalResponse = await fetch('https://verifyapi.leulzenebe.pro/verify-image', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: externalFormData,
    });

    if (!externalResponse.ok) {
      const errorText = await externalResponse.text();
      return NextResponse.json(
        { error: errorText || 'Image verification failed' },
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
