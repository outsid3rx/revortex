import { join } from 'path'
import { isStringLiteral } from 'typescript'
import type { ErrorMessageOptions } from 'zod-error'
import { generateErrorMessage } from 'zod-error'

import { Fs } from '../fs'
import { logger } from '../logger'
import { Parser } from '../parser'
import { DEFAULT_CONFIG_PATH, DEFAULT_MAIN_PATH } from './constants'
import type { ConfigDTO, MainFileDTO } from './schema'
import { configSchema, mainFileSchema } from './schema'
import { findGlobalPrefixNode } from './utils'

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

  public async setup() {
    const configPath = join(process.cwd(), DEFAULT_CONFIG_PATH)

    if (!Fs.isExists(configPath)) {
      throw new Error(`Config file not found: ${configPath}`)
    }

    const content = await Fs.read(configPath)
    const { error, data } = await configSchema.safeParseAsync(
      JSON.parse(content),
    )

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

      return (this.mainFileConfig = {})
    }

    const [stringLiteralArgument] = node.arguments
    const [apiPrefixExpression] = isStringLiteral(stringLiteralArgument)
      ? [stringLiteralArgument]
      : []

    const { error, data } = await mainFileSchema.safeParseAsync({
      globalPrefix: apiPrefixExpression?.text,
    })

    if (error) {
      return (this.mainFileConfig = {})
    }

    return (this.mainFileConfig = data)
  }
}
