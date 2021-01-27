import { ContainerModule, interfaces } from 'inversify'
import { container } from '@onhand/common-business/#/ioc/container'
import {
  ICognitoService,
  ICognitoServiceToken,
} from '@onhand/common-business-aws/#/services/iCognitoService'
import { CognitoService } from '#/services/cognitoService'
import {
  IParameterStoreService,
  IParameterStoreServiceToken,
} from '@onhand/common-business-aws/#/services/iParameterStoreService'
import { ParameterStoreService } from '#/services/parameterStoreService'

const serviceModule = new ContainerModule(
  (bind: interfaces.Bind, unbind: interfaces.Unbind) => {
    bind<ICognitoService>(ICognitoServiceToken)
      .to(CognitoService)
      .inSingletonScope()
    bind<IParameterStoreService>(IParameterStoreServiceToken)
      .to(ParameterStoreService)
      .inSingletonScope()
  },
)

container.load(serviceModule)

export { serviceModule }
