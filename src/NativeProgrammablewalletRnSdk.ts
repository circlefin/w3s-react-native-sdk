// Copyright (c) 2024, Circle Internet Financial, LTD. All rights reserved.
//
// SPDX-License-Identifier: Apache-2.0
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
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

  getDeviceId(): string;

  setBiometricsPin(userToken: string, encryptionKey: string): Promise<Object>;

  performLogin(
    provider: string,
    deviceToken: string,
    deviceEncryptionKey: string,
  ): Promise<Object>;

  verifyOTP(
    otpToken: string,
    deviceToken: string,
    deviceEncryptionKey: string,
  ): Promise<Object>;

  performLogout(
    provider: string,
  ): Promise<Object>;

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
