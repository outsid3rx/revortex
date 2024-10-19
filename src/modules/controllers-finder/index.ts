import { join } from 'path'

import type { Config } from '../config'
import { Fs } from '../fs'
import { isController } from './utils'

export class ControllersFinder {
  constructor(private readonly config: Config) {}

  public async find() {
    const { repo, sourceDir } = this.config.get()
    const files = await Fs.findFilesRecursive(join(repo, sourceDir))

    return files.filter(isController)
  }
}
