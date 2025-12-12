import type { ErrorMessageOptions } from 'zod-error'

export const DEFAULT_SOURCE_DIR = 'src/'
export const DEFAULT_MAIN_PATH = './src/main.ts'
export const DEFAULT_CONFIG_PATH = './revortex.json'

export const zodErrorOptions: ErrorMessageOptions = {
  delimiter: {
    error: ' 🔥 ',
  },
  transform: ({ errorMessage, index }) =>
    `Error #${index + 1}: ${errorMessage}`,
}
