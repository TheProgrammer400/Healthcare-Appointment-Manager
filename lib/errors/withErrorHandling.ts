import { NextResponse } from 'next/server';
import { AppError } from './AppError';

export type ApiResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

export function successResponse<T>(data: T, status = 200, headers?: HeadersInit): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status, headers });
}

export function errorResponse(
  message: string,
  code: string,
  status = 500,
  details?: unknown,
  headers?: HeadersInit
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status, headers }
  );
}

export function withErrorHandling<T>(
  handler: (req: Request, context?: any) => Promise<NextResponse<T>>
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (err: any) {
      if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('DYNAMIC_SERVER_USAGE')) {
        throw err;
      }
      if (err instanceof AppError) {
        return errorResponse(err.message, err.code, err.statusCode, err.details);
      }

      console.error('[Unhandled API Error]:', err);
      return errorResponse('An unexpected internal server error occurred', 'INTERNAL_ERROR', 500);
    }
  };
}
