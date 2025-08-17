#!/usr/bin/env node

import { join } from 'node:path'
import { Command } from 'commander'
import type { z } from 'zod'
import packageJson from '../package.json'
import { OUT_FILE_NAME } from './constants'
import type { configSchema } from './modules/config'
import { Config } from './modules/config'
import { ControllersFinder } from './modules/controllers-finder'
import { ControllersParser } from './modules/controllers-parser'
import { Fs } from './modules/fs'
import { Generator } from './modules/generator'

export * from './modules/types'

const program = new Command()

program
  .name('vort_ex')
  .description('Generate REST API for frontend projects from Nest controllers')
  .version(packageJson.version)
  .option('-o, --out <string>', 'Output directory for generated file')
  .option('-a, --alias <string>', 'Import alias for imported files')
  .option('-s, --sourceDir <string>', 'Alias for src directory')
  .argument('[repo], <string>', 'Path to the Nest repository root')

program.parse(process.argv)
const options = program.opts()

const main = async () => {
  const inlineConfig: Partial<z.infer<typeof configSchema>> = {
    ...(options.outDir ? { out: options.out } : {}),
    ...(options.alias ? { alias: options.alias } : {}),
    ...(options.sourceDir ? { sourceDir: options.sourceDir } : {}),
    ...(program.args[0] ? { repo: program.args[0] } : {}),
  }

  const config = await new Config().setup(inlineConfig)
  const controllers = await new ControllersFinder(config).find()

  const { repo, sourceDir } = config.get()

  const generator = new Generator(
    config.get().alias || repo + sourceDir,
    config.get().globalPrefix,
  )

  const parsedControllers = (
    await Promise.all(
      controllers.map(async (controller) => {
        const fileContent = await Fs.read(join(repo, sourceDir, controller))

        if (!fileContent) {
          return
        }

        return new ControllersParser()
          .setup(controller, fileContent)
          .getMethods()
      }),
    )
  )
    .filter(Boolean)
    .flat()

  const outDir = join(config.get().out)

  if (!Fs.isExists(outDir)) {
    await Fs.mkdir(outDir)
  }

  const outFilePath = join(outDir, OUT_FILE_NAME)

  if (Fs.isExists(outFilePath)) {
    await Fs.removeFile(outFilePath)
  }

  await Fs.write(
    outFilePath,
    generator
      .generateImports(parsedControllers)
      .createMainNamespace(parsedControllers)
      .createApiWrapper(parsedControllers)
      .print(),
  )
}

void main()
