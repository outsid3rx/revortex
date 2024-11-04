import type { IApiWrapperParameterEntry, IImportEntry } from './types'

export const BASE_IMPORTS: IImportEntry[] = [
  {
    name: 'KyInstance',
    from: 'ky',
    isType: true,
  },
  {
    name: 'AbstractApiMethod',
    from: 'vort_ex',
    isType: true,
  },
]

export const TOKENS = {
  PARAMETERS: 'Parameters',
  AWAITED: 'Awaited',
  RETURN_TYPE: 'ReturnType',
  TEMPORAL_TYPE: 'T',
  STRING: 'string',
  URL: 'url',
  METHOD: 'method',
  PROMISE: 'Promise',
  OPTIONS: 'options',
  CLIENT: 'client',
  API: 'Api',
}

export const API_WRAPPER_BASE_PARAMETERS: IApiWrapperParameterEntry[] = [
  {
    name: 'param',
  },
  {
    name: 'query',
  },
  {
    name: 'body',
  },
  {
    name: TOKENS.METHOD,
  },
  {
    name: TOKENS.URL,
  },
]

export const API_WRAPPER_BASE_BINDINGS = ['query', 'param', 'body']

export const FUNC_TOKENS = {
  CREATE_API: 'createApi',
  KY_INSTANCE: 'kyInstance',
  KY_INSTANCE_TYPE: 'KyInstance',
  API_CALL_WRAPPER: 'apiCallWrapper',
  ABSTRACT_API_METHOD: 'AbstractApiMethod',
}

export const NEW_LINE_TOKEN = '\n'
