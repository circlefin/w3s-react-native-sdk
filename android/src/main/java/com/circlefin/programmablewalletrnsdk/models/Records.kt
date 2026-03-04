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
package com.circlefin.programmablewalletrnsdk.models

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/**
 * Record for settings management configuration
 */
class SettingsManagementRecord : Record {
    @Field
    val enableBiometricsPin: Boolean = false
}

/**
 * Record for wallet SDK configuration
 */
class ConfigurationRecord : Record {
    @Field
    val endpoint: String? = null

    @Field
    val appId: String? = null

    @Field
    val settingsManagement: SettingsManagementRecord? = null
}
