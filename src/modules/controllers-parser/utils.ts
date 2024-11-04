import type {
  ClassDeclaration,
  Decorator,
  NodeArray,
  ParameterDeclaration,
} from 'typescript'
import {
  isCallExpression,
  isDecorator,
  isIdentifier,
  isStringLiteral,
} from 'typescript'

import { API_METHOD_DECORATOR_NAME } from './constants'
import type { IParameterDeclaration } from './types'
import { METHOD_TYPE_MAP, METHODS, MethodType } from './types'

export const findControllerDecorator = (decorators: Decorator[]) =>
  decorators.find(
    (decorator) =>
      isCallExpression(decorator.expression) &&
      isIdentifier(decorator.expression.expression) &&
      decorator.expression.expression.escapedText === 'Controller',
  )

export const isControllerClass = (declaration: ClassDeclaration) => {
  if (!declaration.modifiers) {
    return false
  }

  return Boolean(
    findControllerDecorator(declaration.modifiers.filter(isDecorator)),
  )
}

export const findMethodDecorator = (decorators: Decorator[]) =>
  decorators.find(
    (decorator) =>
      isCallExpression(decorator.expression) &&
      isIdentifier(decorator.expression.expression) &&
      API_METHOD_DECORATOR_NAME.includes(
        String(decorator.expression.expression.escapedText),
      ),
  )

export const getControllerData = (controller: ClassDeclaration) => {
  const controllerDecorator = findControllerDecorator(
    controller.modifiers!.filter(isDecorator),
  )
  const controllerArgument =
    controllerDecorator?.expression &&
    isCallExpression(controllerDecorator.expression) &&
    controllerDecorator.expression.arguments[0]

  const controllerPath =
    controllerArgument && isStringLiteral(controllerArgument)
      ? controllerArgument.text
      : ''

  return { controllerPath }
}

const getDecoratorName = (decorator: Decorator) => {
  return isCallExpression(decorator.expression) &&
    isIdentifier(decorator.expression.expression) &&
    decorator.expression.expression.escapedText
    ? METHOD_TYPE_MAP[String(decorator.expression.expression.escapedText)]
    : ''
}

export const getParameters = (parameters: NodeArray<ParameterDeclaration>) => {
  const result: IParameterDeclaration[] = []

  parameters.forEach((parameter, index) => {
    const decorator = parameter.modifiers?.find(isDecorator)

    if (!decorator || !METHODS.includes(getDecoratorName(decorator))) {
      return
    }

    const decoratorName = getDecoratorName(decorator) as MethodType

    const shouldGetParameter = decoratorName !== MethodType.Body

    return result.push({
      type: decoratorName,
      name: isIdentifier(parameter.name) ? parameter.name.text : '',
      parameterTypeIndex: shouldGetParameter
        ? getDecoratorArguments(decorator, index)
        : index,
    })
  })

  return mergeParameters(result)
}

export const getDecoratorArguments = (decorator: Decorator, index: number) => {
  const args = [
    ...(isCallExpression(decorator.expression)
      ? decorator.expression.arguments
      : []),
  ]
  const [name] = args

  return isEmpty(args) || !isStringLiteral(name)
    ? index
    : { [name.text]: index }
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

function isEmpty(value: Record<string, unknown>): boolean
function isEmpty(value: unknown[]): boolean
function isEmpty(value: unknown) {
  if (Array.isArray(value)) {
    return value.length === 0
  }

  return typeof value === 'object' && value
    ? Object.keys(value).length === 0
    : false
}
