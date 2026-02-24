import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // ROUTE PROTECTION LOGIC
    // Added comment to trigger rebuild
    const path = request.nextUrl.pathname;
    const isDevMode = request.cookies.get('sb-dev-mode')?.value === 'true';

    // 0. Protect /api/v1/* routes with Bearer token (API Access Keys)
    if (path.startsWith('/api/v1/')) {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];

        // Validate token against api_keys table
        const { data: apiKeyData, error: apiKeyError } = await supabase
            .from('api_keys')
            .select('id, is_active')
            .eq('key', token)
            .single();

        if (apiKeyError || !apiKeyData || !apiKeyData.is_active) {
            return NextResponse.json({ error: 'Invalid or inactive API key' }, { status: 401 });
        }

        // Asynchronously update last_used_at (best-effort, don't await blocking the response)
        // Edge runtime fetch without await can sometimes be tricky depending on the deployment platform,
        // but since this intercepts Next.js middleware, we can await it if needed, or simply let it run if supported.
        // We will await it to ensure it updates reliably.
        await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', apiKeyData.id);

        // Pass through if valid
        return response;
    }

    // 1. Protect /dashboard routes (except maybe some public ones if any)
    if (path.startsWith('/dashboard') && !user && !isDevMode) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 2. Redirect logged-in users away from /login
    if ((path === '/login' || path === '/register') && user) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
