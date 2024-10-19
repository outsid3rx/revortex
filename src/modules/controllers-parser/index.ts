import {
  isCallExpression,
  isClassDeclaration,
  isDecorator,
  isIdentifier,
  isMethodDeclaration,
  isStringLiteral,
} from 'typescript'

import { logger } from '../logger'
import { Parser } from '../parser'
import type { IClassDeclaration } from './types'
import {
  findMethodDecorator,
  getControllerData,
  getParameters,
  isControllerClass,
} from './utils'

export class ControllersParser {
  private parser = new Parser()
  private fileContent!: string
  private fileName!: string

  public setup(fileName: string, fileContent: string) {
    this.fileContent = fileContent
    this.fileName = fileName

    return this
  }

  public getMethods() {
    const nodes = this.parser.setup(this.fileContent).getNodes()

    const controllers = nodes
      .filter(isClassDeclaration)
      .filter(isControllerClass)

    if (!controllers) {
      return {}
    }

    return controllers.reduce<Record<string, IClassDeclaration>>(
      (acc, controller) => {
        if (!controller.name?.escapedText) {
          return acc
        }

        const { controllerPath } = getControllerData(controller)

        acc[this.fileName] = {
          name: controller.name.escapedText,
          fileName: this.fileName,
          members: controller.members
            .filter(isMethodDeclaration)
            .map((method) => {
              const methodDecorator = findMethodDecorator(
                method.modifiers?.filter(isDecorator) || [],
              )

              if (!methodDecorator) {
                logger.info(
                  `Method decorator for method ${isIdentifier(method.name) && method.name.escapedText} in controller ${this.fileName} is not set, file will be skipped`,
                )
                return undefined
              }

              const { expression, arguments: args } = isCallExpression(
                methodDecorator.expression,
              )
                ? methodDecorator.expression
                : {}

              if (!args || !expression) {
                return undefined
              }

              const [textExpression] = args

              const params = getParameters(method.parameters)

              return {
                path:
                  controllerPath +
                  (isStringLiteral(textExpression) ? textExpression.text : ''),
                name: isIdentifier(method.name)
                  ? String(method.name.escapedText)
                  : '',
                method: isIdentifier(expression)
                  ? expression.escapedText
                  : 'Get',
                params,
              }
            })
            .filter(Boolean),
        }

        return acc
      },
      {},
    )
  }
}
