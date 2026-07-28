/*
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

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Unit tests for [RecordsHelper.resolveInitErrorMessage], the pure fallback
 * used by initSdk's ApiError catch to build the JS-facing error message.
 */
class RecordsHelperTest {

    @Test
    fun usesConvertedMessageWhenNonBlank() {
        assertEquals(
            "Invalid appId: bad",
            RecordsHelper.resolveInitErrorMessage("Invalid appId: bad", "raw sdk message"),
        )
    }

    @Test
    fun fallsBackToRawMessageWhenConvertedIsBlankOverride() {
        // A blank setErrorStringMap override is returned as-is by
        // convertApiErrorToMap (customMessage ?: error.message, no blank check),
        // so the raw error.message fallback must recover the useful message.
        assertEquals(
            "raw sdk message",
            RecordsHelper.resolveInitErrorMessage("   ", "raw sdk message"),
        )
    }

    @Test
    fun fallsBackToRawMessageWhenConvertedIsAbsent() {
        assertEquals(
            "raw sdk message",
            RecordsHelper.resolveInitErrorMessage(null, "raw sdk message"),
        )
    }

    @Test
    fun fallsBackToGenericDefaultWhenBothBlankOrNull() {
        assertEquals(
            "SDK initialization failed",
            RecordsHelper.resolveInitErrorMessage("", "  "),
        )
        assertEquals(
            "SDK initialization failed",
            RecordsHelper.resolveInitErrorMessage(null, null),
        )
    }
}
