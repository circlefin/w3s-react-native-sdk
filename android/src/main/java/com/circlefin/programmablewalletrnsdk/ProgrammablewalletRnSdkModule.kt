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

package com.circlefin.programmablewalletrnsdk

import android.util.Log
import circle.programmablewallet.sdk.WalletSdk
import circle.programmablewallet.sdk.WalletSdk.init
import circle.programmablewallet.sdk.api.ExecuteEvent
import circle.programmablewallet.sdk.api.SocialProvider
import circle.programmablewallet.sdk.api.SocialCallback
import circle.programmablewallet.sdk.api.LogoutCallback
import circle.programmablewallet.sdk.presentation.EventListener
import circle.programmablewallet.sdk.result.ExecuteResult
import circle.programmablewallet.sdk.result.LoginResult
import com.circlefin.programmablewalletrnsdk.models.ConfigurationRecord
import com.circlefin.programmablewalletrnsdk.pwcustom.RnLayoutProvider
import com.circlefin.programmablewalletrnsdk.pwcustom.RnViewSetterProvider
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ProgrammablewalletRnSdkModule : Module(), EventListener {
    private var layoutProvider: RnLayoutProvider = RnLayoutProvider
    private var viewSetterProvider: RnViewSetterProvider = RnViewSetterProvider

    init {
        setLayoutProvider(layoutProvider)
        setViewSetterProvider(viewSetterProvider)
    }

    private fun setLayoutProvider(provider: RnLayoutProvider) {
        WalletSdk.setLayoutProvider(provider)
    }

    private fun setViewSetterProvider(provider: RnViewSetterProvider) {
        WalletSdk.setViewSetterProvider(provider)
    }

    override fun definition() = ModuleDefinition {
        Name("ProgrammablewalletRnSdk")

        Constants(
            "sdkVersion" to WalletSdk.sdkVersion(),
        )

        Events(
            "CirclePwOnEvent",
            "CirclePwOnSuccess",
            "CirclePwOnError"
        )

        Function("getDeviceId") {
            val context = appContext.reactContext ?: return@Function ""
            WalletSdk.getDeviceId(context) ?: ""
        }

        AsyncFunction("initSdk") { configuration: ConfigurationRecord, promise: Promise ->
            try {
                val context = appContext.reactContext
                if (context == null) {
                    promise.reject(Exceptions.ReactContextLost())
                    return@AsyncFunction
                }
                val (endpoint, appId, settings) = RecordsHelper.prepareConfigurationData(
                    configuration
                )
                WalletSdk.addEventListener(this@ProgrammablewalletRnSdkModule)
                init(
                    context,
                    WalletSdk.Configuration(endpoint, appId, settings)
                )
                promise.resolve(emptyMap<String, Any>())
            } catch (e: Throwable) {
                promise.reject(CodedException(e))
            }
        }

        Function("setSecurityQuestions") { securityQuestions: Array<Any> ->
            val nativeSecurityQuestions =
                RecordsHelper.convertJsSecurityQuestionsToNative(securityQuestions)
            WalletSdk.setSecurityQuestions(nativeSecurityQuestions)
        }

        AsyncFunction("execute") { userToken: String?, encryptionKey: String?, challengeIds: Array<String>, promise: Promise ->
            try {
                val activity = appContext.currentActivity
                if (activity == null) {
                    promise.reject(Exceptions.AppContextLost())
                    return@AsyncFunction
                }
                val challengeIdArray = challengeIds.map { it as String? }.toTypedArray()
                val callback =
                    PromiseCallback<ExecuteResult>(promise, this@ProgrammablewalletRnSdkModule)
                WalletSdk.execute(
                    activity,
                    userToken,
                    encryptionKey,
                    challengeIdArray,
                    callback
                )
            } catch (e: Throwable) {
                promise.reject(CodedException(e))
            }
        }

        AsyncFunction("verifyOTP") { otpToken: String?, deviceToken: String?, deviceEncryptionKey: String?, promise: Promise ->
            try {
                val activity = appContext.currentActivity
                if (activity == null) {
                    promise.reject(Exceptions.AppContextLost())
                    return@AsyncFunction
                }

                // Create callback for LoginResult with correct Callback2 interface
                val callback = object : circle.programmablewallet.sdk.api.Callback2<circle.programmablewallet.sdk.result.LoginResult> {
                    override fun onResult(result: circle.programmablewallet.sdk.result.LoginResult) {
                        try {
                            val resultMap = RecordsHelper.convertResultToMap(result)
                            promise.resolve(resultMap)
                        } catch (e: Exception) {
                            promise.reject(CodedException(e))
                        }
                    }

                    override fun onError(error: Throwable): Boolean {
                        promise.reject(CodedException(error))
                        return false // Let SDK finish the Activity
                    }
                }

                // Use the correct verifyOTP method from Circle SDK
                WalletSdk.verifyOTP(
                    activity,
                    otpToken ?: "",
                    deviceToken ?: "",
                    deviceEncryptionKey ?: "",
                    callback
                )
            } catch (e: Throwable) {
                promise.reject(CodedException(e))
            }
        }

        AsyncFunction("performLogin") { provider: String, deviceToken: String, deviceEncryptionKey: String, promise: Promise ->
            try {
                val activity = appContext.currentActivity
                if (activity == null) {
                    promise.reject(Exceptions.AppContextLost())
                    return@AsyncFunction
                }

                // Convert string to SocialProvider enum
                val socialProvider = when (provider) {
                    "Google" -> SocialProvider.Google
                    "Facebook" -> SocialProvider.Facebook
                    "Apple" -> SocialProvider.Apple
                    else -> throw IllegalArgumentException("Unsupported social provider: $provider")
                }

                // Create social callback that wraps promise
                val socialCallback = object : SocialCallback<LoginResult> {
                    override fun onError(error: Throwable) {
                        promise.reject(CodedException(error))
                    }

                    override fun onResult(result: LoginResult) {
                        // Direct conversion without wrapping in "result" field
                        val resultMap = RecordsHelper.convertResultToMap(result)
                        promise.resolve(resultMap)
                    }
                }

                WalletSdk.performLogin(
                    activity,
                    socialProvider,
                    deviceToken,
                    deviceEncryptionKey,
                    socialCallback
                )
            } catch (e: Throwable) {
                promise.reject(CodedException(e))
            }
        }

        AsyncFunction("performLogout") { provider: String, promise: Promise ->
            try {
                val activity = appContext.currentActivity
                if (activity == null) {
                    promise.reject(Exceptions.AppContextLost())
                    return@AsyncFunction
                }

                // Convert string to SocialProvider enum
                val socialProvider = when (provider) {
                    "Google" -> SocialProvider.Google
                    "Facebook" -> SocialProvider.Facebook
                    "Apple" -> SocialProvider.Apple
                    else -> throw IllegalArgumentException("Unsupported social provider: $provider")
                }

                // Create logout callback that wraps promise
                val logoutCallback = object : LogoutCallback {
                    override fun onError(error: Throwable) {
                        promise.reject(CodedException(error))
                    }

                    override fun onComplete() {
                        promise.resolve(null)
                    }
                }

                WalletSdk.performLogout(
                    activity,
                    socialProvider,
                    logoutCallback
                )
            } catch (e: Throwable) {
                promise.reject(CodedException(e))
            }
        }

        AsyncFunction("setBiometricsPin") { userToken: String?, encryptionKey: String?, promise: Promise ->
            try {
                val activity = appContext.currentActivity
                if (activity == null) {
                    promise.reject(Exceptions.AppContextLost())
                    return@AsyncFunction
                }
                val callback = PromiseCallback<ExecuteResult>(promise, this@ProgrammablewalletRnSdkModule)
                WalletSdk.setBiometricsPin(
                    activity,
                    userToken,
                    encryptionKey,
                    callback
                )
            } catch (e: Throwable) {
                promise.reject(CodedException(e))
            }
        }

        Function("setDismissOnCallbackMap") { mapData: Map<String, Any> ->
            val dismissMap = RecordsHelper.convertToDismissOnCallbackMap(mapData)
            setDismissOnCallbackMap(dismissMap)
        }

        Function("moveTaskToFront") {
            try {
                val activity = appContext.currentActivity
                if (activity != null) {
                    Companion.moveTaskToFront(activity)
                }
            } catch (e: Throwable) {
                Log.e("ProgrammableWallet", "moveTaskToFront failed", e)
                throw CodedException(e)
            }
        }

        Function("moveRnTaskToFront") {
            try {
                val activity = appContext.currentActivity
                if (activity != null) {
                    Companion.moveRnTaskToFront(activity)
                }
            } catch (e: Throwable) {
                Log.e("ProgrammableWallet", "moveRnTaskToFront failed", e)
                throw CodedException(e)
            }
        }

        Function("setTextConfigsMap") { mapData: Map<String, Any> ->
            val context = appContext.reactContext
            if (context != null) {
                val textConfigsMap = RecordsHelper.convertToTextConfigsMap(context, mapData)
                setTextConfigsMap(textConfigsMap)
                layoutProvider.setTextConfigsMap(textConfigsMap)
            }
        }

        Function("setIconTextConfigsMap") { mapData: Map<String, Any> ->
            try {
                val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
                val iconTextConfigsMap = RecordsHelper.convertToIconTextConfigsMap(context, mapData)
                layoutProvider.setIconTextConfigsMap(iconTextConfigsMap)
            } catch (e: Throwable) {
                throw CodedException(e)
            }
        }

        Function("setTextConfigMap") { mapData: Map<String, Any> ->
            try {
                val context = appContext.reactContext
                if (context == null) {
                    throw Exceptions.ReactContextLost()
                }
                val textConfigMap = RecordsHelper.convertToTextConfigMap(context, mapData)
                layoutProvider.setTextConfigMap(textConfigMap)
            } catch (e: Throwable) {
                throw CodedException(e)
            }
        }

        Function("setImageMap") { mapData: Map<String, Any> ->
            try {
                val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
                val imageMap = RecordsHelper.convertToImageMap(context, mapData)
                setImageMap(imageMap)
                viewSetterProvider.setImageMap(imageMap, context)
            } catch (e: Throwable) {
                Log.e("ProgrammableWallet", "setImageMap failed", e)
                throw CodedException(e)
            }
        }

        Function("setDateFormat") { format: String ->
            try {
                layoutProvider.setDateFormat(format)
            } catch (e: Throwable) {
              throw CodedException(e)
            }
        }

        Function("setDebugging") { isDebugging: Boolean ->
            try {
                Companion.debugging = isDebugging
                layoutProvider.setDebugging(isDebugging)
            } catch (e: Throwable) {
                Log.e("ProgrammableWallet", "setDebugging failed", e)
                throw CodedException(e)
            }
        }

        Function("setCustomUserAgent") { userAgent: String ->
            try {
                WalletSdk.setCustomUserAgent(userAgent)
            } catch (e: Throwable) {
                Log.e("ProgrammableWallet", "setCustomUserAgent failed", e)
                throw CodedException(e)
            }
        }

        Function("setErrorStringMap") { mapData: Map<String, Any> ->
            try {
                val validatedMapData = RecordsHelper.filterValidErrorCodeKeys(mapData)
                val errorStringMap = RecordsHelper.convertToErrorStringMap(validatedMapData)
                layoutProvider.setErrorStringMap(errorStringMap)
                } catch (e: Throwable) {
              throw CodedException(e)
            }
        }

        AsyncFunction("setValueAsync") { value: String ->
            // Send an event to JavaScript.
            sendEvent(
                "onChange", mapOf(
                    "value" to value
                )
            )
        }
    }

    override fun onEvent(event: ExecuteEvent) {
        sendEvent(
            "CirclePwOnEvent", mapOf(
                "name" to event.name
            )
        )
    }

    companion object {
        const val EVENT_NAME_ON_ERROR = "CirclePwOnError"
        const val EVENT_NAME_ON_SUCCESS = "CirclePwOnSuccess"

        val dismissOnCallbackMap: MutableMap<Int, Boolean> = HashMap()
        val textConfigsMap: MutableMap<String, Array<circle.programmablewallet.sdk.presentation.TextConfig?>> = HashMap()
        var debugging: Boolean = false
        val imageMap: MutableMap<String, String> = HashMap()

        fun setDismissOnCallbackMap(map: Map<Int, Boolean>) {
            dismissOnCallbackMap.clear()
            dismissOnCallbackMap.putAll(map)
        }

        fun setTextConfigsMap(map: Map<String, Array<circle.programmablewallet.sdk.presentation.TextConfig?>>) {
            textConfigsMap.clear()
            textConfigsMap.putAll(map)
        }

        fun setImageMap(map: Map<String, String>) {
            imageMap.clear()
            imageMap.putAll(map)
        }

        fun moveTaskToFront(activity: android.app.Activity) {
            // Call the original WalletSdk.moveTaskToFront method
            try {
                circle.programmablewallet.sdk.WalletSdk.moveTaskToFront(activity)
            } catch (e: Throwable) {
                Log.e("ProgrammableWallet", "WalletSdk.moveTaskToFront failed", e)
            }
        }

        fun moveRnTaskToFront(activity: android.app.Activity) {
            // Use React Native Activity's taskId to bring it to front
            try {
                val am = activity.getSystemService(android.content.Context.ACTIVITY_SERVICE) as android.app.ActivityManager
                am.moveTaskToFront(activity.taskId, android.app.ActivityManager.MOVE_TASK_NO_USER_ACTION)
            } catch (e: Throwable) {
                Log.e("ProgrammableWallet", "moveRnTaskToFront failed", e)
            }
        }
    }
}
