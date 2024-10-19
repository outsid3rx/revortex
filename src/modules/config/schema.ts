import { z } from 'zod'

import { DEFAULT_MAIN_PATH, DEFAULT_SOURCE_DIR } from './constants'

export const configSchema = z.object({
  mainPath: z.string().optional().default(DEFAULT_MAIN_PATH),
  sourceDir: z.string().optional().default(DEFAULT_SOURCE_DIR),
  repo: z.string(),
  importAliasSrcDir: z.string().optional(),
})

export const mainFileSchema = z.object({
  globalPrefix: z.string().optional(),
})

export type ConfigDTO = z.infer<typeof configSchema>
export type MainFileDTO = z.infer<typeof mainFileSchema>
