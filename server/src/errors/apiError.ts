export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const notImplemented = (feature: string) =>
  new ApiError(501, 'FEATURE_NOT_IMPLEMENTED', `${feature} is not implemented yet.`);
