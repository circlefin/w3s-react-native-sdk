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

import {
  IWalletSdk,
  Configuration,
  TextsKey,
  IconTextsKey,
  TextKey,
  ImageKey,
  DateFormat,
  ErrorCode,
  SuccessCallback,
  LoginSuccessCallback,
  CompletedCallback,
  ErrorCallback,
  SuccessResult,
  LoginResult,
  IconTextConfig,
  TextConfig,
  SocialProvider,
  SecurityQuestion,
  InputType,
} from './types'
import { bridgeSafe } from './bridgeSafe'
const packageJson = require('../package.json')

import ProgrammablewalletRnSdk from './ProgrammablewalletRnSdkModule'
import { ImageSourcePropType, Image } from 'react-native'

// SDK event identifiers
const EVENT_NAME_ON_SUCCESS = 'CirclePwOnSuccess'
const EVENT_NAME_ON_ERROR = 'CirclePwOnError'
const USER_AGENT_RN = 'Circle-Programmable-Wallet-SDK-RN'

/**
 * Resolves React Native image sources to URI strings for native bridge
 * @param source - React Native image source
 * @returns Resolved URI string or null
 */
function getImageUrl(source: ImageSourcePropType): string | null {
  if (!source) {
    return null
  }
  const resolved = Image.resolveAssetSource(source)
  if (
    !resolved ||
    typeof resolved.uri !== 'string' ||
    resolved.uri.trim() === ''
  ) {
    return null
  }
  return resolved.uri
}

// Import security question utility functions
import { toPlainSecurityQuestion } from './utils/securityQuestionUtils'

export const WalletSdk = ((): IWalletSdk => {
  const defaultUserAgentRn = USER_AGENT_RN + '/' + packageJson.version
  return {
    sdkVersion: {
      native: ProgrammablewalletRnSdk.sdkVersion,
      rn: packageJson.version,
    },
    get deviceId() {
      return ProgrammablewalletRnSdk.getDeviceId()
    },
    getDeviceId: ProgrammablewalletRnSdk.getDeviceId,
    init(configuration: Configuration): Promise<void> {
      const promise = ProgrammablewalletRnSdk.initSdk(configuration)
      ProgrammablewalletRnSdk.setCustomUserAgent(defaultUserAgentRn)
      return promise
    },
    setSecurityQuestions(securityQuestions: Array<{ title: string; inputType?: InputType | string | number }>): void {
      try {
        // Convert each input to a proper SecurityQuestion object
        const normalized: SecurityQuestion[] = (securityQuestions || []).map(q => toPlainSecurityQuestion(q))

        // toPlainSecurityQuestion already performs the necessary serialization
        // No need for bridgeSafe here as each question has been converted to a plain object
        // with only primitive properties (string title and enum inputType)
        ProgrammablewalletRnSdk.setSecurityQuestions(normalized)
      } catch (e) {
        console.error('setSecurityQuestions failed:', e)
      }
    },
    execute(
      userToken: string,
      encryptionKey: string,
      challengeIds: string[],
      successCallback: SuccessCallback,
      errorCallback: ErrorCallback,
    ): void {
      const successListener = ProgrammablewalletRnSdk.addListener(
        EVENT_NAME_ON_SUCCESS,
        (event: unknown) => {
          console.debug('[WalletSdk] Execute result')
          successCallback(event as SuccessResult)
          cleanup()
        },
      )

      const errorListener = ProgrammablewalletRnSdk.addListener(
        EVENT_NAME_ON_ERROR,
        (event: unknown) => {
          console.debug('[WalletSdk] Error event received:', event)
          // Convert event to Error object if needed
          const error =
            event instanceof Error
              ? event
              : new Error((event as { message?: string })?.message || 'Unknown error')
          errorCallback(error)
          cleanup()
        },
      )

      // Cleanup function to remove listeners
      const cleanup = () => {
        successListener?.remove()
        errorListener?.remove()
      }

      // Call native execute method
      ProgrammablewalletRnSdk.execute(userToken, encryptionKey, challengeIds)
        .then((successResult: SuccessResult) => {
          // If Promise resolves but no event was fired, call success callback
          console.debug('[WalletSdk] Promise resolved')
          successCallback(successResult)
          cleanup()
        })
        .catch((e: Error) => {
          // If Promise rejects but no event was fired, call error callback
          console.debug('[WalletSdk] Promise rejected:', e)
          errorCallback(e)
          cleanup()
        })
    },
    verifyOTP(
      otpToken: string,
      deviceToken: string,
      deviceEncryptionKey: string,
      successCallback: LoginSuccessCallback,
      errorCallback: ErrorCallback,
    ): void {
      ProgrammablewalletRnSdk.addListener(EVENT_NAME_ON_ERROR, (event: unknown) => {
        // Convert event to Error object if needed
        const error =
          event instanceof Error
            ? event
            : new Error((event as { message?: string })?.message || 'Unknown error')
        errorCallback(error)
      })
      ProgrammablewalletRnSdk.verifyOTP(
        otpToken,
        deviceToken,
        deviceEncryptionKey,
      )
        .then((result: LoginResult) => {
          successCallback(result)
        })
        .catch((e: Error) => {
          errorCallback(e)
        })
        .finally(() => {
          ProgrammablewalletRnSdk.removeAllListeners(EVENT_NAME_ON_ERROR)
        })
    },
    performLogin(
      provider: SocialProvider,
      deviceToken: string,
      deviceEncryptionKey: string,
      successCallback: LoginSuccessCallback,
      errorCallback: ErrorCallback,
    ): void {
      ProgrammablewalletRnSdk.performLogin(
        provider,
        deviceToken,
        deviceEncryptionKey,
      )
        .then((successResult: LoginResult) => {
          console.debug(
            '[WalletSdk] performLogin Promise resolved:',
            successResult,
          )
          successCallback(successResult)
        })
        .catch((e: Error) => {
          console.debug('[WalletSdk] performLogin Promise rejected:', e)
          errorCallback(e)
        })
    },
    performLogout(
      provider: SocialProvider,
      completedCallback: CompletedCallback,
      errorCallback: ErrorCallback,
    ): void {
      ProgrammablewalletRnSdk.performLogout(provider)
        .then(() => {
          console.debug('[WalletSdk] performLogout Promise resolved')
          completedCallback()
        })
        .catch((e: Error) => {
          console.debug('[WalletSdk] performLogout Promise rejected:', e)
          errorCallback(e)
        })
    },
    setBiometricsPin(
      userToken: string,
      encryptionKey: string,
      successCallback: SuccessCallback,
      errorCallback: ErrorCallback,
    ): void {
      const successListener = ProgrammablewalletRnSdk.addListener(
        EVENT_NAME_ON_SUCCESS,
        (event: unknown) => {
          successCallback(event as SuccessResult)
          cleanup()
        },
      )

      const errorListener = ProgrammablewalletRnSdk.addListener(
        EVENT_NAME_ON_ERROR,
        (event: unknown) => {
          console.debug(
            '[WalletSdk] setBiometricsPin Error event received:',
            event,
          )
          // Convert event to Error object if needed
          const error =
            event instanceof Error
              ? event
              : new Error((event as { message?: string })?.message || 'Unknown error')
          errorCallback(error)
          cleanup()
        },
      )

      // Cleanup function to remove listeners
      const cleanup = () => {
        successListener?.remove()
        errorListener?.remove()
      }

      // Call native setBiometricsPin method
      ProgrammablewalletRnSdk.setBiometricsPin(userToken, encryptionKey)
        .then((successResult: SuccessResult) => {
          // If Promise resolves but no event was fired, call success callback
          console.debug(
            '[WalletSdk] setBiometricsPin Promise resolved:',
            successResult,
          )
          successCallback(successResult)
          cleanup()
        })
        .catch((e: Error) => {
          // If Promise rejects but no event was fired, call error callback
          console.debug('[WalletSdk] setBiometricsPin Promise rejected:', e)
          errorCallback(e)
          cleanup()
        })
    },

    setDismissOnCallbackMap(map: Map<ErrorCode, boolean>): void {
      try {
        // Use bridgeSafe for serialization and ensure the result is a non-null object
        const serialized = bridgeSafe(map) as Record<string, boolean>
        ProgrammablewalletRnSdk.setDismissOnCallbackMap(serialized)
      } catch (e) {
        console.error('setDismissOnCallbackMap failed:', e)
      }
    },
    moveTaskToFront(): void {
      try {
        ProgrammablewalletRnSdk.moveTaskToFront()
      } catch (e) {
        console.error('moveTaskToFront failed:', e)
      }
    },
    moveRnTaskToFront(): void {
      try {
        ProgrammablewalletRnSdk.moveRnTaskToFront()
      } catch (e) {
        console.error('moveRnTaskToFront failed:', e)
      }
    },
    setTextConfigsMap(map: Map<TextsKey, TextConfig[]>): void {
      try {
        // Use bridgeSafe for serialization and ensure the result is a non-null object
        const serialized = bridgeSafe(map) as Record<string, TextConfig[]>
        ProgrammablewalletRnSdk.setTextConfigsMap(serialized)
      } catch (e) {
        console.error('setTextConfigsMap failed:', e)
      }
    },

    setIconTextConfigsMap(
      rawMap: Map<IconTextsKey, Array<IconTextConfig>>,
    ): void {
      try {
        // Create a transformed plain object instead of a Map
        const processedObj: Record<string, Array<{ image: string | null; textConfig: TextConfig }>> = {}

        Array.from(rawMap.entries()).forEach(([key, configs]) => {
          const processedConfigs = configs.map(config => {
            const { image, textConfig = {} } = config as IconTextConfig
            // Process image URL, as this is React Native specific logic
            return {
              image: image ? getImageUrl(image) : null,
              textConfig,
            }
          })
          processedObj[String(key)] = processedConfigs
        })

        // Use bridgeSafe for serialization and ensure the result is a non-null object
        const serialized = bridgeSafe(processedObj) as Record<string, unknown>
        ProgrammablewalletRnSdk.setIconTextConfigsMap(serialized)
      } catch (e) {
        console.error('setIconTextConfigsMap Error:', e)
      }
    },
    setTextConfigMap(map: Map<TextKey, TextConfig>): void {
      try {
        // Use bridgeSafe for serialization and ensure the result is a non-null object
        const serialized = bridgeSafe(map) as Record<string, TextConfig>
        ProgrammablewalletRnSdk.setTextConfigMap(serialized)
      } catch (e) {
        console.error('setTextConfigMap failed:', e)
      }
    },

    setImageMap(map: Map<ImageKey, ImageSourcePropType>): void {
      try {
        // Process image URLs, this part needs to be preserved
        const processedMap = new Map<ImageKey, string>()

        map.forEach((value, key) => {
          const url = getImageUrl(value)
          // Only keep non-null URLs
          if (url !== null) {
            processedMap.set(key, url)
          }
        })

        // Use bridgeSafe for serialization and ensure the result is a non-null object
        const serialized = bridgeSafe(processedMap) as Record<string, string>
        ProgrammablewalletRnSdk.setImageMap(serialized)
      } catch (e) {
        console.error('setImageMap failed:', e)
      }
    },
    setDateFormat(format: DateFormat): void {
      try {
        ProgrammablewalletRnSdk.setDateFormat(format)
      } catch (e) {
        console.error('setDateFormat failed:', e)
      }
    },
    setDebugging(debugging: boolean): void {
      try {
        ProgrammablewalletRnSdk.setDebugging(debugging)
      } catch (e) {
        console.error('setDebugging failed:', e)
      }
    },
    setCustomUserAgent(userAgent: string): void {
      ProgrammablewalletRnSdk.setCustomUserAgent(
        defaultUserAgentRn + ' | ' + userAgent,
      )
    },
    setErrorStringMap(map: Map<ErrorCode, string>): void {
      try {
        // Use bridgeSafe for serialization and ensure the result is a non-null object
        const serialized = bridgeSafe(map) as Record<string, string>
        ProgrammablewalletRnSdk.setErrorStringMap(serialized)
      } catch (e) {
        console.error('setErrorStringMap failed:', e)
      }
    },
  }
})()
