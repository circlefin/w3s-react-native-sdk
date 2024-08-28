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
import circle.programmablewallet.sdk.api.ExecuteWarning
import circle.programmablewallet.sdk.api.SocialCallback
import com.circlefin.programmablewalletrnsdk.BridgeHelper.objectToMap
import com.circlefin.programmablewalletrnsdk.annotation.ExcludeFromGeneratedCCReport
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class PromiseSocialCallback<R> internal constructor(
  private val promise: Promise?,
) : SocialCallback<R> {

  @ExcludeFromGeneratedCCReport
  override fun onError(error: Throwable) {
    Log.w(TAG, "onError: ", error)
    if (error is ApiError) {
      promise?.reject(error.code.value.toString(), error.message, error)
    } else {
      promise?.reject(RuntimeException(error.message))
    }
  }

  override fun onResult(result: R) {
    promise ?: return
    promise.resolve(objectToMap(result))
  }


  companion object {
    private val TAG = PromiseSocialCallback::class.java.simpleName
  }
}
