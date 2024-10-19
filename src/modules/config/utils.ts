import type { NodeArray, Statement } from 'typescript'
import {
  isCallExpression,
  isExpressionStatement,
  isFunctionDeclaration,
  isPropertyAccessExpression,
} from 'typescript'

export const findGlobalPrefixNode = (nodes: NodeArray<Statement>) =>
  nodes
    .filter(isFunctionDeclaration)
    .flatMap((statement) => statement.body?.statements)
    .filter(Boolean)
    .filter(isExpressionStatement)
    .map((statement) => statement.expression)
    .filter(isCallExpression)
    .filter(
      (statement) =>
        isPropertyAccessExpression(statement.expression) &&
        statement.expression.name.escapedText === 'setGlobalPrefix',
    )
