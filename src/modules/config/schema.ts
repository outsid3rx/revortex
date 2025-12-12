import { z } from 'zod'

import { DEFAULT_MAIN_PATH, DEFAULT_SOURCE_DIR } from './constants'

export const configSchema = z.object({
  mainPath: z.string().optional().default(DEFAULT_MAIN_PATH),
  sourceDir: z.string().optional().default(DEFAULT_SOURCE_DIR),
  alias: z.string().optional(),
  file: z.string().optional(),
  repo: z.string(),
  out: z.string(),
})

export const partialConfigSchema = configSchema.partial()

export const mainFileSchema = z.object({
  globalPrefix: z.string().optional(),
})

export type ConfigDTO = z.infer<typeof configSchema>
export type MainFileDTO = z.infer<typeof mainFileSchema>
