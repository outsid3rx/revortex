import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { ast, query } from '@phenomnomnominal/tsquery'
import type { CallExpression } from 'typescript'

export const execAsync = promisify(exec)

export const findGlobalPrefixNode = (source: string) =>
  query<CallExpression>(
    ast(source),
    'CallExpression[expression.name.escapedText="setGlobalPrefix"]',
  )
