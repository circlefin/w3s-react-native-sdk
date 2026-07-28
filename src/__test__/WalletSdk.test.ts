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

// Mock react-native before any module imports
jest.mock('react-native', () => ({
  Image: {
    resolveAssetSource: jest.fn(() => ({ uri: 'mock://asset' })),
  },
}))

// Mock expo-modules-core to avoid loading native bindings
jest.mock('expo-modules-core', () => ({
  NativeModule: class {},
  requireNativeModule: jest.fn(),
}))

type ListenerCallback = (event: unknown) => void

// Tracks active listeners per event name
const listenerMap: Map<string, ListenerCallback[]> = new Map()
// Tracks remove() calls
const removeMocks: jest.Mock[] = []

/**
 * Fires all registered listeners for the given event name with the supplied payload.
 * Used in tests to simulate native events arriving asynchronously.
 */
function triggerEvent(eventName: string, payload: unknown): void {
  const callbacks = listenerMap.get(eventName) ?? []
  callbacks.forEach(cb => cb(payload))
}

async function flushMicrotasks(count = 3): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await Promise.resolve()
  }
}

const mockExecute = jest.fn()
const mockSetBiometricsPin = jest.fn()
const mockVerifyOTP = jest.fn()

// The mock module that replaces the native ProgrammablewalletRnSdkModule
const mockNativeModule = {
  sdkVersion: '0.0.0',
  getDeviceId: jest.fn(() => 'mock-device-id'),
  initSdk: jest.fn(() => Promise.resolve()),
  setSecurityQuestions: jest.fn(),
  setCustomUserAgent: jest.fn(),
  execute: mockExecute,
  setBiometricsPin: mockSetBiometricsPin,
  verifyOTP: mockVerifyOTP,
  performLogin: jest.fn(() => Promise.resolve({})),
  performLogout: jest.fn(() => Promise.resolve()),
  setDismissOnCallbackMap: jest.fn(),
  moveTaskToFront: jest.fn(),
  moveRnTaskToFront: jest.fn(),
  setTextConfigsMap: jest.fn(),
  setIconTextConfigsMap: jest.fn(),
  setTextConfigMap: jest.fn(),
  setImageMap: jest.fn(),
  setDateFormat: jest.fn(),
  setDebugging: jest.fn(),
  setErrorStringMap: jest.fn(),
  addListener: jest.fn((eventName: string, callback: ListenerCallback) => {
    if (!listenerMap.has(eventName)) {
      listenerMap.set(eventName, [])
    }
    listenerMap.get(eventName)!.push(callback)

    const removeMock = jest.fn(() => {
      const list = listenerMap.get(eventName) ?? []
      const idx = list.indexOf(callback)
      if (idx !== -1) {
        list.splice(idx, 1)
      }
    })
    removeMocks.push(removeMock)
    return { remove: removeMock }
  }),
  removeAllListeners: jest.fn((eventName: string) => {
    listenerMap.delete(eventName)
  }),
}

jest.mock('../ProgrammablewalletRnSdkModule', () => mockNativeModule)

// Import WalletSdk AFTER mocks are set up
import { WalletSdk } from '../WalletSdk'
import {
  DateFormat,
  ErrorCode,
  IconTextConfig,
  IconTextsKey,
  ImageKey,
  InputType,
  SocialProvider,
  TextConfig,
  TextKey,
  TextsKey,
} from '../types'
import type { Configuration, LoginResult, SuccessResult } from '../types'
import { Image } from 'react-native'

const packageJson: { version: string } = require('../../package.json')
const mockResolveAssetSource = Image.resolveAssetSource as jest.Mock

const SUCCESS_EVENT = 'CirclePwOnSuccess'
const ERROR_EVENT = 'CirclePwOnError'
const DEFAULT_USER_AGENT = `Circle-Programmable-Wallet-SDK-RN/${packageJson.version}`

const initConfigWithSettings: Configuration = {
  endpoint: 'https://example.com',
  appId: 'test-app',
  settingsManagement: {
    enableBiometricsPin: true,
  },
}

const mockSuccessResult: SuccessResult = {
  result: { resultType: 'CHANGE_PIN', status: 'COMPLETE' } as any,
}

beforeEach(() => {
  listenerMap.clear()
  removeMocks.length = 0
  jest.clearAllMocks()
  // Re-register the addListener implementation after clearAllMocks
  mockNativeModule.addListener.mockImplementation(
    (eventName: string, callback: ListenerCallback) => {
      if (!listenerMap.has(eventName)) {
        listenerMap.set(eventName, [])
      }
      listenerMap.get(eventName)!.push(callback)

      const removeMock = jest.fn(() => {
        const list = listenerMap.get(eventName) ?? []
        const idx = list.indexOf(callback)
        if (idx !== -1) {
          list.splice(idx, 1)
        }
      })
      removeMocks.push(removeMock)
      return { remove: removeMock }
    },
  )
})

// jest.clearAllMocks() in beforeEach clears call records but does not uninstall
// jest.spyOn replacements. Tests that spy on console.error / console.warn must
// not leak their spy into later tests on assertion failure — this restores
// every spy after every test so the original console functions are guaranteed
// to come back.
afterEach(() => {
  jest.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// init() / setCustomUserAgent()
// ---------------------------------------------------------------------------

describe('WalletSdk.init', () => {
  it('invokes initSdk exactly once with the supplied configuration object', async () => {
    await WalletSdk.init(initConfigWithSettings)

    expect(mockNativeModule.initSdk).toHaveBeenCalledTimes(1)
    expect(mockNativeModule.initSdk).toHaveBeenCalledWith(
      initConfigWithSettings,
    )
  })

  it('sets the default user agent before initSdk rejection propagates', async () => {
    mockNativeModule.initSdk.mockRejectedValueOnce(new Error('init failed'))

    const promise = WalletSdk.init(initConfigWithSettings)

    expect(mockNativeModule.setCustomUserAgent).toHaveBeenCalledTimes(1)
    expect(mockNativeModule.setCustomUserAgent).toHaveBeenCalledWith(
      DEFAULT_USER_AGENT,
    )
    await expect(promise).rejects.toThrow('init failed')
  })

  // Coverage boundary: the native bridge is what derives the real code +
  // errorString-bearing message from the thrown ApiError — code =
  // String(errorCode.rawValue) + _bridgePromiseErrorMessage on iOS, and
  // CodedException(code.value, convertApiErrorToMap(...)) on Android. That
  // mapping is exercised by the native SDK repos' tests (e.g. iOS
  // PW_SDK_6_config_error_tests), not here — this bridge repo has no native
  // unit-test harness. The tests below instead lock the JS-side contract:
  // init() must PROPAGATE the native rejection verbatim (it is in the
  // "propagates errors" list, not an error-swallowing setter), so a future
  // regression that swallowed or remapped the rejection here would be caught.

  it('propagates the native rejection verbatim without swallowing or remapping the code', async () => {
    // The native reject already collapsed to "1" was the original bug; assert
    // the JS wrapper neither swallows the rejection nor rewrites its code.
    const nativeError = Object.assign(
      new Error('Invalid appId. Invalid appId: bad-app-id'),
      { code: '2' },
    )
    mockNativeModule.initSdk.mockRejectedValueOnce(nativeError)

    const rejection = await WalletSdk.init(initConfigWithSettings).then(
      () => {
        throw new Error('init should have rejected')
      },
      (e: Error & { code?: string }) => e,
    )

    expect(rejection).toBe(nativeError)
    expect(rejection.code).toBe('2')
    expect(rejection.code).not.toBe('1')
    expect(rejection.message).toBe('Invalid appId. Invalid appId: bad-app-id')
  })

  it('propagates a network ApiError (155706) rejection from init to the caller', async () => {
    const nativeError = Object.assign(
      new Error(
        'Network error. A TLS error caused the secure connection to fail',
      ),
      { code: '155706' },
    )
    mockNativeModule.initSdk.mockRejectedValueOnce(nativeError)

    await expect(WalletSdk.init(initConfigWithSettings)).rejects.toMatchObject({
      code: '155706',
      message:
        'Network error. A TLS error caused the secure connection to fail',
    })
  })
})

describe('WalletSdk.setCustomUserAgent', () => {
  it('preserves the SDK prefix and separator for an empty user agent suffix', () => {
    WalletSdk.setCustomUserAgent('')

    expect(mockNativeModule.setCustomUserAgent).toHaveBeenCalledTimes(1)
    expect(mockNativeModule.setCustomUserAgent).toHaveBeenCalledWith(
      `${DEFAULT_USER_AGENT} | `,
    )
  })
})

// ---------------------------------------------------------------------------
// execute()
// ---------------------------------------------------------------------------

describe('WalletSdk.execute', () => {
  it('invokes successCallback exactly once when event fires before Promise resolves', async () => {
    let resolvePromise!: (value: SuccessResult) => void
    mockExecute.mockReturnValue(
      new Promise<SuccessResult>(res => {
        resolvePromise = res
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.execute(
      'token',
      'key',
      ['challenge-1'],
      successCallback,
      errorCallback,
    )

    // Event fires first
    triggerEvent(SUCCESS_EVENT, mockSuccessResult)

    // Then Promise resolves
    resolvePromise(mockSuccessResult)
    await flushMicrotasks()

    expect(successCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback).not.toHaveBeenCalled()
  })

  it('delivers success event callbacks on a Promise microtask', async () => {
    mockExecute.mockReturnValue(new Promise<SuccessResult>(() => undefined))

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.execute(
      'token',
      'key',
      ['challenge-1'],
      successCallback,
      errorCallback,
    )

    triggerEvent(SUCCESS_EVENT, mockSuccessResult)

    expect(successCallback).not.toHaveBeenCalled()

    await flushMicrotasks()

    expect(successCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback).not.toHaveBeenCalled()
  })

  it('fans out one success event to concurrent execute calls', async () => {
    mockExecute.mockImplementation(
      () => new Promise<SuccessResult>(() => undefined),
    )

    const firstSuccessCallback = jest.fn()
    const firstErrorCallback = jest.fn()
    const secondSuccessCallback = jest.fn()
    const secondErrorCallback = jest.fn()

    WalletSdk.execute(
      'token',
      'key',
      ['challenge-1'],
      firstSuccessCallback,
      firstErrorCallback,
    )
    WalletSdk.execute(
      'token',
      'key',
      ['challenge-2'],
      secondSuccessCallback,
      secondErrorCallback,
    )

    expect(mockExecute).toHaveBeenCalledTimes(2)
    expect(listenerMap.get(SUCCESS_EVENT)).toHaveLength(2)

    triggerEvent(SUCCESS_EVENT, mockSuccessResult)
    await flushMicrotasks()

    expect(firstSuccessCallback).toHaveBeenCalledTimes(1)
    expect(secondSuccessCallback).toHaveBeenCalledTimes(1)
    expect(firstErrorCallback).not.toHaveBeenCalled()
    expect(secondErrorCallback).not.toHaveBeenCalled()
  })

  it('invokes successCallback exactly once when Promise resolves before event fires', async () => {
    mockExecute.mockResolvedValue(mockSuccessResult)

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.execute(
      'token',
      'key',
      ['challenge-1'],
      successCallback,
      errorCallback,
    )

    // Flush microtasks so the native Promise settles the outer Promise.
    await flushMicrotasks()

    // Fire event after the outer Promise has already completed.
    triggerEvent(SUCCESS_EVENT, mockSuccessResult)

    expect(successCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback).not.toHaveBeenCalled()
  })

  it('invokes errorCallback exactly once when error event fires before Promise rejects', async () => {
    let rejectPromise!: (reason: Error) => void
    mockExecute.mockReturnValue(
      new Promise<SuccessResult>((_, rej) => {
        rejectPromise = rej
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.execute(
      'token',
      'key',
      ['challenge-1'],
      successCallback,
      errorCallback,
    )

    // Error event fires first
    triggerEvent(ERROR_EVENT, { message: 'native error' })

    // Then Promise rejects
    rejectPromise(new Error('promise error'))
    await flushMicrotasks()

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('preserves native error event code and message on execute errors', async () => {
    let rejectPromise!: (reason: Error) => void
    mockExecute.mockReturnValue(
      new Promise<SuccessResult>((_, rej) => {
        rejectPromise = rej
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.execute(
      'token',
      'key',
      ['challenge-1'],
      successCallback,
      errorCallback,
    )

    triggerEvent(ERROR_EVENT, {
      code: '155706',
      errorString: 'URLSession timed out while connecting to api.circle.com',
      message: 'Network error. The request timed out.',
      requestId: 'req_123',
    })

    rejectPromise(new Error('promise error'))
    await flushMicrotasks()

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback.mock.calls[0][0]).toMatchObject({
      code: '155706',
      errorString: 'URLSession timed out while connecting to api.circle.com',
      message: 'Network error. The request timed out.',
      requestId: 'req_123',
    })
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('normalizes numeric native error event codes to strings', async () => {
    let rejectPromise!: (reason: Error) => void
    mockExecute.mockReturnValue(
      new Promise<SuccessResult>((_, rej) => {
        rejectPromise = rej
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.execute(
      'token',
      'key',
      ['challenge-1'],
      successCallback,
      errorCallback,
    )

    triggerEvent(ERROR_EVENT, {
      code: 155706,
      message: 'Network error',
    })

    rejectPromise(new Error('promise error'))
    await flushMicrotasks()

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback.mock.calls[0][0]).toMatchObject({
      code: '155706',
      message: 'Network error',
    })
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('invokes errorCallback exactly once when Promise rejects before error event fires', async () => {
    mockExecute.mockRejectedValue(new Error('promise error'))

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.execute(
      'token',
      'key',
      ['challenge-1'],
      successCallback,
      errorCallback,
    )

    // Flush microtasks so the native rejection settles the outer Promise.
    await flushMicrotasks()

    // Fire error event after the outer Promise has already rejected.
    triggerEvent(ERROR_EVENT, { message: 'native error' })

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('invokes successCallback once when success event fires and Promise rejects', async () => {
    mockExecute.mockRejectedValue(new Error('promise error'))

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.execute(
      'token',
      'key',
      ['challenge-1'],
      successCallback,
      errorCallback,
    )

    // Success event fires first
    triggerEvent(SUCCESS_EVENT, mockSuccessResult)

    // Then Promise rejects — outer Promise settlement should ignore it.
    await flushMicrotasks()

    expect(successCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback).not.toHaveBeenCalled()
  })

  it('invokes errorCallback once when error event fires and Promise resolves', async () => {
    mockExecute.mockResolvedValue(mockSuccessResult)

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.execute(
      'token',
      'key',
      ['challenge-1'],
      successCallback,
      errorCallback,
    )

    // Error event fires first
    triggerEvent(ERROR_EVENT, { message: 'native error' })

    // Then Promise resolves — outer Promise settlement should ignore it.
    await flushMicrotasks()

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('removes both listeners after success event', async () => {
    let resolvePromise!: (value: SuccessResult) => void
    mockExecute.mockReturnValue(
      new Promise<SuccessResult>(res => {
        resolvePromise = res
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.execute(
      'token',
      'key',
      ['challenge-1'],
      successCallback,
      errorCallback,
    )

    // Snapshot remove mocks registered so far (2: success + error listeners)
    const [successRemove, errorRemove] = removeMocks.slice(-2)

    triggerEvent(SUCCESS_EVENT, mockSuccessResult)

    await flushMicrotasks()

    expect(successRemove).toHaveBeenCalledTimes(1)
    expect(errorRemove).toHaveBeenCalledTimes(1)

    // Prevent unhandled rejection
    resolvePromise(mockSuccessResult)
  })

  it('removes both listeners after error event', async () => {
    let rejectPromise!: (reason: Error) => void
    mockExecute.mockReturnValue(
      new Promise<SuccessResult>((_, rej) => {
        rejectPromise = rej
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.execute(
      'token',
      'key',
      ['challenge-1'],
      successCallback,
      errorCallback,
    )

    const [successRemove, errorRemove] = removeMocks.slice(-2)

    triggerEvent(ERROR_EVENT, { message: 'native error' })

    await flushMicrotasks()

    expect(successRemove).toHaveBeenCalledTimes(1)
    expect(errorRemove).toHaveBeenCalledTimes(1)

    // Prevent unhandled rejection
    rejectPromise(new Error('native error'))
  })
})

// ---------------------------------------------------------------------------
// setBiometricsPin()
// ---------------------------------------------------------------------------

describe('WalletSdk.setBiometricsPin', () => {
  it('invokes successCallback exactly once when event fires before Promise resolves', async () => {
    let resolvePromise!: (value: SuccessResult) => void
    mockSetBiometricsPin.mockReturnValue(
      new Promise<SuccessResult>(res => {
        resolvePromise = res
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.setBiometricsPin('token', 'key', successCallback, errorCallback)

    triggerEvent(SUCCESS_EVENT, mockSuccessResult)

    resolvePromise(mockSuccessResult)
    await flushMicrotasks()

    expect(successCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback).not.toHaveBeenCalled()
  })

  it('delivers success event callbacks on a Promise microtask', async () => {
    mockSetBiometricsPin.mockReturnValue(
      new Promise<SuccessResult>(() => undefined),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.setBiometricsPin('token', 'key', successCallback, errorCallback)

    triggerEvent(SUCCESS_EVENT, mockSuccessResult)

    expect(successCallback).not.toHaveBeenCalled()

    await flushMicrotasks()

    expect(successCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback).not.toHaveBeenCalled()
  })

  it('fans out one success event to concurrent setBiometricsPin calls', async () => {
    mockSetBiometricsPin.mockImplementation(
      () => new Promise<SuccessResult>(() => undefined),
    )

    const firstSuccessCallback = jest.fn()
    const firstErrorCallback = jest.fn()
    const secondSuccessCallback = jest.fn()
    const secondErrorCallback = jest.fn()

    WalletSdk.setBiometricsPin(
      'token',
      'key',
      firstSuccessCallback,
      firstErrorCallback,
    )
    WalletSdk.setBiometricsPin(
      'token',
      'key',
      secondSuccessCallback,
      secondErrorCallback,
    )

    expect(mockSetBiometricsPin).toHaveBeenCalledTimes(2)
    expect(listenerMap.get(SUCCESS_EVENT)).toHaveLength(2)

    triggerEvent(SUCCESS_EVENT, mockSuccessResult)
    await flushMicrotasks()

    expect(firstSuccessCallback).toHaveBeenCalledTimes(1)
    expect(secondSuccessCallback).toHaveBeenCalledTimes(1)
    expect(firstErrorCallback).not.toHaveBeenCalled()
    expect(secondErrorCallback).not.toHaveBeenCalled()
  })

  it('invokes successCallback exactly once when Promise resolves before event fires', async () => {
    mockSetBiometricsPin.mockResolvedValue(mockSuccessResult)

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.setBiometricsPin('token', 'key', successCallback, errorCallback)

    await flushMicrotasks()

    triggerEvent(SUCCESS_EVENT, mockSuccessResult)

    expect(successCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback).not.toHaveBeenCalled()
  })

  it('invokes errorCallback exactly once when error event fires before Promise rejects', async () => {
    let rejectPromise!: (reason: Error) => void
    mockSetBiometricsPin.mockReturnValue(
      new Promise<SuccessResult>((_, rej) => {
        rejectPromise = rej
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.setBiometricsPin('token', 'key', successCallback, errorCallback)

    triggerEvent(ERROR_EVENT, { message: 'native error' })

    rejectPromise(new Error('promise error'))
    await flushMicrotasks()

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('preserves native error payload details on setBiometricsPin errors', async () => {
    let rejectPromise!: (reason: Error) => void
    mockSetBiometricsPin.mockReturnValue(
      new Promise<SuccessResult>((_, rej) => {
        rejectPromise = rej
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.setBiometricsPin('token', 'key', successCallback, errorCallback)

    triggerEvent(ERROR_EVENT, {
      code: 155706,
      errorString: 'URLSession timed out while connecting to api.circle.com',
      message: 'Network error',
    })

    rejectPromise(new Error('promise error'))
    await flushMicrotasks()

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback.mock.calls[0][0]).toMatchObject({
      code: '155706',
      errorString: 'URLSession timed out while connecting to api.circle.com',
      message: 'Network error',
    })
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('invokes errorCallback exactly once when Promise rejects before error event fires', async () => {
    mockSetBiometricsPin.mockRejectedValue(new Error('promise error'))

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.setBiometricsPin('token', 'key', successCallback, errorCallback)

    await flushMicrotasks()

    triggerEvent(ERROR_EVENT, { message: 'native error' })

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('invokes successCallback once when success event fires and Promise rejects', async () => {
    mockSetBiometricsPin.mockRejectedValue(new Error('promise error'))

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.setBiometricsPin('token', 'key', successCallback, errorCallback)

    // Success event fires first
    triggerEvent(SUCCESS_EVENT, mockSuccessResult)

    // Then Promise rejects — outer Promise settlement should ignore it.
    await flushMicrotasks()

    expect(successCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback).not.toHaveBeenCalled()
  })

  it('invokes errorCallback once when error event fires and Promise resolves', async () => {
    mockSetBiometricsPin.mockResolvedValue(mockSuccessResult)

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.setBiometricsPin('token', 'key', successCallback, errorCallback)

    // Error event fires first
    triggerEvent(ERROR_EVENT, { message: 'native error' })

    // Then Promise resolves — outer Promise settlement should ignore it.
    await flushMicrotasks()

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('removes both listeners after success event', async () => {
    let resolvePromise!: (value: SuccessResult) => void
    mockSetBiometricsPin.mockReturnValue(
      new Promise<SuccessResult>(res => {
        resolvePromise = res
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.setBiometricsPin('token', 'key', successCallback, errorCallback)

    const [successRemove, errorRemove] = removeMocks.slice(-2)

    triggerEvent(SUCCESS_EVENT, mockSuccessResult)

    await flushMicrotasks()

    expect(successRemove).toHaveBeenCalledTimes(1)
    expect(errorRemove).toHaveBeenCalledTimes(1)

    resolvePromise(mockSuccessResult)
  })

  it('removes both listeners after error event', async () => {
    let rejectPromise!: (reason: Error) => void
    mockSetBiometricsPin.mockReturnValue(
      new Promise<SuccessResult>((_, rej) => {
        rejectPromise = rej
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.setBiometricsPin('token', 'key', successCallback, errorCallback)

    const [successRemove, errorRemove] = removeMocks.slice(-2)

    triggerEvent(ERROR_EVENT, { message: 'native error' })

    await flushMicrotasks()

    expect(successRemove).toHaveBeenCalledTimes(1)
    expect(errorRemove).toHaveBeenCalledTimes(1)

    rejectPromise(new Error('native error'))
  })
})

// ---------------------------------------------------------------------------
// verifyOTP()
// ---------------------------------------------------------------------------

const mockLoginResult: LoginResult = {
  userToken: 'token',
  encryptionKey: 'key',
}

describe('WalletSdk.verifyOTP', () => {
  it('invokes errorCallback exactly once when error event fires before Promise rejects', async () => {
    let rejectPromise!: (reason: Error) => void
    mockVerifyOTP.mockReturnValue(
      new Promise<LoginResult>((_, rej) => {
        rejectPromise = rej
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.verifyOTP(
      'otp',
      'deviceToken',
      'encKey',
      successCallback,
      errorCallback,
    )

    // Error event fires first
    triggerEvent(ERROR_EVENT, { message: 'native error' })

    // Then Promise also rejects. The already-completed outer Promise ignores it.
    rejectPromise(new Error('promise error'))
    await flushMicrotasks()

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('delivers error event callbacks on a Promise microtask', async () => {
    mockVerifyOTP.mockReturnValue(new Promise<LoginResult>(() => undefined))

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.verifyOTP(
      'otp',
      'deviceToken',
      'encKey',
      successCallback,
      errorCallback,
    )

    triggerEvent(ERROR_EVENT, { message: 'native error' })

    expect(errorCallback).not.toHaveBeenCalled()

    await flushMicrotasks()

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('settles verifyOTP error channel from an overlapping execute error event', async () => {
    mockVerifyOTP.mockImplementation(
      () => new Promise<LoginResult>(() => undefined),
    )
    mockExecute.mockImplementation(
      () => new Promise<SuccessResult>(() => undefined),
    )

    const verifySuccessCallback = jest.fn()
    const verifyErrorCallback = jest.fn()
    const executeSuccessCallback = jest.fn()
    const executeErrorCallback = jest.fn()

    WalletSdk.verifyOTP(
      'otp',
      'deviceToken',
      'encKey',
      verifySuccessCallback,
      verifyErrorCallback,
    )
    WalletSdk.execute(
      'token',
      'key',
      ['challenge-1'],
      executeSuccessCallback,
      executeErrorCallback,
    )

    expect(mockVerifyOTP).toHaveBeenCalledTimes(1)
    expect(mockExecute).toHaveBeenCalledTimes(1)
    expect(listenerMap.get(ERROR_EVENT)).toHaveLength(2)

    triggerEvent(ERROR_EVENT, { message: 'execute native error' })
    await flushMicrotasks()

    expect(verifyErrorCallback).toHaveBeenCalledTimes(1)
    expect(verifyErrorCallback.mock.calls[0][0]).toMatchObject({
      message: 'execute native error',
    })
    expect(executeErrorCallback).toHaveBeenCalledTimes(1)
    expect(verifySuccessCallback).not.toHaveBeenCalled()
    expect(executeSuccessCallback).not.toHaveBeenCalled()
  })

  it('normalizes numeric native error event codes to strings', async () => {
    let rejectPromise!: (reason: Error) => void
    mockVerifyOTP.mockReturnValue(
      new Promise<LoginResult>((_, rej) => {
        rejectPromise = rej
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.verifyOTP(
      'otp',
      'deviceToken',
      'encKey',
      successCallback,
      errorCallback,
    )

    triggerEvent(ERROR_EVENT, {
      code: 155706,
      message: 'Network error',
    })

    rejectPromise(new Error('promise error'))
    await flushMicrotasks()

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback.mock.calls[0][0]).toMatchObject({
      code: '155706',
      message: 'Network error',
    })
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('preserves native error payload details on verifyOTP errors', async () => {
    let rejectPromise!: (reason: Error) => void
    mockVerifyOTP.mockReturnValue(
      new Promise<LoginResult>((_, rej) => {
        rejectPromise = rej
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.verifyOTP(
      'otp',
      'deviceToken',
      'encKey',
      successCallback,
      errorCallback,
    )

    triggerEvent(ERROR_EVENT, {
      code: 155706,
      errorString: 'URLSession timed out while connecting to api.circle.com',
      message: 'Network error',
    })

    rejectPromise(new Error('promise error'))
    await flushMicrotasks()

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback.mock.calls[0][0]).toMatchObject({
      code: '155706',
      errorString: 'URLSession timed out while connecting to api.circle.com',
      message: 'Network error',
    })
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('invokes errorCallback exactly once when Promise rejects before error event fires', async () => {
    mockVerifyOTP.mockRejectedValue(new Error('promise error'))

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.verifyOTP(
      'otp',
      'deviceToken',
      'encKey',
      successCallback,
      errorCallback,
    )

    // Flush microtasks so the native rejection settles the outer Promise.
    await flushMicrotasks()

    // Error event fires after — outer Promise settlement should ignore it.
    triggerEvent(ERROR_EVENT, { message: 'native error' })

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('invokes successCallback exactly once when Promise resolves', async () => {
    mockVerifyOTP.mockResolvedValue(mockLoginResult)

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.verifyOTP(
      'otp',
      'deviceToken',
      'encKey',
      successCallback,
      errorCallback,
    )

    await flushMicrotasks()

    expect(successCallback).toHaveBeenCalledTimes(1)
    expect(successCallback).toHaveBeenCalledWith(mockLoginResult)
    expect(errorCallback).not.toHaveBeenCalled()
  })

  it('does not invoke successCallback when a CirclePwOnSuccess event fires', async () => {
    mockVerifyOTP.mockReturnValue(new Promise<LoginResult>(() => undefined))

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.verifyOTP(
      'otp',
      'deviceToken',
      'encKey',
      successCallback,
      errorCallback,
    )

    triggerEvent(SUCCESS_EVENT, mockSuccessResult)
    await flushMicrotasks()

    expect(successCallback).not.toHaveBeenCalled()
    expect(errorCallback).not.toHaveBeenCalled()
  })

  it('removes error listener via .remove() after error event fires', async () => {
    let rejectPromise!: (reason: Error) => void
    mockVerifyOTP.mockReturnValue(
      new Promise<LoginResult>((_, rej) => {
        rejectPromise = rej
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.verifyOTP(
      'otp',
      'deviceToken',
      'encKey',
      successCallback,
      errorCallback,
    )

    const [errorRemove] = removeMocks.slice(-1)

    triggerEvent(ERROR_EVENT, { message: 'native error' })

    await flushMicrotasks()

    expect(errorRemove).toHaveBeenCalledTimes(1)

    // Prevent unhandled rejection
    rejectPromise(new Error('native error'))
  })

  it('removes error listener via .remove() after Promise resolves', async () => {
    mockVerifyOTP.mockResolvedValue(mockLoginResult)

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.verifyOTP(
      'otp',
      'deviceToken',
      'encKey',
      successCallback,
      errorCallback,
    )

    const [errorRemove] = removeMocks.slice(-1)

    await flushMicrotasks()

    expect(errorRemove).toHaveBeenCalledTimes(1)
  })

  it('removes error listener via .remove() after Promise rejects', async () => {
    mockVerifyOTP.mockRejectedValue(new Error('promise error'))

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.verifyOTP(
      'otp',
      'deviceToken',
      'encKey',
      successCallback,
      errorCallback,
    )

    const [errorRemove] = removeMocks.slice(-1)

    await flushMicrotasks()

    expect(errorRemove).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// setImageMap()
// ---------------------------------------------------------------------------

describe('WalletSdk.setImageMap', () => {
  it('passes all entries to native module when all URIs are valid', () => {
    mockResolveAssetSource.mockReturnValue({ uri: 'mock://asset' })

    const map = new Map<ImageKey, any>([
      [ImageKey.naviBack, 1],
      [ImageKey.naviClose, 2],
    ])

    WalletSdk.setImageMap(map)

    expect(mockNativeModule.setImageMap).toHaveBeenCalledWith({
      [ImageKey.naviBack]: 'mock://asset',
      [ImageKey.naviClose]: 'mock://asset',
    })
  })

  it('filters out entries where resolveAssetSource returns empty URI', () => {
    mockResolveAssetSource
      .mockReturnValueOnce({ uri: 'mock://valid' })
      .mockReturnValueOnce({ uri: '' })

    const map = new Map<ImageKey, any>([
      [ImageKey.naviBack, 1],
      [ImageKey.naviClose, 2],
    ])

    WalletSdk.setImageMap(map)

    expect(mockNativeModule.setImageMap).toHaveBeenCalledWith({
      [ImageKey.naviBack]: 'mock://valid',
    })
  })

  it('calls native module with empty object when all URIs resolve to null', () => {
    mockResolveAssetSource.mockReturnValue(null)

    const map = new Map<ImageKey, any>([
      [ImageKey.naviBack, 1],
      [ImageKey.naviClose, 2],
    ])

    WalletSdk.setImageMap(map)

    expect(mockNativeModule.setImageMap).toHaveBeenCalledWith({})
  })
})

// ---------------------------------------------------------------------------
// setIconTextConfigsMap()
// ---------------------------------------------------------------------------

describe('WalletSdk.setIconTextConfigsMap', () => {
  it('serializes a valid image source to its resolved URI alongside textConfig', () => {
    mockResolveAssetSource.mockReturnValue({ uri: 'mock://icon' })

    const textConfig = new TextConfig('hello', '#ffffff', 'Inter')
    const map = new Map<IconTextsKey, IconTextConfig[]>([
      [
        IconTextsKey.securityConfirmationItems,
        [new IconTextConfig(1 as any, textConfig)],
      ],
    ])

    WalletSdk.setIconTextConfigsMap(map)

    expect(mockNativeModule.setIconTextConfigsMap).toHaveBeenCalledWith({
      [IconTextsKey.securityConfirmationItems]: [
        { image: 'mock://icon', textConfig: { ...textConfig } },
      ],
    })
  })

  it('passes image: null when the image source is null or undefined', () => {
    const map = new Map<IconTextsKey, IconTextConfig[]>([
      [
        IconTextsKey.securityConfirmationItems,
        [
          new IconTextConfig(null as any, new TextConfig('a')),
          new IconTextConfig(undefined as any, new TextConfig('b')),
        ],
      ],
    ])

    WalletSdk.setIconTextConfigsMap(map)

    expect(mockNativeModule.setIconTextConfigsMap).toHaveBeenCalledWith({
      [IconTextsKey.securityConfirmationItems]: [
        { image: null, textConfig: { ...new TextConfig('a') } },
        { image: null, textConfig: { ...new TextConfig('b') } },
      ],
    })
  })

  it('defaults missing textConfig to an empty object', () => {
    mockResolveAssetSource.mockReturnValue({ uri: 'mock://icon' })

    // Bypass the IconTextConfig constructor to simulate a caller-supplied
    // entry without a textConfig field — exercises the `textConfig = {}` default.
    const configWithoutTextConfig = { image: 1 } as unknown as IconTextConfig
    const map = new Map<IconTextsKey, IconTextConfig[]>([
      [IconTextsKey.securityConfirmationItems, [configWithoutTextConfig]],
    ])

    WalletSdk.setIconTextConfigsMap(map)

    expect(mockNativeModule.setIconTextConfigsMap).toHaveBeenCalledWith({
      [IconTextsKey.securityConfirmationItems]: [
        { image: 'mock://icon', textConfig: {} },
      ],
    })
  })

  it('serializes mixed entries (with image and without image)', () => {
    mockResolveAssetSource.mockReturnValueOnce({ uri: 'mock://first' })
    // Second entry has a null image source — getImageUrl is short-circuited
    // before resolveAssetSource is reached, so no second return is consumed.

    const firstText = new TextConfig('first')
    const secondText = new TextConfig('second')
    const map = new Map<IconTextsKey, IconTextConfig[]>([
      [
        IconTextsKey.securityConfirmationItems,
        [
          new IconTextConfig(1 as any, firstText),
          new IconTextConfig(null as any, secondText),
        ],
      ],
    ])

    WalletSdk.setIconTextConfigsMap(map)

    expect(mockNativeModule.setIconTextConfigsMap).toHaveBeenCalledWith({
      [IconTextsKey.securityConfirmationItems]: [
        { image: 'mock://first', textConfig: { ...firstText } },
        { image: null, textConfig: { ...secondText } },
      ],
    })
  })

  it('swallows errors thrown by Image.resolveAssetSource without calling native', () => {
    mockResolveAssetSource.mockImplementation(() => {
      throw new Error('resolveAssetSource boom')
    })
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const map = new Map<IconTextsKey, IconTextConfig[]>([
      [
        IconTextsKey.securityConfirmationItems,
        [new IconTextConfig(1 as any, new TextConfig('x'))],
      ],
    ])

    expect(() => WalletSdk.setIconTextConfigsMap(map)).not.toThrow()
    expect(mockNativeModule.setIconTextConfigsMap).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith(
      'setIconTextConfigsMap Error:',
      expect.any(Error),
    )

    errorSpy.mockRestore()
    // jest.clearAllMocks() (in beforeEach) clears call records but does NOT
    // reset the implementation we installed via mockImplementation, so restore
    // it explicitly to avoid leaking the throwing behaviour to later tests.
    mockResolveAssetSource.mockReset()
    mockResolveAssetSource.mockReturnValue({ uri: 'mock://asset' })
  })

  it('does not call Image.resolveAssetSource when image is falsy and emits image: null', () => {
    // Contract this test verifies: when config.image is falsy,
    // Image.resolveAssetSource is never invoked and the serialized payload
    // emits image: null. The implementation may achieve the short-circuit
    // via either guard (the `image ? ... : null` ternary in
    // setIconTextConfigsMap or getImageUrl's own `if (!source)` early
    // return); we only assert the observable behaviour, not which guard fires.
    const firstText = new TextConfig('a')
    const secondText = new TextConfig('b')
    const map = new Map<IconTextsKey, IconTextConfig[]>([
      [
        IconTextsKey.securityConfirmationItems,
        [
          new IconTextConfig(null as any, firstText),
          new IconTextConfig(undefined as any, secondText),
        ],
      ],
    ])

    WalletSdk.setIconTextConfigsMap(map)

    expect(mockResolveAssetSource).not.toHaveBeenCalled()
    expect(mockNativeModule.setIconTextConfigsMap).toHaveBeenCalledTimes(1)
    expect(mockNativeModule.setIconTextConfigsMap).toHaveBeenCalledWith({
      [IconTextsKey.securityConfirmationItems]: [
        { image: null, textConfig: { ...firstText } },
        { image: null, textConfig: { ...secondText } },
      ],
    })
  })

  it('passes image: null when resolveAssetSource returns null for a truthy image', () => {
    // Covers the `!resolved` branch of getImageUrl. The earlier
    // null/undefined-image test short-circuits at `if (!source) return null`
    // before resolveAssetSource is called, so this is the only case where a
    // truthy image reaches resolveAssetSource and receives null back.
    mockResolveAssetSource.mockReturnValue(null as any)

    const textConfig = new TextConfig('item')
    const map = new Map<IconTextsKey, IconTextConfig[]>([
      [
        IconTextsKey.securityConfirmationItems,
        [new IconTextConfig(1 as any, textConfig)],
      ],
    ])

    WalletSdk.setIconTextConfigsMap(map)

    expect(mockResolveAssetSource).toHaveBeenCalledTimes(1)
    expect(mockResolveAssetSource).toHaveBeenCalledWith(1)
    expect(mockNativeModule.setIconTextConfigsMap).toHaveBeenCalledWith({
      [IconTextsKey.securityConfirmationItems]: [
        { image: null, textConfig: { ...textConfig } },
      ],
    })
  })

  it('passes image: null when resolveAssetSource returns an empty URI', () => {
    // Covers the `resolved.uri.trim() === ''` branch of getImageUrl —
    // distinct from the `!resolved` branch covered by the test above.
    mockResolveAssetSource.mockReturnValue({ uri: '' })

    const textConfig = new TextConfig('item')
    const map = new Map<IconTextsKey, IconTextConfig[]>([
      [
        IconTextsKey.securityConfirmationItems,
        [new IconTextConfig(1 as any, textConfig)],
      ],
    ])

    WalletSdk.setIconTextConfigsMap(map)

    expect(mockResolveAssetSource).toHaveBeenCalledTimes(1)
    expect(mockResolveAssetSource).toHaveBeenCalledWith(1)
    expect(mockNativeModule.setIconTextConfigsMap).toHaveBeenCalledWith({
      [IconTextsKey.securityConfirmationItems]: [
        { image: null, textConfig: { ...textConfig } },
      ],
    })
  })

  it('swallows errors thrown during rawMap iteration without calling native', () => {
    // Complements the resolveAssetSource-throws test above by exercising the
    // other branch the catch must cover: a failure in rawMap.entries() (or
    // any other code before image resolution). A refactor that moved part
    // of the work outside the try/catch would be caught here.
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const iterationError = new Error('entries failed')

    const badMap = {
      entries: () => {
        throw iterationError
      },
    } as unknown as Map<IconTextsKey, IconTextConfig[]>

    expect(() => WalletSdk.setIconTextConfigsMap(badMap)).not.toThrow()
    expect(mockNativeModule.setIconTextConfigsMap).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith(
      'setIconTextConfigsMap Error:',
      iterationError,
    )
  })
})

// ---------------------------------------------------------------------------
// init() — user-agent side-effect (AGENTS.md §User-Agent Header)
// ---------------------------------------------------------------------------

const validConfig: Configuration = {
  endpoint: 'https://example.com',
  appId: 'test-app',
}

// Semver-compatible version suffix: CI pipelines append build metadata
// (e.g. 2.0.0-693) to package.json#version before running tests, so the
// pattern must accept the optional pre-release/build segment.
const VERSION_PATTERN = String.raw`\d+\.\d+\.\d+(?:[-+][\w.-]+)?`

describe('WalletSdk.init — user-agent side-effect', () => {
  it('calls setCustomUserAgent with Circle-Programmable-Wallet-SDK-RN/<version>', () => {
    WalletSdk.init(validConfig)

    expect(mockNativeModule.setCustomUserAgent).toHaveBeenCalledTimes(1)
    expect(mockNativeModule.setCustomUserAgent).toHaveBeenCalledWith(
      expect.stringMatching(
        new RegExp(`^Circle-Programmable-Wallet-SDK-RN\\/${VERSION_PATTERN}$`),
      ),
    )
  })

  it('calls setCustomUserAgent synchronously before the init Promise resolves', () => {
    // Never-resolving Promise — if setCustomUserAgent were placed after an
    // `await` of the initSdk result, the spy would never fire.
    mockNativeModule.initSdk.mockReturnValueOnce(new Promise<void>(() => {}))

    // Deliberately do not await — assert the synchronous side-effect.
    void WalletSdk.init(validConfig)

    expect(mockNativeModule.setCustomUserAgent).toHaveBeenCalledTimes(1)
    expect(mockNativeModule.setCustomUserAgent).toHaveBeenCalledWith(
      expect.stringMatching(
        new RegExp(`^Circle-Programmable-Wallet-SDK-RN\\/${VERSION_PATTERN}$`),
      ),
    )
  })
})

// ---------------------------------------------------------------------------
// setCustomUserAgent() — prefix prepend (AGENTS.md §User-Agent Header)
// ---------------------------------------------------------------------------

describe('WalletSdk.setCustomUserAgent — prefix prepend', () => {
  it('forwards Circle-Programmable-Wallet-SDK-RN/<version> | <userAgent> to native', () => {
    WalletSdk.setCustomUserAgent('myAgent')

    expect(mockNativeModule.setCustomUserAgent).toHaveBeenCalledTimes(1)
    expect(mockNativeModule.setCustomUserAgent).toHaveBeenCalledWith(
      expect.stringMatching(
        new RegExp(
          `^Circle-Programmable-Wallet-SDK-RN\\/${VERSION_PATTERN} \\| myAgent$`,
        ),
      ),
    )
  })

  it('does NOT forward the raw userAgent string as-is', () => {
    WalletSdk.setCustomUserAgent('myAgent')

    expect(mockNativeModule.setCustomUserAgent).not.toHaveBeenCalledWith(
      'myAgent',
    )
  })

  it('propagates the exact native error instance to the caller', () => {
    const nativeError = new Error('native UA error')
    mockNativeModule.setCustomUserAgent.mockImplementationOnce(() => {
      throw nativeError
    })

    let caught: unknown
    try {
      WalletSdk.setCustomUserAgent('anything')
    } catch (e) {
      caught = e
    }

    expect(caught).toBe(nativeError)
    expect(mockNativeModule.setCustomUserAgent).toHaveBeenCalledTimes(1)
  })
})

describe('WalletSdk error-swallowing setters', () => {
  const cases = [
    {
      methodName: 'setSecurityQuestions',
      nativeMethod: 'setSecurityQuestions',
      invoke: () => WalletSdk.setSecurityQuestions([{ title: 'Question' }]),
      errorMessage: 'setSecurityQuestions failed:',
    },
    {
      methodName: 'setDebugging',
      nativeMethod: 'setDebugging',
      invoke: () => WalletSdk.setDebugging(true),
      errorMessage: 'setDebugging failed:',
    },
    {
      methodName: 'setDismissOnCallbackMap',
      nativeMethod: 'setDismissOnCallbackMap',
      invoke: () =>
        WalletSdk.setDismissOnCallbackMap(new Map([[ErrorCode.unknown, true]])),
      errorMessage: 'setDismissOnCallbackMap failed:',
    },
    {
      methodName: 'setTextConfigsMap',
      nativeMethod: 'setTextConfigsMap',
      invoke: () =>
        WalletSdk.setTextConfigsMap(
          new Map([[TextsKey.newPinCodeHeadline, [new TextConfig('Title')]]]),
        ),
      errorMessage: 'setTextConfigsMap failed:',
    },
    {
      methodName: 'setTextConfigMap',
      nativeMethod: 'setTextConfigMap',
      invoke: () =>
        WalletSdk.setTextConfigMap(
          new Map([[TextKey.circlepw_continue, new TextConfig('Continue')]]),
        ),
      errorMessage: 'setTextConfigMap failed:',
    },
    {
      methodName: 'setIconTextConfigsMap',
      nativeMethod: 'setIconTextConfigsMap',
      invoke: () =>
        WalletSdk.setIconTextConfigsMap(
          new Map([
            [
              IconTextsKey.securityConfirmationItems,
              [new IconTextConfig(1 as any, new TextConfig('Item'))],
            ],
          ]),
        ),
      errorMessage: 'setIconTextConfigsMap Error:',
    },
    {
      methodName: 'setErrorStringMap',
      nativeMethod: 'setErrorStringMap',
      invoke: () =>
        WalletSdk.setErrorStringMap(
          new Map([[ErrorCode.apiParameterInvalid, 'Invalid parameter']]),
        ),
      errorMessage: 'setErrorStringMap failed:',
    },
    {
      methodName: 'setDateFormat',
      nativeMethod: 'setDateFormat',
      invoke: () => WalletSdk.setDateFormat(DateFormat.YYYYMMDD_HYPHEN),
      errorMessage: 'setDateFormat failed:',
    },
    {
      methodName: 'setImageMap',
      nativeMethod: 'setImageMap',
      invoke: () => WalletSdk.setImageMap(new Map([[ImageKey.naviBack, 1]])),
      errorMessage: 'setImageMap failed:',
    },
    {
      methodName: 'moveTaskToFront',
      nativeMethod: 'moveTaskToFront',
      invoke: () => WalletSdk.moveTaskToFront(),
      errorMessage: 'moveTaskToFront failed:',
    },
    {
      methodName: 'moveRnTaskToFront',
      nativeMethod: 'moveRnTaskToFront',
      invoke: () => WalletSdk.moveRnTaskToFront(),
      errorMessage: 'moveRnTaskToFront failed:',
    },
  ] as const

  it.each(cases)(
    '$methodName swallows native errors and logs the thrown value',
    ({ nativeMethod, invoke, errorMessage }) => {
      const nativeError = new Error(`${nativeMethod} native error`)
      const nativeMock = mockNativeModule[nativeMethod] as jest.Mock
      nativeMock.mockImplementationOnce(() => {
        throw nativeError
      })
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      try {
        expect(invoke).not.toThrow()
        expect(nativeMock).toHaveBeenCalledTimes(1)
        expect(errorSpy).toHaveBeenCalledTimes(1)
        expect(errorSpy).toHaveBeenCalledWith(errorMessage, nativeError)
      } finally {
        errorSpy.mockRestore()
      }
    },
  )
})

// ---------------------------------------------------------------------------
// bridgeSafe-serializing setters — happy-path delegation
// (error paths are covered by the parameterized suite above)
// ---------------------------------------------------------------------------

describe('WalletSdk.setDismissOnCallbackMap', () => {
  it('serializes the Map to a plain object and delegates to the native module', () => {
    const map = new Map<ErrorCode, boolean>([
      [ErrorCode.unknown, true],
      [ErrorCode.apiParameterInvalid, false],
    ])

    expect(() => WalletSdk.setDismissOnCallbackMap(map)).not.toThrow()

    expect(mockNativeModule.setDismissOnCallbackMap).toHaveBeenCalledTimes(1)
    expect(mockNativeModule.setDismissOnCallbackMap).toHaveBeenCalledWith({
      [ErrorCode.unknown]: true,
      [ErrorCode.apiParameterInvalid]: false,
    })
  })
})

describe('WalletSdk.setTextConfigsMap', () => {
  it('serializes the Map to a plain object and delegates to the native module', () => {
    const headlineConfig = new TextConfig('Headline', '#ffffff', 'Inter')
    const map = new Map<TextsKey, TextConfig[]>([
      [TextsKey.newPinCodeHeadline, [headlineConfig]],
    ])

    expect(() => WalletSdk.setTextConfigsMap(map)).not.toThrow()

    expect(mockNativeModule.setTextConfigsMap).toHaveBeenCalledTimes(1)
    expect(mockNativeModule.setTextConfigsMap).toHaveBeenCalledWith({
      [TextsKey.newPinCodeHeadline]: [{ ...headlineConfig }],
    })
  })
})

describe('WalletSdk.setTextConfigMap', () => {
  it('serializes the Map to a plain object and delegates to the native module', () => {
    const continueConfig = new TextConfig('Continue', '#000000', 'Inter')
    const map = new Map<TextKey, TextConfig>([
      [TextKey.circlepw_continue, continueConfig],
    ])

    expect(() => WalletSdk.setTextConfigMap(map)).not.toThrow()

    expect(mockNativeModule.setTextConfigMap).toHaveBeenCalledTimes(1)
    expect(mockNativeModule.setTextConfigMap).toHaveBeenCalledWith({
      [TextKey.circlepw_continue]: { ...continueConfig },
    })
  })
})

describe('WalletSdk.setErrorStringMap', () => {
  it('serializes the Map to a plain object and delegates to the native module', () => {
    const map = new Map<ErrorCode, string>([
      [ErrorCode.apiParameterInvalid, 'Invalid parameter'],
      [ErrorCode.unknown, 'Something went wrong'],
    ])

    expect(() => WalletSdk.setErrorStringMap(map)).not.toThrow()

    expect(mockNativeModule.setErrorStringMap).toHaveBeenCalledTimes(1)
    expect(mockNativeModule.setErrorStringMap).toHaveBeenCalledWith({
      [ErrorCode.apiParameterInvalid]: 'Invalid parameter',
      [ErrorCode.unknown]: 'Something went wrong',
    })
  })
})

// ---------------------------------------------------------------------------
// performLogin() — Promise-only settlement
// ---------------------------------------------------------------------------

describe('WalletSdk.performLogin', () => {
  it('invokes successCallback exactly once with LoginResult when Promise resolves', async () => {
    mockNativeModule.performLogin.mockResolvedValueOnce(mockLoginResult)

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.performLogin(
      SocialProvider.Google,
      'dtoken',
      'ekey',
      successCallback,
      errorCallback,
    )

    // Flush microtask queue so Promise .then runs
    await Promise.resolve()

    expect(mockNativeModule.performLogin).toHaveBeenCalledWith(
      SocialProvider.Google,
      'dtoken',
      'ekey',
    )
    expect(successCallback).toHaveBeenCalledTimes(1)
    expect(successCallback).toHaveBeenCalledWith(mockLoginResult)
    expect(errorCallback).not.toHaveBeenCalled()
  })

  it('invokes errorCallback exactly once with Error when Promise rejects', async () => {
    const rejection = new Error('login failed')
    mockNativeModule.performLogin.mockRejectedValueOnce(rejection)

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.performLogin(
      SocialProvider.Google,
      'dtoken',
      'ekey',
      successCallback,
      errorCallback,
    )

    // Flush microtask queue so Promise .then → .catch chain runs
    await Promise.resolve()
    await Promise.resolve()

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback).toHaveBeenCalledWith(rejection)
    expect(successCallback).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// performLogout() — Promise-only settlement
// ---------------------------------------------------------------------------

describe('WalletSdk.performLogout', () => {
  it('invokes completedCallback exactly once when Promise resolves', async () => {
    mockNativeModule.performLogout.mockResolvedValueOnce(undefined)

    const completedCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.performLogout(
      SocialProvider.Google,
      completedCallback,
      errorCallback,
    )

    // Flush microtask queue so Promise .then runs
    await Promise.resolve()

    expect(mockNativeModule.performLogout).toHaveBeenCalledWith(
      SocialProvider.Google,
    )
    expect(completedCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback).not.toHaveBeenCalled()
  })

  it('invokes errorCallback exactly once with Error when Promise rejects', async () => {
    const rejection = new Error('logout failed')
    mockNativeModule.performLogout.mockRejectedValueOnce(rejection)

    const completedCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.performLogout(
      SocialProvider.Google,
      completedCallback,
      errorCallback,
    )

    // Flush microtask queue so Promise .then → .catch chain runs
    await Promise.resolve()
    await Promise.resolve()

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback).toHaveBeenCalledWith(rejection)
    expect(completedCallback).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// setIconTextConfigsMap() — image resolution and null-preservation
// (spec: docs/specs/rn-sdk-api-surface.md §setIconTextConfigsMap,
//        docs/specs/rn-sdk-patterns.md §setIconTextConfigsMap)
// ---------------------------------------------------------------------------

describe('WalletSdk.setIconTextConfigsMap', () => {
  it('calls Image.resolveAssetSource once per IconTextConfig image', () => {
    mockResolveAssetSource.mockReturnValue({ uri: 'mock://asset' })

    const map = new Map<IconTextsKey, IconTextConfig[]>([
      [
        IconTextsKey.securityConfirmationItems,
        [
          new IconTextConfig(1 as any, new TextConfig('item 1')),
          new IconTextConfig(2 as any, new TextConfig('item 2')),
        ],
      ],
    ])

    WalletSdk.setIconTextConfigsMap(map)

    expect(mockResolveAssetSource).toHaveBeenCalledTimes(2)
    expect(mockResolveAssetSource).toHaveBeenNthCalledWith(1, 1)
    expect(mockResolveAssetSource).toHaveBeenNthCalledWith(2, 2)
  })

  it('forwards image: null when resolveAssetSource returns null (entry NOT dropped)', () => {
    mockResolveAssetSource
      .mockReturnValueOnce({ uri: 'mock://valid' })
      .mockReturnValueOnce(null)

    const map = new Map<IconTextsKey, IconTextConfig[]>([
      [
        IconTextsKey.securityConfirmationItems,
        [
          new IconTextConfig(1 as any, new TextConfig('valid')),
          new IconTextConfig(2 as any, new TextConfig('null-resolve')),
        ],
      ],
    ])

    WalletSdk.setIconTextConfigsMap(map)

    expect(mockNativeModule.setIconTextConfigsMap).toHaveBeenCalledTimes(1)
    const arg = mockNativeModule.setIconTextConfigsMap.mock.calls[0][0]
    const entries = arg[IconTextsKey.securityConfirmationItems]
    expect(entries).toHaveLength(2)
    expect(entries[0].image).toBe('mock://valid')
    expect(entries[1].image).toBeNull()
  })

  it('forwards image: null when resolveAssetSource returns empty URI (entry NOT dropped)', () => {
    mockResolveAssetSource.mockReturnValue({ uri: '' })

    const map = new Map<IconTextsKey, IconTextConfig[]>([
      [
        IconTextsKey.securityConfirmationItems,
        [new IconTextConfig(1 as any, new TextConfig('empty-uri'))],
      ],
    ])

    WalletSdk.setIconTextConfigsMap(map)

    const arg = mockNativeModule.setIconTextConfigsMap.mock.calls[0][0]
    const entries = arg[IconTextsKey.securityConfirmationItems]
    expect(entries).toHaveLength(1)
    expect(entries[0].image).toBeNull()
  })

  it('forwards the resolved URI string to the native module', () => {
    mockResolveAssetSource.mockReturnValue({ uri: 'mock://icon-resolved' })

    const map = new Map<IconTextsKey, IconTextConfig[]>([
      [
        IconTextsKey.securityConfirmationItems,
        [new IconTextConfig(42 as any, new TextConfig('item'))],
      ],
    ])

    WalletSdk.setIconTextConfigsMap(map)

    const arg = mockNativeModule.setIconTextConfigsMap.mock.calls[0][0]
    expect(arg[IconTextsKey.securityConfirmationItems][0].image).toBe(
      'mock://icon-resolved',
    )
  })

  it('passes textConfig through unchanged', () => {
    mockResolveAssetSource.mockReturnValue({ uri: 'mock://asset' })

    const textConfig = new TextConfig('My Label', '#FF0000', 'CustomFont')

    const map = new Map<IconTextsKey, IconTextConfig[]>([
      [
        IconTextsKey.securityConfirmationItems,
        [new IconTextConfig(1 as any, textConfig)],
      ],
    ])

    WalletSdk.setIconTextConfigsMap(map)

    const arg = mockNativeModule.setIconTextConfigsMap.mock.calls[0][0]
    const sent = arg[IconTextsKey.securityConfirmationItems][0].textConfig
    expect(sent.text).toBe('My Label')
    expect(sent.textColor).toBe('#FF0000')
    expect(sent.font).toBe('CustomFont')
  })

  it('serializes Map to a plain Record (not a Map instance) via bridgeSafe', () => {
    mockResolveAssetSource.mockReturnValue({ uri: 'mock://asset' })

    // The production code constructs `processedObj` as a plain `{}` before
    // calling bridgeSafe, but leaves nested `textConfig` as the original
    // `TextConfig` class instance. Only after bridgeSafe's
    // JSON.parse(JSON.stringify(...)) round-trip does the nested instance
    // lose its class identity. So we assert on the nested shape as well —
    // that's what proves bridgeSafe actually ran.
    const map = new Map<IconTextsKey, IconTextConfig[]>([
      [
        IconTextsKey.securityConfirmationItems,
        [new IconTextConfig(1 as any, new TextConfig('item'))],
      ],
    ])

    WalletSdk.setIconTextConfigsMap(map)

    const arg = mockNativeModule.setIconTextConfigsMap.mock.calls[0][0]
    expect(arg).not.toBeInstanceOf(Map)
    expect(Object.getPrototypeOf(arg)).toBe(Object.prototype)

    const innerTextConfig =
      arg[IconTextsKey.securityConfirmationItems][0].textConfig
    expect(innerTextConfig).not.toBeInstanceOf(TextConfig)
    expect(Object.getPrototypeOf(innerTextConfig)).toBe(Object.prototype)
  })
})

describe('WalletSdk.moveTaskToFront', () => {
  it('delegates to the native module exactly once and does not throw', () => {
    expect(() => WalletSdk.moveTaskToFront()).not.toThrow()

    expect(mockNativeModule.moveTaskToFront).toHaveBeenCalledTimes(1)
    expect(mockNativeModule.moveTaskToFront).toHaveBeenCalledWith()
  })
})

describe('WalletSdk.moveRnTaskToFront', () => {
  it('delegates to the native module exactly once and does not throw', () => {
    expect(() => WalletSdk.moveRnTaskToFront()).not.toThrow()

    expect(mockNativeModule.moveRnTaskToFront).toHaveBeenCalledTimes(1)
    expect(mockNativeModule.moveRnTaskToFront).toHaveBeenCalledWith()
  })
})

// ---------------------------------------------------------------------------
// setSecurityQuestions()
// ---------------------------------------------------------------------------

describe('WalletSdk.setSecurityQuestions', () => {
  beforeEach(() => {
    mockNativeModule.setSecurityQuestions.mockClear()
  })

  it('normalizes mixed input shapes and delegates the result to the native module', () => {
    // The public signature declares `SecurityQuestion[]`, but the runtime
    // accepts tuples, capitalized keys, and bare primitives via
    // toPlainSecurityQuestion. Cast through `unknown` to feed the looser
    // shapes that the normalization path is meant to handle.
    const mixed = [
      ['What is your pet name?', InputType.text],
      { title: 'When were you born?', inputType: 1 },
      'Bare string question',
    ] as unknown as Parameters<typeof WalletSdk.setSecurityQuestions>[0]
    WalletSdk.setSecurityQuestions(mixed)

    expect(mockNativeModule.setSecurityQuestions).toHaveBeenCalledTimes(1)
    expect(mockNativeModule.setSecurityQuestions).toHaveBeenCalledWith([
      expect.objectContaining({
        title: 'What is your pet name?',
        inputType: InputType.text,
      }),
      expect.objectContaining({
        title: 'When were you born?',
        inputType: InputType.datePicker,
      }),
      expect.objectContaining({
        title: 'Bare string question',
        inputType: InputType.text,
      }),
    ])
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
  ])(
    'forwards an empty array to the native module when given %s',
    (_label, input) => {
      // The `securityQuestions || []` guard only takes the `[]` branch for
      // falsy input. A non-empty array (happy path) and an empty array are
      // both truthy, so this is the sole case that exercises that branch.
      WalletSdk.setSecurityQuestions(
        input as unknown as Parameters<
          typeof WalletSdk.setSecurityQuestions
        >[0],
      )

      expect(mockNativeModule.setSecurityQuestions).toHaveBeenCalledTimes(1)
      expect(mockNativeModule.setSecurityQuestions).toHaveBeenCalledWith([])
    },
  )

  it('forwards an empty array to the native module when given an empty array', () => {
    WalletSdk.setSecurityQuestions([])

    expect(mockNativeModule.setSecurityQuestions).toHaveBeenCalledTimes(1)
    expect(mockNativeModule.setSecurityQuestions).toHaveBeenCalledWith([])
  })

  it('swallows errors thrown by the native setSecurityQuestions and logs the thrown value', () => {
    const nativeError = new Error('native boom')
    mockNativeModule.setSecurityQuestions.mockImplementationOnce(() => {
      throw nativeError
    })
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    try {
      expect(() =>
        WalletSdk.setSecurityQuestions([
          { title: 'Q?', inputType: InputType.text },
        ]),
      ).not.toThrow()
      expect(mockNativeModule.setSecurityQuestions).toHaveBeenCalledTimes(1)
      expect(errorSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy).toHaveBeenCalledWith(
        'setSecurityQuestions failed:',
        nativeError,
      )
    } finally {
      // Guarantee the console.error spy is restored even if an assertion
      // above throws — otherwise the spy would leak to later tests in the
      // file and silently swallow real error logs.
      errorSpy.mockRestore()
    }
  })
})
