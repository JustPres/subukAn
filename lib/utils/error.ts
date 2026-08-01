/**
 * Safely converts raw database/Postgres/Postgrest errors into generic, user-friendly
 * error messages to prevent Information Leakage (CWE-209).
 */
export function sanitizeDatabaseError(error: unknown, fallbackMessage: string = 'An unexpected system error occurred. Please try again later.'): string {
  if (!error) {
    return fallbackMessage;
  }

  // Log raw details securely to console for debugging/tracing
  console.error('[DB Security Log] Raw Error:', error);

  let message = '';
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    message = String((error as any).message);
  } else {
    message = String(error);
  }

  const lowercaseMsg = message.toLowerCase();

  // Check for common indicators of database schema exposure or SQL details
  const isSensitive = 
    lowercaseMsg.includes('schema cache') ||
    lowercaseMsg.includes('could not find') ||
    lowercaseMsg.includes('relation') ||
    lowercaseMsg.includes('column') ||
    lowercaseMsg.includes('syntax error') ||
    lowercaseMsg.includes('violates foreign key') ||
    lowercaseMsg.includes('duplicate key value') ||
    lowercaseMsg.includes('violates check constraint') ||
    lowercaseMsg.includes('row level security') ||
    lowercaseMsg.includes('rls') ||
    lowercaseMsg.includes('infinite recursion') ||
    lowercaseMsg.includes('pgrst') ||
    lowercaseMsg.includes('postgres') ||
    lowercaseMsg.includes('database');

  if (isSensitive) {
    return fallbackMessage;
  }

  return message || fallbackMessage;
}
