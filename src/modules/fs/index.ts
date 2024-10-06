import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import readdirp from 'readdirp'

export class Fs {
  static read(path: string) {
    return readFile(path, { encoding: 'utf-8' })
  }

  static async findFilesRecursive(path: string) {
    const result: string[] = []

    for await (const entry of readdirp(path)) {
      const { path } = entry
      result.push(path)
    }

    return result
  }

  static isExists(path: string) {
    return existsSync(path)
  }
}
