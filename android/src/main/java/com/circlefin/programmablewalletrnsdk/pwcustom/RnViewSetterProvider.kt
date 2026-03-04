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

import android.content.Context
import android.util.Log
import circle.programmablewallet.sdk.presentation.IImageViewSetter
import circle.programmablewallet.sdk.presentation.IToolbarSetter
import circle.programmablewallet.sdk.presentation.LocalToolbarImageSetter
import circle.programmablewallet.sdk.presentation.RemoteToolbarImageSetter
import circle.programmablewallet.sdk.presentation.Resource
import circle.programmablewallet.sdk.presentation.ViewSetterProvider

/**
 * Custom ViewSetterProvider for React Native SDK image customization.
 * This is the correct way to implement image customization in Circle SDK.
 *
 * Handles both regular icons and toolbar icons (back, close buttons).
 */
object RnViewSetterProvider : ViewSetterProvider() {

    // Store image mappings for different icons
    private val imageMap: MutableMap<String, String> = HashMap()
    // Store context for resource lookups
    private var context: Context? = null

    /**
     * Set custom image mappings.
     * @param map Map of icon names to image URLs/paths
     * @param context Android context for resource lookups
     */
    fun setImageMap(map: Map<String, String>, context: Context? = null) {
        imageMap.clear()
        imageMap.putAll(map)
        if (context != null) {
            this.context = context
        }
    }

    /**
     * Return custom IImageViewSetter for the given icon type.
     * This is called by the SDK when it needs to set an image.
     */
    override fun getImageSetter(type: Resource.Icon): IImageViewSetter? {
        val imageUrl = imageMap[type.name]
        return if (imageUrl != null) {
            // Use our custom RnImageSetter for both remote and local images
            RnImageSetter(imageUrl)
        } else {
            // Fallback to default behavior
            super.getImageSetter(type)
        }
    }

    /**
     * Return custom IToolbarSetter for toolbar icons (back, close).
     * This handles navigation buttons in the toolbar.
     */
    override fun getToolbarImageSetter(type: Resource.ToolbarIcon): IToolbarSetter? {
        val imageUrl = imageMap[type.name]
        return if (imageUrl != null) {
            if (imageUrl.startsWith("http") || imageUrl.startsWith("data:")) {
                // Remote image or data URI - use RemoteToolbarImageSetter
                RemoteToolbarImageSetter(0, imageUrl)
            } else {
                // Local drawable resource name - use LocalToolbarImageSetter
                val ctx = context
                if (ctx != null) {
                    try {
                        val resourceId = ctx.resources.getIdentifier(imageUrl, "drawable", ctx.packageName)
                        if (resourceId != 0) {
                            LocalToolbarImageSetter(resourceId)
                        } else {
                            Log.w("RnViewSetterProvider", "Could not find drawable resource: $imageUrl, falling back to RemoteToolbarImageSetter")
                            RemoteToolbarImageSetter(0, imageUrl)
                        }
                    } catch (e: Exception) {
                        Log.e("RnViewSetterProvider", "Failed to create LocalToolbarImageSetter for: $imageUrl", e)
                        RemoteToolbarImageSetter(0, imageUrl)
                    }
                } else {
                    Log.w("RnViewSetterProvider", "No context available for local resource: $imageUrl, using RemoteToolbarImageSetter")
                    RemoteToolbarImageSetter(0, imageUrl)
                }
            }
        } else {
            // Fallback to default behavior
            super.getToolbarImageSetter(type)
        }
    }
}
