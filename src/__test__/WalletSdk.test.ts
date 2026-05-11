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
import { ImageKey, SocialProvider } from '../types'
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
    await Promise.resolve()

    expect(successCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback).not.toHaveBeenCalled()
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

    // Flush microtask queue so Promise .then runs
    await Promise.resolve()

    // Fire event after Promise already settled
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
    await Promise.resolve()

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
    await Promise.resolve()

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
    await Promise.resolve()

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

    // Flush microtask queue so Promise .catch runs
    await Promise.resolve()

    // Fire error event after Promise already rejected
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

    // Then Promise rejects — settled flag should suppress errorCallback
    await Promise.resolve()

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

    // Then Promise resolves — settled flag should suppress successCallback
    await Promise.resolve()

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('removes both listeners after success event', () => {
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

    expect(successRemove).toHaveBeenCalledTimes(1)
    expect(errorRemove).toHaveBeenCalledTimes(1)

    // Prevent unhandled rejection
    resolvePromise(mockSuccessResult)
  })

  it('removes both listeners after error event', () => {
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
    await Promise.resolve()

    expect(successCallback).toHaveBeenCalledTimes(1)
    expect(errorCallback).not.toHaveBeenCalled()
  })

  it('invokes successCallback exactly once when Promise resolves before event fires', async () => {
    mockSetBiometricsPin.mockResolvedValue(mockSuccessResult)

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.setBiometricsPin('token', 'key', successCallback, errorCallback)

    await Promise.resolve()

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
    await Promise.resolve()

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
    await Promise.resolve()

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

    await Promise.resolve()

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

    // Then Promise rejects — settled flag should suppress errorCallback
    await Promise.resolve()

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

    // Then Promise resolves — settled flag should suppress successCallback
    await Promise.resolve()

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('removes both listeners after success event', () => {
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

    expect(successRemove).toHaveBeenCalledTimes(1)
    expect(errorRemove).toHaveBeenCalledTimes(1)

    resolvePromise(mockSuccessResult)
  })

  it('removes both listeners after error event', () => {
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

    // Then Promise also rejects — without settled flag, errorCallback fires twice
    rejectPromise(new Error('promise error'))
    // Flush all pending microtasks (.catch + .finally)
    await Promise.resolve()
    await Promise.resolve()

    expect(errorCallback).toHaveBeenCalledTimes(1)
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

    // Flush microtask queue so Promise .catch + .finally run
    await Promise.resolve()
    await Promise.resolve()

    // Error event fires after — settled flag should suppress it
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

    await Promise.resolve()
    await Promise.resolve()

    expect(successCallback).toHaveBeenCalledTimes(1)
    expect(successCallback).toHaveBeenCalledWith(mockLoginResult)
    expect(errorCallback).not.toHaveBeenCalled()
  })

  it('removes error listener via .remove() after error event fires', () => {
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

    await Promise.resolve()
    await Promise.resolve()

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

    await Promise.resolve()
    await Promise.resolve()

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
