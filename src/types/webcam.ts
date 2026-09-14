export type WebcamStatus = 'idle' | 'requesting' | 'ready' | 'stopped' | 'denied' | 'error'

export type WebcamErrorCode =
  'NOT_SUPPORTED' | 'NOT_ALLOWED' | 'NOT_FOUND' | 'NOT_READABLE' | 'OVERCONSTRAINED' | 'UNKNOWN'

export interface WebcamError {
  code: WebcamErrorCode
  message: string
}
