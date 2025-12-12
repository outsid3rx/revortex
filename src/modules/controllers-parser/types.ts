export enum MethodType {
  Body = 'Body',
  Query = 'Query',
  Param = 'Param',
  Return = 'Return',
}

export const METHODS = Object.values(MethodType)

export interface IMethodDeclaration {
  name: string
  path: string
  params: IParameterDeclaration[]
  method: MethodType
}

export interface IClassDeclaration {
  name: string
  fileName: string
  members: IMethodDeclaration[]
}

export interface IParameterDeclaration {
  name: string
  type: MethodType
  parameterTypeIndex: Record<string, number> | number
}

export type ControllersData = IClassDeclaration[]
