import type { KyInstance } from 'ky'
import type { AbstractApiMethod } from './modules/types'

const transformUrl = (
  url: string,
  {
    param,
    query,
  }: { query?: Record<string, unknown>; param?: Record<string, unknown> },
) => {
  let result = url

  if (param) {
    Object.entries(param).forEach(([key, value]) => {
      result = result.replaceAll(`:${key}`, String(value))
    })
  }

  const searchParams = new URLSearchParams()

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })
  }

  return `${result}?${searchParams.toString()}`
}

export const apiCall = async <T extends AbstractApiMethod>(
  client: KyInstance,
  {
    url,
    method,
    query,
    param,
    body,
  }: {
    query?: T['Query']
    param?: T['Param']
    body?: T['Body']
    method: string
    url: string
  },
): Promise<T['Return']> => {
  const data = await client(transformUrl(url, { query, param }), {
    body: JSON.stringify(body),
    method,
  })

  return data.json<T['Return']>()
}
