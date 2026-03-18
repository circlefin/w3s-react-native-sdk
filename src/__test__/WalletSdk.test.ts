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
  callbacks.forEach((cb) => cb(payload))
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
import type { LoginResult, SuccessResult } from '../types'

const SUCCESS_EVENT = 'CirclePwOnSuccess'
const ERROR_EVENT = 'CirclePwOnError'

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
// execute()
// ---------------------------------------------------------------------------

describe('WalletSdk.execute', () => {
  it('invokes successCallback exactly once when event fires before Promise resolves', async () => {
    let resolvePromise!: (value: SuccessResult) => void
    mockExecute.mockReturnValue(
      new Promise<SuccessResult>((res) => {
        resolvePromise = res
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.execute('token', 'key', ['challenge-1'], successCallback, errorCallback)

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

    WalletSdk.execute('token', 'key', ['challenge-1'], successCallback, errorCallback)

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

    WalletSdk.execute('token', 'key', ['challenge-1'], successCallback, errorCallback)

    // Error event fires first
    triggerEvent(ERROR_EVENT, { message: 'native error' })

    // Then Promise rejects
    rejectPromise(new Error('promise error'))
    await Promise.resolve()

    expect(errorCallback).toHaveBeenCalledTimes(1)
    expect(successCallback).not.toHaveBeenCalled()
  })

  it('invokes errorCallback exactly once when Promise rejects before error event fires', async () => {
    mockExecute.mockRejectedValue(new Error('promise error'))

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.execute('token', 'key', ['challenge-1'], successCallback, errorCallback)

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

    WalletSdk.execute('token', 'key', ['challenge-1'], successCallback, errorCallback)

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

    WalletSdk.execute('token', 'key', ['challenge-1'], successCallback, errorCallback)

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
      new Promise<SuccessResult>((res) => {
        resolvePromise = res
      }),
    )

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.execute('token', 'key', ['challenge-1'], successCallback, errorCallback)

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

    WalletSdk.execute('token', 'key', ['challenge-1'], successCallback, errorCallback)

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
      new Promise<SuccessResult>((res) => {
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
      new Promise<SuccessResult>((res) => {
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

const mockLoginResult: LoginResult = { userToken: 'token', encryptionKey: 'key' }

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

    WalletSdk.verifyOTP('otp', 'deviceToken', 'encKey', successCallback, errorCallback)

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

    WalletSdk.verifyOTP('otp', 'deviceToken', 'encKey', successCallback, errorCallback)

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

    WalletSdk.verifyOTP('otp', 'deviceToken', 'encKey', successCallback, errorCallback)

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

    WalletSdk.verifyOTP('otp', 'deviceToken', 'encKey', successCallback, errorCallback)

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

    WalletSdk.verifyOTP('otp', 'deviceToken', 'encKey', successCallback, errorCallback)

    const [errorRemove] = removeMocks.slice(-1)

    await Promise.resolve()
    await Promise.resolve()

    expect(errorRemove).toHaveBeenCalledTimes(1)
  })

  it('removes error listener via .remove() after Promise rejects', async () => {
    mockVerifyOTP.mockRejectedValue(new Error('promise error'))

    const successCallback = jest.fn()
    const errorCallback = jest.fn()

    WalletSdk.verifyOTP('otp', 'deviceToken', 'encKey', successCallback, errorCallback)

    const [errorRemove] = removeMocks.slice(-1)

    await Promise.resolve()
    await Promise.resolve()

    expect(errorRemove).toHaveBeenCalledTimes(1)
  })
})
