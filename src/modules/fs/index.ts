import { existsSync } from 'node:fs'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import readdirp from 'readdirp'

export class Fs {
  static removeFile(path: string) {
    return unlink(path)
  }

  static mkdir(path: string) {
    return mkdir(path)
  }

  static read(path: string) {
    return readFile(path, { encoding: 'utf-8' })
  }

  static write(path: string, content: string) {
    return writeFile(path, content, { encoding: 'utf-8' })
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
