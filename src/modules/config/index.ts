import { join } from 'node:path'
import { isStringLiteral } from 'typescript'
import type { z } from 'zod'
import type { ErrorMessageOptions } from 'zod-error'
import { generateErrorMessage } from 'zod-error'
import { Fs } from '../fs'
import { logger } from '../logger'
import { Parser } from '../parser'
import { DEFAULT_CONFIG_PATH, DEFAULT_MAIN_PATH } from './constants'
import type { ConfigDTO, MainFileDTO } from './schema'
import { configSchema, mainFileSchema } from './schema'
import { findGlobalPrefixNode } from './utils'

export { configSchema } from './schema'

const options: ErrorMessageOptions = {
  delimiter: {
    error: ' 🔥 ',
  },
  transform: ({ errorMessage, index }) =>
    `Error #${index + 1}: ${errorMessage}`,
}

export class Config {
  private config!: ConfigDTO
  private mainFileConfig!: MainFileDTO
  private parser = new Parser()

  constructor(private readonly mainPath = DEFAULT_MAIN_PATH) {}

  public async setup(inlineConfig: Partial<z.infer<typeof configSchema>>) {
    const configPath = join(process.cwd(), DEFAULT_CONFIG_PATH)

    const content = configSchema.safeParse(
      JSON.parse(await Fs.read(configPath)),
    )
    const { error, data } = await configSchema.safeParseAsync({
      ...content.data,
      ...inlineConfig,
    })

    if (error) {
      throw generateErrorMessage(error.issues, options)
    }

    await this.setupMainFile(join(data.repo, this.mainPath))

    this.config = data

    return this
  }

  public get() {
    return { ...this.config, ...this.mainFileConfig }
  }

  private async setupMainFile(mainFilePath: string) {
    const content = await Fs.read(mainFilePath)

    const [node] = findGlobalPrefixNode(this.parser.setup(content).getNodes())

    if (!node) {
      logger.warn(`Not found globalPrefix in ${mainFilePath}`)

      this.mainFileConfig = {}

      return
    }

    const [stringLiteralArgument] = node.arguments
    const [apiPrefixExpression] = isStringLiteral(stringLiteralArgument)
      ? [stringLiteralArgument]
      : []

    const { error, data } = await mainFileSchema.safeParseAsync({
      globalPrefix: apiPrefixExpression?.text,
    })

    if (error) {
      this.mainFileConfig = {}

      return
    }

    this.mainFileConfig = data
  }
}
