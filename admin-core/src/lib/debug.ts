/**
 * Simple runtime debug logger for the admin frontend.
 *
 * Instead of flooding console.log everywhere, logs are grouped by namespace
 * and can be enabled from the browser console without rebuilding the app.
 *
 * Example usage in code:
 *
 *   debug('http', 'request', config)
 *   debug('auth', 'login success', user)
 *   debugError('notifications', 'failed to load', err)
 *
 *
 * --------------------------------------------------------
 * HOW TO ENABLE DEBUG LOGS
 * --------------------------------------------------------
 *
 * Enable a single namespace:
 *
 *   localStorage.setItem('debug_namespaces', 'http')
 *
 * Enable multiple namespaces:
 *
 *   localStorage.setItem('debug_namespaces', 'http,auth')
 *
 * Enable everything:
 *
 *   localStorage.setItem('debug_namespaces', '*')
 *
 * Then refresh the page.
 *
 *
 * --------------------------------------------------------
 * QUICK DEBUG MODE (temporary)
 * --------------------------------------------------------
 *
 * From the browser console:
 *
 *   window.DEBUG_ALL = true
 *
 * This enables ALL debug logs without touching localStorage.
 *
 *
 * --------------------------------------------------------
 * DISABLE DEBUG
 * --------------------------------------------------------
 *
 * localStorage.removeItem('debug_namespaces')
 *
 * or
 *
 * localStorage.setItem('debug_namespaces', '')
 *
 *
 * --------------------------------------------------------
 * WHY THIS EXISTS
 * --------------------------------------------------------
 *
 * - Prevent noisy console logs in production
 * - Allow debugging customer issues live
 * - Enable specific subsystems only (http, auth, etc.)
 *
 */

type DebugNamespace = 'notifications' | 'auth' | 'http' | 'shell';

function readNamespaces(): string[] {
  try {
    const raw = localStorage.getItem('debug_namespaces') || '';

    return raw
      .split(',')
      .map((x: string) => x.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function isEnabled(namespace: DebugNamespace): boolean {
  try {
    const win = window as any;

    // Global override
    if (win.DEBUG_ALL === true) return true;

    const namespaces = readNamespaces();

    return namespaces.includes('*') || namespaces.includes(namespace);
  } catch {
    return false;
  }
}

/**
 * Normal debug logger
 *
 * Example:
 * debug('http', 'GET /users', params)
 */
export function debug(namespace: DebugNamespace, ...args: any[]) {
  if (!isEnabled(namespace)) return;

  console.log(`[${namespace}]`, ...args);
}

/**
 * Error debug logger
 *
 * Example:
 * debugError('auth', 'login failed', error)
 */
export function debugError(namespace: DebugNamespace, ...args: any[]) {
  if (!isEnabled(namespace)) return;

  console.error(`[${namespace}]`, ...args);
}
