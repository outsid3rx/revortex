import { join } from 'path'
import { ErrorMessageOptions, generateErrorMessage } from 'zod-error'

import { Fs } from '../fs'
import { logger } from '../logger'
import {
  isCallExpression,
  isExpressionStatement,
  isFunctionDeclaration,
  isPropertyAccessExpression,
  isStringLiteral,
  Parser,
} from '../parser'
import { DEFAULT_CONFIG_PATH, DEFAULT_MAIN_PATH } from './constants'
import { ConfigDTO, configSchema, MainFileDTO, mainFileSchema } from './schema'

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
  private parser: Parser

  constructor(
    private readonly path: string,
    private readonly mainPath = DEFAULT_MAIN_PATH,
  ) {
    this.parser = new Parser()
  }

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

    await this.setupMainFile(data?.mainPath || this.mainPath)

    this.config = data

    return this
  }

  public get() {
    return { ...this.config, ...this.mainFileConfig }
  }

  private async setupMainFile(mainPath: string) {
    const filePath = join(this.path, mainPath)
    const content = await Fs.read(filePath)

    const [node] = this.parser
      .setup(content)
      .getNodes()
      .filter(isFunctionDeclaration)
      .flatMap((statement) => statement.body?.statements)
      .filter(Boolean)
      .filter(isExpressionStatement)
      .map((statement) => statement.expression)
      .filter(isCallExpression)
      .filter(
        (statement) =>
          isPropertyAccessExpression(statement.expression) &&
          statement.expression.name.escapedText === 'setGlobalPrefix',
      )

    if (!node) {
      logger.warn(`Not found globalPrefix in ${filePath}`)

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
