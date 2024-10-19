#!/usr/bin/env node

import { join } from 'path'
import { Command } from 'commander'

import { Config } from './modules/config'
import { ControllersFinder } from './modules/controllers-finder'
import { ControllersParser } from './modules/controllers-parser'
import { Fs } from './modules/fs'

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

  await Promise.all(
    controllers.map(async (controller) => {
      const fileContent = await Fs.read(join(repo, sourceDir, controller))
      const parser = new ControllersParser().setup(controller, fileContent)

      parser.getMethods()
    }),
  )
}

void main()
