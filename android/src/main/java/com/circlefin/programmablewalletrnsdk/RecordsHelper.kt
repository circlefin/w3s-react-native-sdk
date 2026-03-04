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

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.text.TextUtils
import android.util.Log
import circle.programmablewallet.sdk.api.ApiError
import circle.programmablewallet.sdk.api.ExecuteWarning
import circle.programmablewallet.sdk.presentation.SecurityQuestion
import circle.programmablewallet.sdk.presentation.SettingsManagement
import circle.programmablewallet.sdk.presentation.TextConfig
import circle.programmablewallet.sdk.presentation.IconTextConfig
import com.circlefin.programmablewalletrnsdk.pwcustom.RnLayoutProvider
import circle.programmablewallet.sdk.presentation.Resource
import com.circlefin.programmablewalletrnsdk.pwcustom.RnImageSetter
import circle.programmablewallet.sdk.result.ExecuteResult
import circle.programmablewallet.sdk.result.LoginResult
import com.circlefin.programmablewalletrnsdk.models.ConfigurationRecord
import com.circlefin.programmablewalletrnsdk.models.SettingsManagementRecord

object RecordsHelper {

    private const val INPUT_TYPE_TEXT = "text"
    private const val INPUT_TYPE_DATE_PICKER = "datePicker"

    private val typefaceMap = mutableMapOf<String, Typeface>()
    fun convertJsSecurityQuestionsToNative(jsSecurityQuestions: Array<Any>): Array<SecurityQuestion?> {
        return jsSecurityQuestions.mapIndexed { _, jsQuestion ->
            try {
                val (title, inputTypeValue) = extractSecurityQuestionData(jsQuestion)

                val inputType = when (inputTypeValue) {
                    INPUT_TYPE_TEXT -> SecurityQuestion.InputType.text
                    INPUT_TYPE_DATE_PICKER -> SecurityQuestion.InputType.datePicker
                    else -> {
                        SecurityQuestion.InputType.text
                    }
                }

                val securityQuestion = SecurityQuestion(title, inputType)
                securityQuestion
            } catch (e: Exception) {
                SecurityQuestion("", SecurityQuestion.InputType.text)
            }
        }.toTypedArray()
    }

    private fun extractSecurityQuestionData(jsQuestion: Any): Pair<String, String?> {
        return when (jsQuestion) {
            is Map<*, *> -> {
                val title = (jsQuestion["title"] as? String) ?: ""
                val inputType = jsQuestion["inputType"] as? String
                Pair(title, inputType)
            }

            is Array<*> -> {
                if (jsQuestion.size >= 2) {
                    val title = (jsQuestion[0] as? String) ?: ""
                    val inputType = jsQuestion[1] as? String
                    Pair(title, inputType)
                } else {
                    Pair("", null)
                }
            }

            else -> {
                val title = tryExtractField(jsQuestion, "title") ?: ""
                val inputType = tryExtractField(jsQuestion, "inputType")
                Pair(title, inputType)
            }
        }
    }

    private fun tryExtractField(obj: Any, fieldName: String): String? {
        return try {
            /** Try direct field access */
            val field = obj.javaClass.getDeclaredField(fieldName)
            field.isAccessible = true
            field.get(obj) as? String
        } catch (e: Exception) {
            try {
                /** Try getter method */
                val capitalizedName = fieldName.first().uppercaseChar() + fieldName.substring(1)
                val getter = obj.javaClass.getMethod("get$capitalizedName")
                getter.invoke(obj) as? String
            } catch (e2: Exception) {
                try {
                    /** Try public field */
                    val field = obj.javaClass.getField(fieldName)
                    field.get(obj) as? String
                } catch (e3: Exception) {
                    null
                }
            }
        }
    }

    private fun toNativeSettingsManagement(record: SettingsManagementRecord): SettingsManagement {
        return SettingsManagement(record.enableBiometricsPin)
    }

    fun prepareConfigurationData(record: ConfigurationRecord): Triple<String?, String?, SettingsManagement?> {
        val endpoint = record.endpoint?.run {
            if (this.endsWith("/")) this else "$this/"
        }
        val appId = record.appId
        val settings = record.settingsManagement?.let { settingsRecord ->
            toNativeSettingsManagement(settingsRecord)
        }

        return Triple(endpoint, appId, settings)
    }

    fun convertToDismissOnCallbackMap(mapData: Map<String, Any>): Map<Int, Boolean> {
        val result = mapData.mapNotNull { (key, value) ->
            try {
                val intKey = key.toInt()
                val boolValue = when (value) {
                    is Boolean -> value
                    is String -> value.toBoolean()
                    is Number -> value.toInt() != 0
                    else -> false
                }
                intKey to boolValue
            } catch (e: NumberFormatException) {
                null
            }
        }.toMap()
        return result
    }

    fun filterValidErrorCodeKeys(mapData: Map<String, Any>): Map<String, Any> {
        return mapData.filter { (key, _) ->
            // Check if key is a valid integer string or ErrorCode name
            try {
                key.toInt()
                true
            } catch (e: NumberFormatException) {
                errorCodeStringToIntMap.containsKey(key)
            }
        }
    }

    fun convertToErrorStringMap(mapData: Map<String, Any>): Map<Int, String> {
        val result = mapData.map { (key, value) ->
            // Convert key to Int (keys are pre-validated by filterValidErrorCodeKeys)
            val intKey: Int = try {
                key.toInt()
            } catch (e: NumberFormatException) {
                // If not an integer string, map from error code string
                errorCodeStringToIntMap[key] ?: throw IllegalArgumentException("Invalid ErrorCode key: $key")
            }

            val stringValue = when (value) {
                is String -> value
                else -> value.toString()
            }
            intKey to stringValue
        }.toMap()
        return result
    }

    private val errorCodeStringToIntMap = mapOf(
        "unknown" to -1,
        "success" to 0,
        "apiParameterMissing" to 1,
        "apiParameterInvalid" to 2,
        "forbidden" to 3,
        "unauthorized" to 4,
        "retry" to 9,
        "customerSuspended" to 10,
        "pending" to 11,
        "invalidSession" to 12,
        "invalidPartnerId" to 13,
        "invalidMessage" to 14,
        "invalidPhone" to 15,
        "walletIdNotFound" to 156001,
        "tokenIdNotFound" to 156002,
        "transactionIdNotFound" to 156003,
        "walletSetIdNotFound" to 156004,
        "notEnoughFounds" to 155201,
        "notEnoughBalance" to 155202,
        "exceedWithdrawLimit" to 155203,
        "minimumFundsRequired" to 155204,
        "invalidTransactionFee" to 155205,
        "rejectedOnAmlScreening" to 155206,
        "tagRequired" to 155207,
        "gasLimitTooLow" to 155208,
        "transactionDataNotEncodedProperly" to 155209,
        "fullNodeReturnedError" to 155210,
        "walletSetupRequired" to 155211,
        "lowerThenMinimumAccountBalance" to 155212,
        "rejectedByBlockchain" to 155213,
        "droppedAsPartOfReorg" to 155214,
        "operationNotSupport" to 155215,
        "amountBelowMinimum" to 155216,
        "wrongNftTokenIdNumber" to 155217,
        "invalidDestinationAddress" to 155218,
        "tokenWalletChainMismatch" to 155219,
        "wrongAmountsNumber" to 155220,
        "userAlreadyExisted" to 155101,
        "userNotFound" to 155102,
        "userTokenNotFound" to 155103,
        "userTokenExpired" to 155104,
        "invalidUserToken" to 155105,
        "userWasInitialized" to 155106,
        "userHasSetPin" to 155107,
        "userHasSetSecurityQuestion" to 155108,
        "userWasDisabled" to 155109,
        "userDoesNotSetPinYet" to 155110,
        "userDoesNotSetSecurityQuestionYet" to 155111,
        "incorrectUserPin" to 155112,
        "incorrectDeviceId" to 155113,
        "incorrectAppId" to 155114,
        "incorrectSecurityAnswers" to 155115,
        "invalidChallengeId" to 155116,
        "invalidApproveContent" to 155117,
        "invalidEncryptionKey" to 155118,
        "userPinLocked" to 155119,
        "securityAnswersLocked" to 155120,
        "walletIsFrozen" to 155501,
        "maxWalletLimitReached" to 155502,
        "walletSetIdMutuallyExclusive" to 155503,
        "metadataUnmatched" to 155504,
        "userCanceled" to 155701,
        "launchUiFailed" to 155702,
        "pinCodeNotMatched" to 155703,
        "insecurePinCode" to 155704,
        "hintsMatchAnswers" to 155705,
        "networkError" to 155706,
        "biometricsSettingNotEnabled" to 155708,
        "deviceNotSupportBiometrics" to 155709,
        "biometricsKeyPermanentlyInvalidated" to 155710,
        "biometricsUserSkip" to 155711,
        "biometricsUserDisableForPin" to 155712,
        "biometricsUserLockout" to 155713,
        "biometricsUserLockoutPermanent" to 155714,
        "biometricsUserNotAllowPermission" to 155715,
        "biometricsInternalError" to 155716,
        "userSecretMissing" to 155717,
        "invalidUserTokenFormat" to 155718,
        "userTokenMismatch" to 155719,
        "socialLoginFailed" to 155720,
        "loginInfoMissing" to 155721
    )

    fun convertToImageMap(context: Context, mapData: Map<String, Any>): Map<String, String> {
        val result = mapData.mapNotNull { (key, value) ->
            try {
                val imageUrl = when (value) {
                    is String -> value
                    else -> value.toString()
                }

                // Map TypeScript ImageKey enum values to their actual enum names
                // Some ImageKey values use different names than expected
                val mappedKey = when (key) {
                    "back" -> "back"  // This maps to ToolbarIcon.back
                    "close" -> "close"  // This maps to ToolbarIcon.close
                    else -> key  // Most keys should match Resource.Icon enum names directly
                }

                mappedKey to imageUrl
            } catch (e: Exception) {
                Log.e("RecordsHelper", "Failed to process image map entry for key: '$key', value: '$value'", e)
                null
            }
        }.toMap()
        return result
    }

    private fun convertExecuteResultToMap(result: ExecuteResult): Map<String, Any?> {
        return mapOf(
            "resultType" to result.resultType?.name,
            "status" to result.status?.name,
            "data" to result.data?.let { data ->
                mapOf(
                    "signature" to data.signature,
                    "signedTransaction" to data.signedTransaction,
                    "txHash" to data.txHash
                )
            }
        )
    }

    fun convertApiErrorToMap(error: ApiError): Map<String, Any?> {
        // Check if there's a custom error message set via setErrorStringMap
        val customMessage = RnLayoutProvider.getErrorString(error.code)
        val messageToUse = customMessage ?: error.message

        return mapOf(
            "code" to error.code.value,
            "message" to messageToUse
        )
    }

    fun convertExecuteWarningToMap(warning: ExecuteWarning): Map<String, Any?> {
        return mapOf(
            "warningType" to warning.warningType,
            "warningString" to warning.warningString
        )
    }

    fun convertResultToMap(result: Any?): Map<String, Any?> {
        return when (result) {
            null -> emptyMap()
            is ExecuteResult -> convertExecuteResultToMap(result)
            is LoginResult -> convertLoginResultToMap(result)
            is Map<*, *> -> {
                @Suppress("UNCHECKED_CAST")
                result as Map<String, Any?>
            }

            else -> {
                try {
                    mapOf("data" to result.toString())
                } catch (e: Exception) {
                    mapOf("data" to result.toString())
                }
            }
        }
    }

    private fun convertLoginResultToMap(loginResult: LoginResult): Map<String, Any?> {
        val resultMap = mutableMapOf<String, Any?>()

        loginResult.userToken?.let { resultMap["userToken"] = it }
        loginResult.encryptionKey?.let { resultMap["encryptionKey"] = it }
        loginResult.refreshToken?.let { resultMap["refreshToken"] = it }

        loginResult.oauthInfo?.let { oauthInfo ->
            val oauthMap = mutableMapOf<String, Any?>()
            oauthInfo.provider?.let { oauthMap["provider"] = it }
            oauthInfo.scope?.let { oauthMap["scope"] = it }
            oauthInfo.socialUserUUID?.let { oauthMap["socialUserUUID"] = it }

            oauthInfo.socialUserInfo?.let { userInfo ->
                val userInfoMap = mutableMapOf<String, Any?>()
                userInfo.name?.let { userInfoMap["name"] = it }
                userInfo.email?.let { userInfoMap["email"] = it }
                userInfo.phone?.let { userInfoMap["phone"] = it }
                if (userInfoMap.isNotEmpty()) {
                    oauthMap["socialUserInfo"] = userInfoMap
                }
            }

            if (oauthMap.isNotEmpty()) {
                resultMap["oauthInfo"] = oauthMap
            }
        }

        return resultMap
    }

    fun convertToTextConfigsMap(context: Context, mapData: Map<String, Any>): Map<String, Array<TextConfig?>> {
        val resultMap = mutableMapOf<String, Array<TextConfig?>>()

        for ((key, value) in mapData) {
            when (value) {
                is List<*> -> {
                    val textConfigs = mutableListOf<TextConfig?>()
                    for (item in value) {
                        val textConfig = convertToTextConfig(context, item)
                        textConfigs.add(textConfig)
                    }
                    resultMap[key] = textConfigs.toTypedArray()
                }
                is Array<*> -> {
                    val textConfigs = mutableListOf<TextConfig?>()
                    for (item in value) {
                        val textConfig = convertToTextConfig(context, item)
                        textConfigs.add(textConfig)
                    }
                    resultMap[key] = textConfigs.toTypedArray()
                }
                else -> {
                    // If it's not a collection, treat it as a single TextConfig
                    val textConfig = convertToTextConfig(context, value)
                    resultMap[key] = arrayOf(textConfig)
                }
            }
        }

        return resultMap
    }

    fun convertToTextConfigMap(context: Context, mapData: Map<String, Any>): Map<String, TextConfig> {
        val resultMap = mutableMapOf<String, TextConfig>()

        for ((key, value) in mapData) {
            val textConfig = convertToTextConfig(context, value)
            textConfig?.let {
                resultMap[key] = it
            }
        }

        return resultMap
    }

    fun convertToIconTextConfigsMap(context: Context, mapData: Map<String, Any>): Map<Resource.IconTextsKey, Array<IconTextConfig?>> {
        val resultMap = mutableMapOf<Resource.IconTextsKey, Array<IconTextConfig?>>()

        for ((key, value) in mapData) {
            try {
                val enumKey = Resource.IconTextsKey.valueOf(key)

                when (value) {
                    is List<*> -> {
                        val iconTextConfigs = mutableListOf<IconTextConfig?>()
                        for (item in value) {
                            val iconTextConfig = createIconTextConfig(context, item)
                            iconTextConfigs.add(iconTextConfig)
                        }
                        resultMap[enumKey] = iconTextConfigs.toTypedArray()
                    }
                    is Array<*> -> {
                        val iconTextConfigs = mutableListOf<IconTextConfig?>()
                        for (item in value) {
                            val iconTextConfig = createIconTextConfig(context, item)
                            iconTextConfigs.add(iconTextConfig)
                        }
                        resultMap[enumKey] = iconTextConfigs.toTypedArray()
                    }
                    else -> {
                        val iconTextConfig = createIconTextConfig(context, value)
                        resultMap[enumKey] = arrayOf(iconTextConfig)
                    }
                }
            } catch (e: Exception) {
                continue
            }
        }

        return resultMap
    }

    /**
     * Creates an IconTextConfig using the map data.
     *
     * @param context The Android context.
     * @param data The input data, expected to be a map with the following structure:
     * - "image": A string representing the image URL (optional).
     * - "textConfig": An object that can be converted to a TextConfig instance (optional).
     * If the input is not a map or does not contain these keys, the function will attempt
     * to create a TextConfig from the data directly.
     * @return An IconTextConfig instance if the input data is valid, or null otherwise.
     */
     private fun createIconTextConfig(context: Context, data: Any?): IconTextConfig? {
         if (data == null) return null

         return when (data) {
             is Map<*, *> -> {
                 @Suppress("UNCHECKED_CAST")
                 val dataMap = data as Map<String, Any?>

                 val imageUrl = dataMap["image"] as? String

                 val textConfigData = dataMap["textConfig"]
                 val textConfig = if (textConfigData != null) {
                     convertToTextConfig(context, textConfigData)
                 } else {
                     null
                 }

                 try {
                     val setter = if (imageUrl != null) {
                         RnImageSetter(imageUrl)
                     } else {
                         null
                     }

                     IconTextConfig(setter, textConfig)
                 } catch (e: Exception) {
                     null
                 }
             }
             else -> {
                 try {
                     val textConfig = convertToTextConfig(context, data)
                     IconTextConfig(null, textConfig)
                 } catch (e: Exception) {
                     null
                 }
             }
         }
     }

    private fun convertToTextConfig(context: Context, data: Any?): TextConfig? {
        if (data == null) return null

        return when (data) {
            is Map<*, *> -> {
                @Suppress("UNCHECKED_CAST")
                val dataMap = data as Map<String, Any?>

                val text = dataMap["text"] as? String
                val gradientColors = convertToGradientColors(dataMap["gradientColors"])
                val font = dataMap["font"] as? String
                val textColor = dataMap["textColor"] as? String

                val textConfig = TextConfig(text, gradientColors, getTypeface(context, font))
                textConfig.textColor = getColor(textColor)
                textConfig
            }
            is String -> {
                TextConfig(data, null, null)
            }
            else -> {
                try {
                    val stringValue = data.toString()
                    if (stringValue.isNotEmpty() && stringValue != "null") {
                        TextConfig(stringValue, null, null)
                    } else {
                        null
                    }
                } catch (e: Exception) {
                    null
                }
            }
        }
    }

    private fun convertToGradientColors(colorsData: Any?): IntArray? {
        if (colorsData == null) return null

        return when (colorsData) {
            is List<*> -> {
                colorsData.mapNotNull { colorStr ->
                    try {
                        getColor(colorStr as? String)
                    } catch (e: Exception) {
                        null
                    }
                }.toIntArray()
            }
            is Array<*> -> {
                colorsData.mapNotNull { colorStr ->
                    try {
                        getColor(colorStr as? String)
                    } catch (e: Exception) {
                        null
                    }
                }.toIntArray()
            }
            else -> null
        }
    }

    private fun getColor(colorStr: String?): Int {
        return try {
            if (TextUtils.isEmpty(colorStr)) {
                0
            } else Color.parseColor(colorStr)
        } catch (e: Exception) {
            0
        }
    }

    private fun getTypeface(context: Context, fontFamilyName: String?): Typeface? {
        if (TextUtils.isEmpty(fontFamilyName)) {
            return null
        }

        if (typefaceMap[fontFamilyName] != null) {
            return typefaceMap[fontFamilyName]
        }

        val fileExtensions = arrayOf(".ttf", ".otf")
        val fontsAssetPath = "fonts/"

        for (fileExtension in fileExtensions) {
            try {
                val fileName = fontsAssetPath + fontFamilyName!! + fileExtension
                val typeface = Typeface.createFromAsset(context.assets, fileName)
                typefaceMap[fontFamilyName] = typeface
                return typeface
            } catch (e: Exception) {
                // If the typeface asset does not exist, try another extension.
                continue
            }
        }
        return null
    }
}
