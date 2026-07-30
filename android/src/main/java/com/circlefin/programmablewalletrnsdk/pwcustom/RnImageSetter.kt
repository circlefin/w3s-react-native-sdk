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

import android.widget.ImageView
import circle.programmablewallet.sdk.presentation.IImageViewSetter
import com.bumptech.glide.Glide
import com.circlefin.programmablewalletrnsdk.TestHelper

class RnImageSetter(val value: String?) : IImageViewSetter {
  override fun apply(iv: ImageView?) {
    try {
      iv ?: return
      value ?: return
      val context = iv.context
      if (value.startsWith("http")) {
        Glide.with(context).load(value).centerCrop().into(iv)
        TestHelper.addTagForTest(iv, value)
      } else {
        val resourceId =
          context.resources.getIdentifier(value, "drawable", context.packageName)
        iv.setImageResource(resourceId)
        TestHelper.addTagForTest(iv, "$resourceId")
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }
}
