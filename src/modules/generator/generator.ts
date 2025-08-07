import { Project } from 'ts-morph'
import {
  createPrinter,
  createSourceFile,
  EmitHint,
  factory,
  NewLineKind,
  ScriptKind,
  ScriptTarget,
  SyntaxKind,
} from 'typescript'

import type {
  ControllersData,
  IParameterDeclaration,
} from '../controllers-parser/types'
import { METHODS, MethodType } from '../controllers-parser/types'
import {
  API_WRAPPER_BASE_BINDINGS,
  API_WRAPPER_BASE_PARAMETERS,
  BASE_IMPORTS,
  FUNC_TOKENS,
  TOKENS,
} from './constants'
import type { IApiWrapperParameterEntry } from './types'
import {
  createApiWrapperParameters,
  removeExtension,
  toPascalCase,
} from './utils'

export class Generator {
  private project = new Project()
  private tsMorphSourceFile = this.project.createSourceFile('index.ts')
  private tsSourceFile = createSourceFile(
    'index.ts',
    '',
    ScriptTarget.Latest,
    false,
    ScriptKind.TS,
  )

  private printer = createPrinter({ newLine: NewLineKind.LineFeed })

  constructor(
    private readonly importAliasSrcDir: string,
    private readonly globalPrefix = '',
  ) {}

  public generateImports(controllers: ControllersData) {
    this.tsMorphSourceFile.addImportDeclarations(
      [
        ...BASE_IMPORTS,
        ...controllers.map(({ name, fileName }) => ({
          from: this.importAliasSrcDir + removeExtension(fileName),
          isType: false,
          name,
        })),
      ].map(({ name, from, isType }) => ({
        namedImports: [name],
        isTypeOnly: isType,
        moduleSpecifier: from,
      })),
    )

    return this
  }

  public createMainNamespace(controllers: ControllersData) {
    const apiNamespace = this.tsMorphSourceFile.addModule({
      name: TOKENS.API,
      isExported: true,
    })

    controllers.forEach(({ name: controllerName, members }) => {
      const controllerNamespace = apiNamespace.addModule({
        name: toPascalCase(controllerName),
        isExported: true,
      })

      members.forEach(({ name: memberName, params = [] }) => {
        controllerNamespace.addTypeAlias({
          name: toPascalCase(memberName),
          isExported: true,
          type: (writer) =>
            writer.block(() =>
              writer.write(this.getMethod(params, controllerName, memberName)),
            ),
        })
      })
    })

    return this
  }

  public print() {
    return this.tsMorphSourceFile.print()
  }

  private getMethod(
    params: IParameterDeclaration[],
    controllerName: string,
    methodName: string,
  ) {
    let result = ''

    params
      .filter((parameter) => Boolean(parameter) && parameter.type)
      .forEach(({ name, type, parameterTypeIndex }) => {
        switch (type) {
          case MethodType.Body:
            result += `${type}: Parameters<${controllerName}['${methodName}']>[${parameterTypeIndex}]`
            break
          case MethodType.Query:
          case MethodType.Param: {
            if (typeof parameterTypeIndex === 'number') {
              break
            }
            result += `${[type]}: { ${name}: Parameters<${controllerName}['${methodName}']>[${parameterTypeIndex[name]}] }`
            break
          }
          default:
            break
        }
      })

    result += `Return: Awaited<ReturnType<${controllerName}['${methodName}']>>`

    return result
  }

  public createApiWrapper(controllers: ControllersData) {
    const body = factory.createBlock([
      factory.createReturnStatement(
        factory.createObjectLiteralExpression(
          controllers.map((controller) =>
            factory.createPropertyAssignment(
              controller.name,
              factory.createObjectLiteralExpression(
                controller.members.map((member) => {
                  const allowedData = member.params
                    .filter((parameter) => Boolean(parameter) && parameter.type)
                    .map((param) => param.type.toLowerCase())
                  const allowedMethods = API_WRAPPER_BASE_BINDINGS.filter(
                    (name) => allowedData.includes(name),
                  )

                  const typePath = `${TOKENS.API}.${toPascalCase(controller.name)}.${toPascalCase(member.name)}`

                  return factory.createPropertyAssignment(
                    member.name,
                    factory.createArrowFunction(
                      [],
                      undefined,
                      [
                        factory.createParameterDeclaration(
                          [],
                          undefined,
                          factory.createObjectBindingPattern(
                            this.createApiWrapperBindings(allowedMethods),
                          ),
                          undefined,
                          factory.createTypeLiteralNode(
                            this.createApiWrapperParameters(
                              createApiWrapperParameters(typePath).filter(
                                (method) =>
                                  allowedMethods.includes(method.name),
                              ),
                            ),
                          ),
                        ),
                      ],
                      undefined,
                      undefined,
                      factory.createCallExpression(
                        factory.createIdentifier(FUNC_TOKENS.API_CALL_WRAPPER),
                        [factory.createTypeReferenceNode(typePath)],
                        [
                          factory.createIdentifier(FUNC_TOKENS.KY_INSTANCE),
                          factory.createObjectLiteralExpression([
                            ...this.createApiCallShorthands(allowedMethods),
                            factory.createPropertyAssignment(
                              TOKENS.URL,
                              factory.createStringLiteral(
                                this.globalPrefix + member.path,
                              ),
                            ),
                            factory.createPropertyAssignment(
                              TOKENS.METHOD,
                              factory.createStringLiteral(
                                member.method.toLowerCase(),
                              ),
                            ),
                          ]),
                        ],
                      ),
                    ),
                  )
                }),
              ),
            ),
          ),
        ),
      ),
    ])

    const funcVariable = factory.createFunctionDeclaration(
      [factory.createModifier(SyntaxKind.ExportKeyword)],
      undefined,
      FUNC_TOKENS.CREATE_API,
      [],
      [
        factory.createParameterDeclaration(
          [],
          undefined,
          FUNC_TOKENS.KY_INSTANCE,
          undefined,
          factory.createTypeReferenceNode(FUNC_TOKENS.KY_INSTANCE_TYPE),
        ),
        factory.createParameterDeclaration(
          [],
          undefined,
          FUNC_TOKENS.API_CALL_WRAPPER,
          undefined,
          factory.createFunctionTypeNode(
            [
              factory.createTypeParameterDeclaration(
                [],
                TOKENS.TEMPORAL_TYPE,
                factory.createTypeReferenceNode(
                  FUNC_TOKENS.ABSTRACT_API_METHOD,
                ),
              ),
            ],
            [
              factory.createParameterDeclaration(
                [],
                undefined,
                TOKENS.CLIENT,
                undefined,
                factory.createTypeReferenceNode(FUNC_TOKENS.KY_INSTANCE_TYPE),
              ),
              factory.createParameterDeclaration(
                [],
                undefined,
                TOKENS.OPTIONS,
                undefined,
                factory.createTypeLiteralNode(
                  this.createApiWrapperParameters(
                    API_WRAPPER_BASE_PARAMETERS,
                    true,
                  ),
                ),
              ),
            ],
            factory.createTypeReferenceNode(TOKENS.PROMISE, [
              factory.createIndexedAccessTypeNode(
                factory.createTypeReferenceNode(TOKENS.TEMPORAL_TYPE),
                factory.createLiteralTypeNode(
                  factory.createStringLiteral(MethodType.Return),
                ),
              ),
            ]),
          ),
        ),
      ],
      undefined,
      body,
    )

    this.tsMorphSourceFile.insertText(
      this.tsMorphSourceFile.getFullText().length,
      this.printer.printNode(
        EmitHint.Unspecified,
        funcVariable,
        this.tsSourceFile,
      ),
    )

    return this
  }

  private createApiCallShorthands(names: string[]) {
    return names.map((name) => factory.createShorthandPropertyAssignment(name))
  }

  private createApiWrapperBindings(names: string[]) {
    return names.map((name) =>
      factory.createBindingElement(undefined, undefined, name),
    )
  }

  private createApiWrapperParameters = (
    parameterEntries: IApiWrapperParameterEntry[],
    markAsOptional = false,
  ) => {
    const requiredParams = [TOKENS.URL, TOKENS.METHOD]

    return parameterEntries.map(({ name, temporalType }) => {
      const isApiParameter = METHODS.includes(toPascalCase(name))

      return factory.createPropertySignature(
        undefined,
        factory.createIdentifier(name),
        markAsOptional && !requiredParams.includes(name)
          ? factory.createToken(SyntaxKind.QuestionToken)
          : undefined,
        isApiParameter
          ? factory.createIndexedAccessTypeNode(
              factory.createTypeReferenceNode(
                temporalType || TOKENS.TEMPORAL_TYPE,
              ),
              factory.createLiteralTypeNode(
                factory.createStringLiteral(toPascalCase(name)),
              ),
            )
          : factory.createTypeReferenceNode(TOKENS.STRING),
      )
    })
  }
}
