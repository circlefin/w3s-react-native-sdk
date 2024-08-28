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
package com.circlefin.programmablewalletrnsdk.pwcustom

import circle.programmablewallet.sdk.api.ApiError
import circle.programmablewallet.sdk.presentation.IconTextConfig
import circle.programmablewallet.sdk.presentation.LayoutProvider
import circle.programmablewallet.sdk.presentation.Resource
import circle.programmablewallet.sdk.presentation.TextConfig
import com.circlefin.programmablewalletrnsdk.annotation.ExcludeFromGeneratedCCReport
import java.util.Locale

object RnLayoutProvider : LayoutProvider() {
  val textConfigsMap: MutableMap<String, Array<TextConfig?>> = HashMap()
  val textConfigMap: MutableMap<String, TextConfig> = HashMap()
  val iconTextsMap: MutableMap<Resource.IconTextsKey, Array<IconTextConfig?>> = HashMap()
  val errorStringMap: MutableMap<Int, String> = HashMap()
  @ExcludeFromGeneratedCCReport
  var _dateFormat: String? = null
  @ExcludeFromGeneratedCCReport
  var _debugging = true
  fun setTextConfigsMap(textConfigsMap: Map<String, Array<TextConfig?>>) {
    this.textConfigsMap.clear()
    this.textConfigsMap.putAll(textConfigsMap)
  }

  fun setErrorStringMap(errorStringMap: Map<Int, String>) {
    this.errorStringMap.clear()
    this.errorStringMap.putAll(errorStringMap)
  }

  fun setTextConfigMap(textConfigMap: Map<String, TextConfig>) {
    this.textConfigMap.clear()
    this.textConfigMap.putAll(textConfigMap)
  }

  fun setIconTextConfigsMap(textConfigsMap: Map<Resource.IconTextsKey, Array<IconTextConfig?>>) {
    iconTextsMap.clear()
    iconTextsMap.putAll(textConfigsMap)
  }

  fun setDateFormat(format: String?) {
    format?.let {
      _dateFormat = it.uppercase(Locale.getDefault())
    }
  }

  fun setDebugging(debugging: Boolean) {
    this._debugging = debugging
  }

  override fun getTextConfig(key: String): TextConfig? {
    return textConfigMap[key] ?: return super.getTextConfig(key)
  }

  override fun getIconTextConfigs(key: Resource.IconTextsKey): Array<IconTextConfig?>? {
    return iconTextsMap[key]
      ?: return super.getIconTextConfigs(key)
  }

  override fun getTextConfigs(key: Resource.TextsKey): Array<TextConfig?>? {
    return textConfigsMap[key.name] ?: return super.getTextConfigs(key)
  }

  override fun getErrorString(code: ApiError.ErrorCode): String? {
    return errorStringMap[code.value] ?: super.getErrorString(code)
  }

  override fun getDateFormat(): String? {
    return if (_dateFormat == null) {
      super.getDateFormat()
    } else _dateFormat
  }

  override fun isDebugging(): Boolean {
    return _debugging
  }
}
