import ts from 'typescript'

export const isFunctionDeclaration = (
  statement: ts.Statement,
): statement is ts.FunctionDeclaration => {
  return statement.kind === ts.SyntaxKind.FunctionDeclaration
}

export const isExpressionStatement = (
  statement: ts.Statement,
): statement is ts.ExpressionStatement => {
  return statement.kind === ts.SyntaxKind.ExpressionStatement
}

export const isCallExpression = (
  statement: ts.Expression,
): statement is ts.CallExpression => {
  return statement.kind === ts.SyntaxKind.CallExpression
}

export const isPropertyAccessExpression = (
  statement: ts.Expression,
): statement is ts.PropertyAccessExpression => {
  return statement.kind === ts.SyntaxKind.PropertyAccessExpression
}

export const isStringLiteral = (
  statement: ts.Expression,
): statement is ts.StringLiteral => {
  return statement.kind === ts.SyntaxKind.StringLiteral
}
