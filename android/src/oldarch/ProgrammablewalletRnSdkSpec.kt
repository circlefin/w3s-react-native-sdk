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
package com.circlefin.programmablewalletrnsdk

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import circle.programmablewallet.sdk.WalletSdk

abstract class ProgrammablewalletRnSdkSpec internal constructor(val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {

  abstract fun initSdk(configuration: ReadableMap, promise: Promise)
  abstract fun setSecurityQuestions(questionArr: ReadableArray)
  abstract fun getDeviceId(): String
  abstract fun execute(
    userToken: String?,
    secretKey: String?,
    challengeIdArr: ReadableArray,
    promise: Promise?
  )
  abstract fun setBiometricsPin(
    userToken: String?,
    secretKey: String?,
    promise: Promise?
  )
  abstract fun performLogin(
    provider: String,
    deviceToken: String,
    deviceEncryptionKey: String,
    promise: Promise
  )
  abstract fun verifyOTP(
    otpToken: String,
    deviceToken: String,
    deviceEncryptionKey: String,
    promise: Promise
  )
  abstract fun performLogout(
    provider: String,
    promise: Promise
  )

  abstract fun setDismissOnCallbackMap(readableMap: ReadableMap)
  abstract fun moveTaskToFront()
  abstract fun moveRnTaskToFront()
  abstract fun setTextConfigsMap(readableMap: ReadableMap)
  abstract fun setIconTextConfigsMap(readableMap: ReadableMap)
  abstract fun setTextConfigMap(readableMap: ReadableMap)
  abstract fun setImageMap(readableMap: ReadableMap)
  abstract fun setDateFormat(value: String)
  abstract fun setDebugging(value: Boolean)
  abstract fun setCustomUserAgent(value: String)
  abstract fun setErrorStringMap(readableMap: ReadableMap)
  override fun getConstants(): MutableMap<String, Any> {
    val constants: MutableMap<String, Any> = HashMap()
    constants["sdkVersion"] = WalletSdk.sdkVersion()
    constants["deviceId"] = WalletSdk.getDeviceId(context) ?: ""
    return constants
  }
}
