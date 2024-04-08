import type { TurboModule } from 'react-native'
import { TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  getConstants(): { sdkVersion: string };

  initSdk(configuration: Object): Promise<Object>;

  setSecurityQuestions(questions: Object[]): void;

  execute(
    userToken: string,
    encryptionKey: string,
    challengeIds: string[],
  ): Promise<Object>;

  executeWithUserSecret(
    userToken: string,
    encryptionKey: string,
    userSecret: string,
    challengeIds: string[],
  ): Promise<Object>;

  getDeviceId(): string;

  setBiometricsPin(userToken: string, encryptionKey: string): Promise<Object>;

  setDismissOnCallbackMap(map: Object): void;

  moveTaskToFront(): void;

  moveRnTaskToFront(): void;

  setTextConfigsMap(map: Object): void;

  setIconTextConfigsMap(map: Object): void;

  setTextConfigMap(map: Object): void;

  setImageMap(map: Object): void;

  setDateFormat(format: string): void;

  setDebugging(debugging: boolean): void;

  setCustomUserAgent(userAgent: string): void;

  setErrorStringMap(map: Object): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'ProgrammablewalletRnSdk',
)
