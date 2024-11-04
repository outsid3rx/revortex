#!/usr/bin/env node

import { Command } from 'commander'
import { join } from 'node:path'

import { OUT_FILE_NAME } from './constants'
import { Config } from './modules/config'
import { ControllersFinder } from './modules/controllers-finder'
import { ControllersParser } from './modules/controllers-parser'
import { Fs } from './modules/fs'
import { Generator } from './modules/generator'

export { AbstractApiMethod, apiCall } from './modules/lib'

const program = new Command()

program
  .name('vort_ex')
  .description('Generate REST API for frontend projects from Nest controllers')
  .version('1.0.0')

program.parse(process.argv)

const main = async () => {
  const config = await new Config().setup()
  const controllers = await new ControllersFinder(config).find()

  const { repo, sourceDir } = config.get()

  const generator = new Generator(
    config.get().importAliasSrcDir || repo + sourceDir,
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

  const outDir = join(config.get().outDir)

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
