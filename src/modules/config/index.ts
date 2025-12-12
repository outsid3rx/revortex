import { join } from 'node:path'
import { isStringLiteral } from 'typescript'
import type { z } from 'zod'
import { generateErrorMessage } from 'zod-error'
import { Fs } from '../fs'
import { logger } from '../logger'
import {
  DEFAULT_CONFIG_PATH,
  DEFAULT_MAIN_PATH,
  zodErrorOptions,
} from './constants'
import {
  type ConfigDTO,
  configSchema,
  type MainFileDTO,
  mainFileSchema,
  partialConfigSchema,
} from './schema'
import { execAsync, findGlobalPrefixNode } from './utils'

export { configSchema } from './schema'

export class Config {
  private config!: ConfigDTO
  private mainFileConfig!: MainFileDTO

  constructor(private readonly mainPath = DEFAULT_MAIN_PATH) {}

  public async setup(inlineConfigData: Partial<z.infer<typeof configSchema>>) {
    const [inlineConfig, configFileData, packageJsonConfig] = await Promise.all(
      [
        this.parseInlineConfig(inlineConfigData),
        this.readConfigFile(),
        this.readPackageJsonConfig(),
      ],
    )

    const { error, data } = await configSchema.safeParseAsync({
      ...packageJsonConfig,
      ...configFileData,
      ...inlineConfig,
    })

    if (error) {
      throw generateErrorMessage(error.issues, zodErrorOptions)
    }

    await this.setupMainFile(join(data.repo, this.mainPath))

    this.config = data

    return this
  }

  public get() {
    return { ...this.config, ...this.mainFileConfig }
  }

  private async readConfigFile(): Promise<
    Partial<z.infer<typeof configSchema>>
  > {
    const configPath = join(process.cwd(), DEFAULT_CONFIG_PATH)
    try {
      const content = await Fs.read(configPath)
      const { data } = await partialConfigSchema.safeParseAsync(
        JSON.parse(content),
      )

      return data || {}
    } catch (_) {
      return {}
    }
  }

  private async readPackageJsonConfig(): Promise<
    Partial<z.infer<typeof configSchema>>
  > {
    const { stdout } = await execAsync('npm pkg get revortex')

    try {
      const { data } = await partialConfigSchema.safeParseAsync(
        JSON.parse(stdout) as Partial<z.infer<typeof configSchema>>,
      )

      return data || {}
    } catch (_) {
      return {}
    }
  }

  private async parseInlineConfig(
    inlineConfig: Partial<z.infer<typeof configSchema>>,
  ): Promise<Partial<z.infer<typeof configSchema>>> {
    const { data } = await partialConfigSchema.safeParseAsync(inlineConfig)

    return data || {}
  }

  private async setupMainFile(mainFilePath: string) {
    const content = await Fs.read(mainFilePath)

    const [node] = findGlobalPrefixNode(content)

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
