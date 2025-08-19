import { existsSync } from 'node:fs'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'

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

  static isExists(path: string) {
    return existsSync(path)
  }
}
