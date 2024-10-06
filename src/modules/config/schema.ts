import { z } from 'zod'

export const configSchema = z.object({
  mainPath: z.string().optional(),
})

export const mainFileSchema = z.object({
  globalPrefix: z.string().optional(),
})

export type ConfigDTO = z.infer<typeof configSchema>
export type MainFileDTO = z.infer<typeof mainFileSchema>
