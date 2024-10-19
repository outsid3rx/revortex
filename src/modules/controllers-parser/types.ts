export enum MethodType {
  Body = 'Body',
  Query = 'Query',
  Params = 'Params',
}

export const METHOD_TYPE_MAP: Record<string, MethodType> = {
  [MethodType.Body]: MethodType.Body,
  [MethodType.Query]: MethodType.Query,
  [MethodType.Params]: MethodType.Params,
}

interface IMethodDeclaration {
  name: string
  path: string
  params: IParameterDeclaration[]
}

export interface IClassDeclaration {
  name: string
  fileName: string
  members: IMethodDeclaration[]
}

export interface IParameterDeclaration {
  index: number
  name: string
  type: MethodType
}
