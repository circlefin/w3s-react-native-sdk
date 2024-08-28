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

import android.util.Log
import circle.programmablewallet.sdk.api.ApiError
import circle.programmablewallet.sdk.api.Callback
import circle.programmablewallet.sdk.api.Callback2
import circle.programmablewallet.sdk.api.ExecuteWarning
import com.circlefin.programmablewalletrnsdk.BridgeHelper.objectToMap
import com.circlefin.programmablewalletrnsdk.annotation.ExcludeFromGeneratedCCReport
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class PromiseCallback2<R> internal constructor(
  private val promise: Promise?,
  private val context: ReactApplicationContext
) : Callback2<R> {

  @ExcludeFromGeneratedCCReport
  override fun onError(error: Throwable): Boolean {
    Log.w(TAG, "onError: ", error)
    if (error is ApiError) {
      val isDismiss = java.lang.Boolean.TRUE == ProgrammablewalletRnSdkModule.dismissOnCallbackMap[error.code.value]
      if (isDismiss) {
        promise?.reject(error.code.value.toString(), error.message, error)
      } else {
        val map = objectToMap(error)
        context.getJSModule(
          DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
        )
          .emit(ProgrammablewalletRnSdkModule.EVENT_NAME_ON_ERROR, map)
      }
      return !isDismiss
    } else {
      promise?.reject(RuntimeException(error.message))
    }
    return false
  }

  @ExcludeFromGeneratedCCReport
  override fun onResult(result: R) {
    promise ?: return
    promise.resolve(objectToMap(result))
  }

  companion object {
    private val TAG = PromiseCallback2::class.java.simpleName
  }
}
