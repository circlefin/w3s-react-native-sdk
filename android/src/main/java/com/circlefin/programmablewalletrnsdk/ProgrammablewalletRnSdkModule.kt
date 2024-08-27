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

import android.app.ActivityManager
import android.content.Context
import circle.programmablewallet.sdk.WalletSdk
import circle.programmablewallet.sdk.WalletSdk.execute
import circle.programmablewallet.sdk.WalletSdk.init
import circle.programmablewallet.sdk.WalletSdk.setLayoutProvider
import circle.programmablewallet.sdk.WalletSdk.setSecurityQuestions
import circle.programmablewallet.sdk.WalletSdk.setViewSetterProvider
import circle.programmablewallet.sdk.api.ExecuteEvent
import circle.programmablewallet.sdk.api.SocialProvider
import circle.programmablewallet.sdk.presentation.EventListener
import com.circlefin.programmablewalletrnsdk.annotation.ExcludeFromGeneratedCCReport
import com.circlefin.programmablewalletrnsdk.pwcustom.RnLayoutProvider
import com.circlefin.programmablewalletrnsdk.pwcustom.RnViewSetterProvider
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule


class ProgrammablewalletRnSdkModule internal constructor(context: ReactApplicationContext) :
  ProgrammablewalletRnSdkSpec(context), EventListener {
  private var layoutProvider: RnLayoutProvider =
    RnLayoutProvider
  private var viewSetterProvider: RnViewSetterProvider =
    RnViewSetterProvider
  private var reactContext: ReactApplicationContext

  init {
    reactContext = context
    setLayoutProvider(layoutProvider)
    setViewSetterProvider(viewSetterProvider)
  }

  @ExcludeFromGeneratedCCReport
  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  override fun setIconTextConfigsMap(readableMap: ReadableMap) {
    val map = BridgeHelper.getIconTextConfigsMap(reactContext, readableMap)
    layoutProvider.setIconTextConfigsMap(map)
  }

  @ReactMethod
  override fun setTextConfigMap(readableMap: ReadableMap) {
    val map = BridgeHelper.getTextConfigMap(reactContext, readableMap)
    layoutProvider.setTextConfigMap(map)
  }

  @ReactMethod
  override fun setImageMap(readableMap: ReadableMap) {
    val map = BridgeHelper.reactNativeMapToStringMap(readableMap)
    viewSetterProvider.setMap(map)
  }

  @ReactMethod
  override fun setDateFormat(value: String) {
    layoutProvider.setDateFormat(value)
  }

  @ReactMethod
  override fun setDebugging(value: Boolean) {
    layoutProvider.setDebugging(value)
  }

  @ReactMethod
  override fun setCustomUserAgent(value: String) {
    WalletSdk.setCustomUserAgent(value)
  }

  @ReactMethod
  override fun setErrorStringMap(readableMap: ReadableMap) {
    val map = BridgeHelper.getErrorStringMap(readableMap)
    layoutProvider.setErrorStringMap(map)
  }

  @ReactMethod
  override fun setTextConfigsMap(readableMap: ReadableMap) {
    val map = BridgeHelper.getTextConfigsMap(reactContext, readableMap)
    layoutProvider.setTextConfigsMap(map)
  }

  @ReactMethod
  override fun setDismissOnCallbackMap(readableMap: ReadableMap) {
    val map = BridgeHelper.getDismissOnCallbackMap(readableMap)
    setDismissOnCallbackMap(map)
  }

  @ExcludeFromGeneratedCCReport
  @ReactMethod
  override fun moveRnTaskToFront() {
    currentActivity?.let {
      try {
        val activityManager = reactContext
          .getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        activityManager.moveTaskToFront(it.taskId, 0)
      } catch (e: Throwable) {
        e.printStackTrace()
      }
    }
  }

  @ExcludeFromGeneratedCCReport
  @ReactMethod
  override fun moveTaskToFront() {
    WalletSdk.moveTaskToFront(reactContext)
  }

  @ReactMethod
  override fun setSecurityQuestions(questionArr: ReadableArray) {
    try {
      val questions = BridgeHelper.getSecurityQuestions(questionArr)
      setSecurityQuestions(questions)
    } catch (e: Throwable) {
      e.printStackTrace()
    }
  }

  @ReactMethod
  override fun initSdk(configuration: ReadableMap, promise: Promise) {
    try {
      // Append ending slash if needed
      val endpoint = configuration.getString("endpoint")?.run {
        if (this.endsWith("/")) this else "$this/"
      }
      val appId = configuration.getString("appId")
      val settings = BridgeHelper.getSettingsManagement(configuration)
      WalletSdk.addEventListener(this)
      init(
        reactContext,
        WalletSdk.Configuration(endpoint, appId, settings)
      )
      promise.resolve(Arguments.createMap())
    } catch (e: Throwable) {
      promise.reject(RuntimeException(e.message))
    }
  }

  @ReactMethod
  override fun getDeviceId(): String {
    return WalletSdk.getDeviceId(reactContext) ?: ""
  }
  @ReactMethod
  override fun execute(
    userToken: String?,
    secretKey: String?,
    challengeIdArr: ReadableArray,
    promise: Promise?
  ) {
    val challengeIds = arrayOfNulls<String>(challengeIdArr.size())
    for (i in challengeIds.indices) {
      challengeIds[i] = challengeIdArr.getString(i)
    }
    execute(
      currentActivity,
      userToken,
      secretKey,
      challengeIds,
      PromiseCallback(promise, reactContext)
    )
  }
  @ExcludeFromGeneratedCCReport
  @ReactMethod
  override fun setBiometricsPin(
    userToken: String?,
    secretKey: String?,
    promise: Promise?
  ) {
    WalletSdk.setBiometricsPin(
      currentActivity,
      userToken,
      secretKey,
      PromiseCallback(promise, reactContext)
    )
  }

  @ReactMethod
  override fun performLogin(
    provider: String,
    deviceToken: String,
    deviceEncryptionKey: String,
    promise: Promise
  ) {
    WalletSdk.performLogin(
      currentActivity,
      SocialProvider.valueOf(provider),
      deviceToken,
      deviceEncryptionKey,
      PromiseSocialCallback(promise)
    )
  }

  @ReactMethod
  override fun verifyOTP(
    otpToken: String,
    deviceToken: String,
    deviceEncryptionKey: String,
    promise: Promise
  ) {
    WalletSdk.verifyOTP(
      currentActivity,
      otpToken,
      deviceToken,
      deviceEncryptionKey,
      PromiseCallback2(promise, reactContext)
    )
  }

  @ReactMethod
  override fun performLogout(
    provider: String,
    promise: Promise
  ) {

    WalletSdk.performLogout(
      currentActivity,
      SocialProvider.valueOf(provider),
      PromiseLogoutCallback(promise)
    )
  }
  companion object {
    const val NAME = "ProgrammablewalletRnSdk"
    const val EVENT_NAME_ON_EVENT = "CirclePwOnEvent"
    const val EVENT_NAME_ON_SUCCESS = "CirclePwOnSuccess"
    const val EVENT_NAME_ON_ERROR = "CirclePwOnError"
    val dismissOnCallbackMap: MutableMap<Int, Boolean> = HashMap()
    fun setDismissOnCallbackMap(map: Map<Int, Boolean>) {
      dismissOnCallbackMap.clear()
      dismissOnCallbackMap.putAll(map)
    }
  }

  @ExcludeFromGeneratedCCReport
  override fun onEvent(event: ExecuteEvent) {
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(EVENT_NAME_ON_EVENT, event.name)
  }
}
