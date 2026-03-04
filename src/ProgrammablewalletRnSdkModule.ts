/**
 * Copyright 2025 Circle Internet Group, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NativeModule, requireNativeModule } from 'expo-modules-core'
import {
  ProgrammablewalletRnSdkModuleEvents,
  Configuration,
  DateFormat,
  SuccessResult,
  LoginResult,
  SecurityQuestion,
  TextConfig,
} from './types'

declare class ProgrammablewalletRnSdkModule extends NativeModule<ProgrammablewalletRnSdkModuleEvents> {
  sdkVersion: string
  getDeviceId(): string
  initSdk(configuration: Configuration): Promise<void>
  setSecurityQuestions(securityQuestions: SecurityQuestion[]): void
  execute(
    userToken: string | null,
    encryptionKey: string | null,
    challengeIds: string[],
  ): Promise<SuccessResult>
  verifyOTP(
    otpToken: string | null,
    deviceToken: string | null,
    deviceEncryptionKey: string | null,
  ): Promise<LoginResult>
  performLogin(
    provider: string,
    deviceToken: string,
    deviceEncryptionKey: string,
  ): Promise<LoginResult>
  performLogout(provider: string): Promise<void>
  setBiometricsPin(
    userToken: string | null,
    encryptionKey: string | null,
  ): Promise<SuccessResult>
  setDismissOnCallbackMap(map: Record<string, boolean>): void
  moveTaskToFront(): void
  moveRnTaskToFront(): void
  setTextConfigsMap(map: Record<string, unknown[]>): void
  setIconTextConfigsMap(map: Record<string, unknown>): void
  setTextConfigMap(map: Record<string, TextConfig>): void
  setImageMap(map: Record<string, string>): void
  setDateFormat(format: DateFormat): void
  setDebugging(debugging: boolean): void
  setCustomUserAgent(userAgent: string): void
  setErrorStringMap(map: Record<string, string>): void
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ProgrammablewalletRnSdkModule>(
  'ProgrammablewalletRnSdk',
)
