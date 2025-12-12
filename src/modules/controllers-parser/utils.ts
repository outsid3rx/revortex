import type {
  ClassDeclaration,
  Decorator,
  ParameterDeclaration,
  SourceFile,
  StringLiteral,
} from 'ts-morph'
import { type IParameterDeclaration, METHODS, MethodType } from './types'

export const getFilePath = (file: SourceFile) => {
  const [, path] = file.getFilePath().split('/src/')

  return path || ''
}

export const getDecoratorArguments = (decorator: Decorator, index: number) => {
  const [name] = decorator.getArguments()

  return name ? { [(name as StringLiteral).getLiteralText()]: index } : index
}

export const getParameters = (parameters: ParameterDeclaration[]) => {
  return mergeParameters(
    parameters
      .map((parameter, index) => {
        const [decorator] = parameter.getDecorators()

        if (!decorator || !METHODS.includes(decorator.getName())) {
          return undefined
        }

        const decoratorName = decorator.getName() as MethodType
        const shouldGetParameter = decoratorName !== MethodType.Body

        return {
          type: decoratorName,
          name: parameter.getName(),
          parameterTypeIndex: shouldGetParameter
            ? getDecoratorArguments(decorator, index)
            : index,
        }
      })
      .filter(Boolean),
  )
}

export const findControllerDecorator = (decorators: Decorator[]) =>
  decorators.find((decorator) => decorator.getName() === 'Controller')

export const isControllerClass = (declaration: ClassDeclaration) => {
  if (declaration.getModifiers().length === 0) {
    return false
  }

  return Boolean(findControllerDecorator(declaration.getDecorators()))
}

export const getControllerData = (controller: ClassDeclaration) => {
  const decorator = findControllerDecorator(
    controller.getDecorators(),
  ) as Decorator
  const [path] = decorator.getArguments()

  if (!path) {
    return { controllerPath: '' }
  }

  return { controllerPath: (path as StringLiteral).getLiteralText() }
}

export const mergeParameters = (
  parameters: IParameterDeclaration[],
): IParameterDeclaration[] => {
  const [body] = parameters.filter((param) => param.type === MethodType.Body)
  const query = parameters.filter((param) => param.type === MethodType.Query)
  const params = parameters.filter((param) => param.type === MethodType.Param)

  const mergedQuery = {
    ...query[0],
    parameterTypeIndex: query.reduce((acc, param) => {
      if (typeof param.parameterTypeIndex === 'number') {
        return acc
      }
      return { ...acc, ...param.parameterTypeIndex }
    }, {}),
  }

  const mergedParams = {
    ...params[0],
    parameterTypeIndex: params.reduce((acc, param) => {
      if (typeof param.parameterTypeIndex === 'number') {
        return acc
      }
      return { ...acc, ...param.parameterTypeIndex }
    }, {}),
  }

  return [body, mergedQuery, mergedParams]
}
