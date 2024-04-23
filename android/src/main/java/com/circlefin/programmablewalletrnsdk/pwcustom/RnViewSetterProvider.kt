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

import android.graphics.drawable.Drawable
import androidx.appcompat.widget.Toolbar
import circle.programmablewallet.sdk.presentation.IImageViewSetter
import circle.programmablewallet.sdk.presentation.IToolbarSetter
import circle.programmablewallet.sdk.presentation.Resource
import circle.programmablewallet.sdk.presentation.ViewSetterProvider
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import com.circlefin.programmablewalletrnsdk.TestHelper

object RnViewSetterProvider : ViewSetterProvider() {
  val map: MutableMap<String, String> = HashMap()
  fun setMap(map: Map<String, String>) {
    this.map.clear()
    this.map.putAll(map)
  }

  override fun getImageSetter(icon: Resource.Icon): IImageViewSetter {
    val key = String.format("%s", icon.name)
    val value = map[key]
    return RnImageSetter(value)
  }

  override fun getToolbarImageSetter(toolbarIcon: Resource.ToolbarIcon): IToolbarSetter {
    return object : IToolbarSetter {
      override fun apply(toolbar: Toolbar?) {
        try {
          if (toolbar == null) {
            return
          }
          val context = toolbar.context
          val key = String.format("%s", toolbarIcon.name)
          val value = map[key] ?: return
          if (value.startsWith("http")) {
            Glide.with(context).asDrawable().load(value)
              .into(object : CustomTarget<Drawable?>() {
                override fun onResourceReady(
                  resource: Drawable,
                  transition: Transition<in Drawable?>?
                ) {
                  toolbar.navigationIcon = resource
                }

                override fun onLoadCleared(placeholder: Drawable?) {}
              })
            TestHelper.addTagForTest(toolbar, value)
          } else {
            val resourceId =
              context.resources.getIdentifier(value, "drawable", context.packageName)
            toolbar.setNavigationIcon(resourceId)
            TestHelper.addTagForTest(toolbar, "$resourceId")
          }
        } catch (e: Exception) {
          e.printStackTrace()
        }
      }
    }
  }
}
