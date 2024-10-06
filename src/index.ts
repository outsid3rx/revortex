#!/usr/bin/env node

import { Command } from 'commander'

import { Config } from './modules/config'

const program = new Command()

program
  .name('vort_ex')
  .description('Generate REST API for frontend projects from Nest controllers')
  .version('1.0.0')

program.option('-p, --path <path>', 'Nest application path')

program.parse(process.argv)

const main = async () => {
  await new Config(program.opts().path).setup()
}

void main()
