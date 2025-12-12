import type { IApiWrapperParameterEntry } from './types'

export const removeExtension = (filename: string) =>
  filename.replace(/\.[^/.]+$/, '')

export const toPascalCase = (name: string) =>
  `${name.charAt(0).toUpperCase()}${name.slice(1)}`

export const createApiWrapperParameters = (
  temporalType: string,
): IApiWrapperParameterEntry[] => [
  {
    name: 'query',
    temporalType,
  },
  {
    name: 'param',
    temporalType,
  },
  { name: 'body', temporalType },
]
