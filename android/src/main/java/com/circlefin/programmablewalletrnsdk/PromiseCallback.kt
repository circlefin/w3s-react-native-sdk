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
import circle.programmablewallet.sdk.api.ApiError
import circle.programmablewallet.sdk.api.Callback
import circle.programmablewallet.sdk.api.ExecuteWarning
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException

class PromiseCallback<R> internal constructor(
    private val promise: Promise?,
    private val module: ProgrammablewalletRnSdkModule
) : Callback<R> {

    private var result: R? = null

    override fun onError(error: Throwable): Boolean {
        Log.w(TAG, "onError: ", error)

        if (error is ApiError) {
            val isDismiss =
                java.lang.Boolean.TRUE == ProgrammablewalletRnSdkModule.dismissOnCallbackMap[error.code.value]

            if (isDismiss) {
                promise?.reject(CodedException(error.code.value.toString(), error.message, error))
            } else {
                val errorMap = RecordsHelper.convertApiErrorToMap(error)
                module.sendEvent(ProgrammablewalletRnSdkModule.EVENT_NAME_ON_ERROR, errorMap)
            }
            return !isDismiss
        } else {
            promise?.reject(CodedException(error))
        }
        return false
    }

    override fun onResult(result: R) {
        promise ?: return

        val resultMap = mutableMapOf<String, Any?>()
        resultMap["result"] = RecordsHelper.convertResultToMap(result)

        promise.resolve(resultMap)
    }

    override fun onWarning(warning: ExecuteWarning, result: R?): Boolean {
        val isDismiss =
            java.lang.Boolean.TRUE == ProgrammablewalletRnSdkModule.dismissOnCallbackMap[warning.warningType]

        val resultMap = mutableMapOf<String, Any?>()

        if (result == null) {
            resultMap["result"] = RecordsHelper.convertResultToMap(this.result)
        } else {
            this.result = result
            resultMap["result"] = RecordsHelper.convertResultToMap(result)
        }

        resultMap["warning"] = RecordsHelper.convertExecuteWarningToMap(warning)

        if (isDismiss) {
            promise?.resolve(resultMap)
        } else {
            module.sendEvent(ProgrammablewalletRnSdkModule.EVENT_NAME_ON_SUCCESS, resultMap)
        }

        return !isDismiss
    }

    companion object {
        private val TAG = PromiseCallback::class.java.simpleName
    }
}
