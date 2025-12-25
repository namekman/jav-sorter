import { XXXPlanetProvider } from './3xPlanet/3XPlanetProvider'
import { ActressProvider } from './ActressProvider'
import { AVWikiProvider } from './av-wiki/AVWikiProvider'
import { DmmJaProvider } from './dmm/DmmJaProvider'
import { EroDougazoActressProvider } from './ero-dougazo/EroDougazoActressProvider'
import { FC2Provider } from './fc2/FC2Provider'
import { MgstageJaProvider } from './mgstage/MgstageJaProvider'
import { MinnanoAvActressProvider } from './minnano-av/MinnanoAVActressProvider'
import { PaipanConProvider } from './paipancon/PaipanConProvider'
import { Provider } from './Provider'
import { ShiroutoWikiProvider } from './shirouto-wiki/ShiroutoWikiProvider'

export const fc2Providers: Provider[] = [
  new PaipanConProvider(),
  new FC2Provider(),
]

export const providers: Provider[] = [
  new AVWikiProvider(),
  new ShiroutoWikiProvider(),
  new DmmJaProvider(),
  new MgstageJaProvider(),
  new XXXPlanetProvider(),
]

export const actressProviders: ActressProvider[] = [
  new MinnanoAvActressProvider(),
  new EroDougazoActressProvider(),
]
