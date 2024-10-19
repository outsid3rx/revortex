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
import { METHOD_TYPE_MAP, MethodType } from './types'

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

const getDecoratorName = (decorator: Decorator) =>
  isCallExpression(decorator.expression) &&
  isIdentifier(decorator.expression.expression) &&
  String(decorator.expression.expression.escapedText)
    ? METHOD_TYPE_MAP[String(decorator.expression.expression.escapedText)]
    : ''

export const getParameters = (parameters: NodeArray<ParameterDeclaration>) => {
  const result: IParameterDeclaration[] = []

  parameters.forEach((parameter, index) => {
    const decorator = parameter.modifiers?.find(isDecorator)

    if (!decorator) {
      return
    }

    return result.push({
      type: getDecoratorName(decorator) || MethodType.Body,
      index,
      name: isIdentifier(parameter.name) ? parameter.name.text : '',
    })
  })

  return result
}
