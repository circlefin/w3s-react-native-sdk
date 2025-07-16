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

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.text.TextUtils
import android.util.Log
import circle.programmablewallet.sdk.api.ApiError
import circle.programmablewallet.sdk.api.ExecuteWarning
import circle.programmablewallet.sdk.presentation.IconTextConfig
import circle.programmablewallet.sdk.presentation.Resource
import circle.programmablewallet.sdk.presentation.SecurityQuestion
import circle.programmablewallet.sdk.presentation.SettingsManagement
import circle.programmablewallet.sdk.presentation.TextConfig
import com.circlefin.programmablewalletrnsdk.annotation.ExcludeFromGeneratedCCReport
import com.circlefin.programmablewalletrnsdk.pwcustom.RnImageSetter
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import java.lang.reflect.Modifier

object BridgeHelper {
  private val TAG = BridgeHelper::class.java.simpleName
  val typefaceMap: MutableMap<String?, Typeface?> = HashMap()
  @ExcludeFromGeneratedCCReport
  var questionsForTest: Array<SecurityQuestion?>? = null
  @ExcludeFromGeneratedCCReport
  var dismissOnCallbackForTest: MutableMap<Int, Boolean>? = null

  @ExcludeFromGeneratedCCReport
  fun objectToMap(obj: ExecuteWarning?): WritableMap {
    val map = Arguments.createMap()
    obj ?: return map
    map.putString("warningString", obj.warningString)
    map.putString("warningType", obj.warningType.toString())
    return map
  }

  @ExcludeFromGeneratedCCReport
  fun objectToMap(obj: ApiError?): WritableMap {
    val map = Arguments.createMap()
    obj ?: return map
    map.putString("code", obj.code.value.toString())
    map.putString("message", obj.message)
    return map
  }

  @ExcludeFromGeneratedCCReport
  @JvmStatic
  fun objectToMap(obj: Any?): WritableMap {
    val map = Arguments.createMap()
    obj ?: return map
    for (field in obj.javaClass.fields) {
      try {
        val name = field.name
        val value = field[obj]
        if (Modifier.isStatic(field.modifiers)) { // skip static field
          continue
        }
        if (!Modifier.isPublic(field.modifiers)) { // skip non-public field
          continue
        }
        if (value == null) {
          map.putNull(name)
        } else if (value is Int) {
          map.putInt(name, value)
        } else if (value is Long) {
          map.putDouble(name, value.toDouble())
        } else if (value is Float) {
          map.putDouble(name, value.toDouble())
        } else if (value is Double) {
          map.putDouble(name, value)
        } else if (value is Boolean) {
          map.putBoolean(name, value)
        } else if (value is String) {
          map.putString(name, value)
        } else if (value.javaClass.isArray) {
          map.putArray(name, objectToArray(value))
        } else if (value.javaClass.isEnum) {
          map.putString(name, (value as Enum<*>).name)
        } else if (!value.javaClass.isPrimitive) {
          map.putMap(name, objectToMap(value))
        } else {
          throw UnsupportedOperationException("Not implemented: $value")
        }
      } catch (e: Exception) {
        Log.w(TAG, "Read field failed", e)
      }
    }
    return map
  }

  @ExcludeFromGeneratedCCReport
  private fun objectToArray(array: Any?): WritableArray {
    val arr = Arguments.createArray()
    array ?: return arr
    val n = java.lang.reflect.Array.getLength(array)
    for (i in 0 until n) {
      try {
        val elem = java.lang.reflect.Array.get(array, i)
        if (elem == null) {
          arr.pushNull()
        } else if (elem is Int) {
          arr.pushInt(elem)
        } else if (elem is Long) {
          arr.pushDouble(elem.toDouble())
        } else if (elem is Float) {
          arr.pushDouble(elem.toDouble())
        } else if (elem is Double) {
          arr.pushDouble(elem)
        } else if (elem is Boolean) {
          arr.pushBoolean(elem)
        } else if (elem is String) {
          arr.pushString(elem)
        } else if (elem.javaClass.isArray) {
          arr.pushArray(objectToArray(elem))
        } else if (!elem.javaClass.isPrimitive) {
          arr.pushMap(objectToMap(elem))
        } else {
          throw UnsupportedOperationException("Not implemented: $elem")
        }
      } catch (e: Exception) {
        Log.w(TAG, "Read element failed", e)
      }
    }
    return arr
  }

  fun getColor(colorStr: String?): Int {
    return try {
      if (TextUtils.isEmpty(colorStr)) {
        0
      } else Color.parseColor(colorStr)
    } catch (e: Exception) {
      e.printStackTrace()
      0
    }
  }

  // ReactFontManager.java
  private fun getTypeface(context: Context, fontFamilyName: String?): Typeface? {
    if (TextUtils.isEmpty(fontFamilyName)) {
      return null
    }
    if (typefaceMap[fontFamilyName] != null) {
      return typefaceMap[fontFamilyName]
    }
    val FILE_EXTENSIONS = arrayOf(".ttf", ".otf")
    val FONTS_ASSET_PATH = "fonts/"
    for (fileExtension in FILE_EXTENSIONS) {
      return try {
        val fileName = FONTS_ASSET_PATH +
          fontFamilyName +
          fileExtension
        val typeface = Typeface.createFromAsset(context.assets, fileName)
        typefaceMap[fontFamilyName] = typeface
        typeface
      } catch (e: Exception) {
        // If the typeface asset does not exist, try another extension.
        continue
      }
    }
    return null
  }

  private fun getColors(readableArray: ReadableArray?): IntArray? {
    if (readableArray == null || readableArray.size() == 0) {
      return null
    }
    val array = IntArray(readableArray.size())
    for (i in 0 until readableArray.size()) {
      array[i] = getColor(readableArray.getString(i))
    }
    return array
  }

  private fun getTextConfig(context: Context, rnMap: ReadableMap?): TextConfig? {
    rnMap ?: return null
    val textConfig = TextConfig(
      safeGetString(rnMap, "text"),
      getColors(safeGetArray(rnMap, "gradientColors")),
      getTypeface(context, safeGetString(rnMap, "font"))
    )
    textConfig.textColor = getColor(safeGetString(rnMap, "textColor"))
    return textConfig
  }

  private fun getIconTextConfig(context: Context, rnMap: ReadableMap?): IconTextConfig? {
    rnMap ?: return null
    val v = safeGetString(rnMap, "image")
    return IconTextConfig(RnImageSetter(v), getTextConfig(context, safeGetMap(rnMap, "textConfig")))
  }

  fun getSettingsManagement(rnMap: ReadableMap?): SettingsManagement? {
    rnMap ?: return null
    val settingsMap = safeGetMap(rnMap, "settingsManagement") ?: return null
    return SettingsManagement(safeGetBoolean(settingsMap, "enableBiometricsPin"))
  }

  private fun safeGetBoolean(map: ReadableMap, key: String): Boolean{
    if (map.hasKey(key)){
      return map.getBoolean(key)
    }
    return false
  }
  private fun safeGetString(map: ReadableMap, key: String): String?{
    if (map.hasKey(key)){
      return map.getString(key)
    }
    return null
  }
  private fun safeGetArray(map: ReadableMap, key: String): ReadableArray?{
    if (map.hasKey(key)){
      return map.getArray(key)
    }
    return null
  }
  private fun safeGetMap(map: ReadableMap, key: String): ReadableMap?{
    if (map.hasKey(key)){
      return map.getMap(key)
    }
    return null
  }

  private fun getTextConfigArray(context: Context, rnArray: ReadableArray?): Array<TextConfig?> {
    rnArray ?: return arrayOfNulls(0)
    val array = arrayOfNulls<TextConfig>(rnArray.size())
    for (i in 0 until rnArray.size()) {
      try {
        array[i] = getTextConfig(context, rnArray.getMap(i))
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
    return array
  }

  private fun getIconTextConfigArray(
    context: Context,
    rnArray: ReadableArray?
  ): Array<IconTextConfig?> {
    rnArray ?: return arrayOfNulls(0)
    val array = arrayOfNulls<IconTextConfig>(rnArray.size())
    for (i in 0 until rnArray.size()) {
      try {
        array[i] = getIconTextConfig(context, rnArray.getMap(i))
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
    return array
  }

  fun getTextConfigsMap(context: Context, rnMap: ReadableMap?): Map<String, Array<TextConfig?>> {
    val map: MutableMap<String, Array<TextConfig?>> = HashMap()
    rnMap ?: return map
    val itor = rnMap.keySetIterator()
    while (itor.hasNextKey()) {
      val key = itor.nextKey()
      try {
        map[key] = getTextConfigArray(context, rnMap.getArray(key))
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
    return map
  }

  fun getTextConfigMap(context: Context, rnMap: ReadableMap?): Map<String, TextConfig> {
    val map: MutableMap<String, TextConfig> = HashMap()
    rnMap ?: return map
    val itor = rnMap.keySetIterator()
    while (itor.hasNextKey()) {
      val key = itor.nextKey()
      try {
        getTextConfig(context, rnMap.getMap(key))?.let {
          map[key] = it
        }
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
    return map
  }

  fun getIconTextConfigsMap(
    context: Context,
    rnMap: ReadableMap?
  ): Map<Resource.IconTextsKey, Array<IconTextConfig?>> {
    val map: MutableMap<Resource.IconTextsKey, Array<IconTextConfig?>> =
      HashMap()
    rnMap ?: return map
    val itor = rnMap.keySetIterator()
    while (itor.hasNextKey()) {
      val key = itor.nextKey()
      try {
        val enumKey: Resource.IconTextsKey = Resource.IconTextsKey.valueOf(key)
        map[enumKey] = getIconTextConfigArray(context, rnMap.getArray(key))
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
    return map
  }

  fun getDismissOnCallbackMap(rnMap: ReadableMap?): Map<Int, Boolean> {
    val map: MutableMap<Int, Boolean> = HashMap()
    rnMap ?: return map
    val itor = rnMap.keySetIterator()
    while (itor.hasNextKey()) {
      val key = itor.nextKey()
      try {
        map[Integer.valueOf(key)] = rnMap.getBoolean(key)
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
    if (BuildConfig.DEBUG) {
      dismissOnCallbackForTest = map
    }
    return map
  }

  fun getErrorStringMap(rnMap: ReadableMap?): Map<Int, String> {
    val map: MutableMap<Int, String> = HashMap()
    rnMap ?: return map
    val itor = rnMap.keySetIterator()
    while (itor.hasNextKey()) {
      val key = itor.nextKey()
      try {
        rnMap.getString(key)?.let {
          map[Integer.valueOf(key)] = it
        }
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
    return map
  }

  fun reactNativeMapToStringMap(rnMap: ReadableMap?): Map<String, String> {
    val map: MutableMap<String, String> = HashMap()
    rnMap ?: return map
    val itor = rnMap.keySetIterator()
    while (itor.hasNextKey()) {
      val key = itor.nextKey()
      try {
        rnMap.getString(key)?.let {
          map[key] = it
        }
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
    return map
  }

  fun getSecurityQuestions(rnArray: ReadableArray?): Array<SecurityQuestion?> {
    rnArray ?: return arrayOfNulls(0)
    val array = arrayOfNulls<SecurityQuestion>(rnArray.size())
    for (i in 0 until rnArray.size()) {
      val readableMap = rnArray.getMap(i)
      if (readableMap != null) {
        val inputType = safeGetString(readableMap, "inputType")
        val title = safeGetString(readableMap, "title") ?: ""
        if (SecurityQuestion.InputType.datePicker.name != inputType) {
          array[i] = SecurityQuestion(title)
        } else {
          array[i] = SecurityQuestion(
            title,
            SecurityQuestion.InputType.datePicker
          )
        }
      }
    }
    if (BuildConfig.DEBUG) {
      questionsForTest = array
    }
    return array
  }

}
