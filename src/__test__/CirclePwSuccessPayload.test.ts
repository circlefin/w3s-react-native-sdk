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

import {
  ExecuteResultStatus,
  ExecuteResultType,
  type CirclePwSuccessPayload,
  type ProgrammablewalletRnSdkModuleEvents,
  type SuccessResult,
} from '../types'

const successResult: SuccessResult = {
  result: {
    resultType: ExecuteResultType.SET_BIOMETRICS_PIN,
    status: ExecuteResultStatus.COMPLETE,
  },
}

const payload: CirclePwSuccessPayload = successResult

const handleCirclePwOnSuccess: ProgrammablewalletRnSdkModuleEvents['CirclePwOnSuccess'] =
  event => {
    const typedSuccessResult: SuccessResult = event

    expect(typedSuccessResult.result).toEqual(successResult.result)
  }

describe('CirclePwSuccessPayload', () => {
  it('matches the SuccessResult runtime shape', () => {
    expect(payload).toEqual(successResult)

    handleCirclePwOnSuccess(payload)
  })
})
