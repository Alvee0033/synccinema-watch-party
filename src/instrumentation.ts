// This file runs once when the Next.js server starts
// Perfect for applying polyfills before any other code executes
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Import polyfill to apply the File global
        await import('./lib/polyfill');
    }
}
