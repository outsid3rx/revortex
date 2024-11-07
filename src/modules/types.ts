export interface AbstractApiMethod {
  Return: unknown | never
  Body?: unknown | never
  Query?: Record<string, unknown>
  Param?: Record<string, unknown>
}
