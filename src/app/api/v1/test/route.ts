import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json(
        {
            message: 'API Access successful!',
            timestamp: new Date().toISOString()
        },
        { status: 200 }
    );
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        return NextResponse.json(
            {
                message: 'API POST received successfully!',
                receivedData: body,
                timestamp: new Date().toISOString()
            },
            { status: 200 }
        );
    } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
}
