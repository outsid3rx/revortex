import { join } from 'node:path'
import { isEmpty } from 'es-toolkit/compat'
import { Project, type StringLiteral } from 'ts-morph'
import { logger } from '../logger'
import { API_METHOD_DECORATOR_NAME } from './constants'
import type { ControllersData } from './types'
import {
  getControllerData,
  getFilePath,
  getParameters,
  isControllerClass,
} from './utils'

export class ControllersParser {
  private project = new Project()

  public constructor(path: string) {
    this.project.addSourceFilesAtPaths(`${path}/**/*.controller.ts`)
  }

  public setup(): ControllersData {
    return this.project.getSourceFiles().flatMap((file) => {
      const controllers = file.getClasses().filter(isControllerClass)

      if (isEmpty(controllers)) {
        return []
      }

      return controllers.map((controller) => {
        const { controllerPath } = getControllerData(controller)

        return {
          name: String(controller.getName()),
          fileName: getFilePath(file),
          members: controller
            .getMethods()
            .map((method) => {
              const methodDecorator = method
                .getDecorators()
                .find((decorator) =>
                  API_METHOD_DECORATOR_NAME.includes(decorator.getName()),
                )

              if (!methodDecorator) {
                logger.info(
                  `Method decorator for method ${method.getName()} in controller ${controller.getName()} is not set, file will be skipped`,
                )
                return undefined
              }

              const params = getParameters(method.getParameters()).filter(
                Boolean,
              )
              const methodName = methodDecorator.getName() || 'Get'
              const [pathExpression] = methodDecorator.getArguments()
              const path =
                (pathExpression as StringLiteral)?.getLiteralText() || ''

              return {
                path: join(controllerPath, path),
                name: method.getName(),
                method: methodName,
                params,
              }
            })
            .filter(Boolean),
        }
      })
    })
  }
}
