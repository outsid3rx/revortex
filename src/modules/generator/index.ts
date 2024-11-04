import {
  createPrinter,
  createSourceFile,
  EmitHint,
  factory,
  NewLineKind,
  NodeFlags,
  ScriptKind,
  ScriptTarget,
  SyntaxKind,
} from 'typescript'

import type {
  ControllersData,
  IMethodDeclaration,
  IParameterDeclaration,
} from '../controllers-parser/types'
import { METHODS, MethodType } from '../controllers-parser/types'
import {
  API_WRAPPER_BASE_BINDINGS,
  API_WRAPPER_BASE_PARAMETERS,
  BASE_IMPORTS,
  FUNC_TOKENS,
  NEW_LINE_TOKEN,
  TOKENS,
} from './constants'
import type { IApiWrapperParameterEntry, IImportEntry } from './types'
import {
  createApiWrapperParameters,
  isNumber,
  removeExtension,
  toPascalCase,
} from './utils'

export class Generator {
  private printer = createPrinter({ newLine: NewLineKind.LineFeed })
  private file = createSourceFile(
    'source.ts',
    '',
    ScriptTarget.Latest,
    false,
    ScriptKind.TS,
  )

  private fileContent = ''

  constructor(
    private readonly importAliasSrcDir: string,
    private readonly globalPrefix = '',
  ) {}

  public generateImports(controllers: ControllersData) {
    this.createImport(BASE_IMPORTS)

    this.createImport(
      controllers.map<IImportEntry>((controller) => ({
        name: controller.name,
        from: this.importAliasSrcDir + removeExtension(controller.fileName),
        isType: false,
      })),
    )

    return this
  }

  public createMainNamespace(controllers: ControllersData) {
    const namespaceModuleIdentifier = factory.createIdentifier(TOKENS.API)
    const exportModifier = factory.createModifier(SyntaxKind.ExportKeyword)
    const namespaceBodyBlock = this.createControllerNamespaces(controllers)
    const namespaceBody = factory.createModuleBlock(namespaceBodyBlock.flat())
    const namespaceModule = factory.createModuleDeclaration(
      [exportModifier],
      namespaceModuleIdentifier,
      namespaceBody,
      NodeFlags.Namespace,
    )

    this.fileContent +=
      NEW_LINE_TOKEN +
      this.printer.printNode(EmitHint.Unspecified, namespaceModule, this.file)

    return this
  }

  public createApiWrapper(controllers: ControllersData) {
    const funcBody = factory.createBlock([
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
      funcBody,
    )

    this.fileContent +=
      NEW_LINE_TOKEN +
      this.printer.printNode(EmitHint.Unspecified, funcVariable, this.file)

    return this
  }

  public print() {
    return this.fileContent
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

  private createImport(imports: IImportEntry[]) {
    imports.forEach(({ name, isType, from }) => {
      const entityIdentifier = factory.createIdentifier(name)
      const namedImport = factory.createNamedImports([
        factory.createImportSpecifier(false, undefined, entityIdentifier),
      ])
      const importClause = factory.createImportClause(
        isType,
        undefined,
        namedImport,
      )
      const moduleSpecifier = factory.createStringLiteral(from)

      const node = factory.createImportDeclaration(
        [],
        importClause,
        moduleSpecifier,
      )

      this.fileContent +=
        this.printer.printNode(EmitHint.Unspecified, node, this.file) +
        NEW_LINE_TOKEN
    })
  }

  private createControllerNamespaces(controllers: ControllersData) {
    return controllers.map((controller) => {
      const namespaceModuleIdentifier = factory.createIdentifier(
        toPascalCase(controller.name),
      )
      const exportModifier = factory.createModifier(SyntaxKind.ExportKeyword)
      const namespaceBodyBlock = controller.members.map((member) => {
        return [this.getMethodsObjectData(member, controller.name)]
      })
      const namespaceBody = factory.createModuleBlock(namespaceBodyBlock.flat())

      return factory.createModuleDeclaration(
        [exportModifier],
        namespaceModuleIdentifier,
        namespaceBody,
        NodeFlags.Namespace,
      )
    })
  }

  private getMethodsObjectData = (
    member: IMethodDeclaration,
    controllerName: string,
  ) => {
    const exportModifier = factory.createModifier(SyntaxKind.ExportKeyword)

    const properties = member.params
      .filter((parameter) => Boolean(parameter) && parameter.type)
      .map((param) => {
        return factory.createPropertySignature(
          undefined,
          factory.createIdentifier(param.type),
          undefined,
          isNumber(param.parameterTypeIndex)
            ? this.createUnnamedParameters(member, controllerName, param)
            : this.createNamedParameters(
                member,
                controllerName,
                param.parameterTypeIndex,
              ),
        )
      })

    properties.push(
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier(MethodType.Return),
        undefined,
        factory.createTypeReferenceNode(TOKENS.AWAITED, [
          factory.createTypeReferenceNode(TOKENS.RETURN_TYPE, [
            factory.createIndexedAccessTypeNode(
              factory.createTypeReferenceNode(toPascalCase(controllerName)),
              factory.createLiteralTypeNode(
                factory.createStringLiteral(member.name),
              ),
            ),
          ]),
        ]),
      ),
    )

    return factory.createTypeAliasDeclaration(
      [exportModifier],
      factory.createIdentifier(toPascalCase(member.name)),
      undefined,
      factory.createTypeLiteralNode(properties),
    )
  }

  private createNamedParameters(
    member: IMethodDeclaration,
    controllerName: string,
    paramsMap: Record<string, number>,
  ) {
    return factory.createTypeLiteralNode([
      ...Object.entries(paramsMap).map(([name, index]) => {
        return factory.createPropertySignature(
          undefined,
          factory.createIdentifier(name),
          undefined,
          factory.createIndexedAccessTypeNode(
            factory.createTypeReferenceNode(TOKENS.PARAMETERS, [
              factory.createIndexedAccessTypeNode(
                factory.createTypeReferenceNode(toPascalCase(controllerName)),
                factory.createLiteralTypeNode(
                  factory.createStringLiteral(member.name),
                ),
              ),
            ]),
            factory.createLiteralTypeNode(factory.createNumericLiteral(index)),
          ),
        )
      }),
    ])
  }

  private createUnnamedParameters(
    member: IMethodDeclaration,
    controllerName: string,
    param: IParameterDeclaration,
  ) {
    return factory.createIndexedAccessTypeNode(
      factory.createTypeReferenceNode(TOKENS.PARAMETERS, [
        factory.createIndexedAccessTypeNode(
          factory.createTypeReferenceNode(toPascalCase(controllerName)),
          factory.createLiteralTypeNode(
            factory.createStringLiteral(member.name),
          ),
        ),
      ]),
      factory.createLiteralTypeNode(
        factory.createNumericLiteral(
          isNumber(param.parameterTypeIndex) ? param.parameterTypeIndex : 0,
        ),
      ),
    )
  }
}
