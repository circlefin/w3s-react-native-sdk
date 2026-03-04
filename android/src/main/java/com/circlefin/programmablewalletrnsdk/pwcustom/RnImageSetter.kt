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
package com.circlefin.programmablewalletrnsdk.pwcustom

import android.util.Log
import android.widget.ImageView
import circle.programmablewallet.sdk.presentation.IImageViewSetter
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy

class RnImageSetter(val value: String?) : IImageViewSetter {
    override fun apply(iv: ImageView?) {
        try {
            iv ?: return
            value ?: return
            val context = iv.context

            if (value.startsWith("http")) {
                try {
                    Glide.with(context)
                        .load(value)
                        .diskCacheStrategy(DiskCacheStrategy.ALL)
                        .into(iv)
                } catch (glideException: Exception) {
                    Log.e("RnImageSetter", "Glide failed to load: $value", glideException)
                }
                TestHelper.addTagForTest(iv, value)
            } else {
                val resourceId = context.resources.getIdentifier(value, "drawable", context.packageName)
                if (resourceId != 0) {
                    iv.setImageResource(resourceId)
                    TestHelper.addTagForTest(iv, "$resourceId")
                } else {
                    Log.w("RnImageSetter", "Local resource not found: $value")
                }
            }
        } catch (e: Exception) {
            Log.e("RnImageSetter", "Exception in apply()", e)
            e.printStackTrace()
        }
    }
}

object TestHelper {
    @JvmStatic
    fun addTagForTest(view: ImageView, tag: String) {
        view.tag = tag
    }
}
