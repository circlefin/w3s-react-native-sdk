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

import { SecurityQuestion, InputType } from '../types'

/**
 * Extract string representation from unknown value
 * @param value - Value to convert to string
 * @returns String representation
 */
export function getStringFromUnknown(value: unknown): string {
    if (value === null || value === undefined) return ''

    if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>
        if ('name' in obj && typeof obj.name === 'string') {
            return obj.name
        }
    }
    return typeof value?.toString === 'function' ? value.toString() : ''
}

/**
 * Normalize various input types to InputType enum values
 * @param v - Input value to normalize
 * @returns Normalized InputType or undefined
 */
export function normalizeInputType(v: unknown): InputType | undefined {
    if (v == null) return undefined

    if (v === InputType.text || v === InputType.datePicker) {
        return v
    }

    if (typeof v === 'string') {
        const s = v.toLowerCase()
        if (s.includes('date') || s.includes('birth')) return InputType.datePicker
        if (s !== 'text' && s !== '') {
            console.warn(`[WalletSdk] Unexpected inputType string: "${v}", using default "text"`)
        }
        return InputType.text
    }

    if (typeof v === 'number') {
        if (v === 1) return InputType.datePicker
        if (v !== 0) {
            console.warn(`[WalletSdk] Unexpected inputType number: ${v}, using default "text"`)
        }
        return InputType.text
    }

    const hint = getStringFromUnknown(v).toLowerCase()
    if (hint.includes('date')) return InputType.datePicker

    if (v !== null && v !== undefined) {
        console.warn(`[WalletSdk] Unexpected inputType: ${typeof v}, using default "text"`)
    }

    return InputType.text
}

/**
 * Convert security question input to standardized SecurityQuestion object
 * 
 * Supports three input formats:
 * 1. Tuple [title, inputType]
 * 2. Object {title, inputType}
 * 3. String or other primitive
 * 
 * @param q - Security question input (any type)
 * @returns Standardized SecurityQuestion instance
 */
export function toPlainSecurityQuestion(q: unknown): SecurityQuestion {
    const securityQuestion = new SecurityQuestion('', InputType.text)

    if (Array.isArray(q)) {
        // Handle array/tuple format: [title, inputType]
        const [title, it] = q
        securityQuestion.title = String(title || '')
        securityQuestion.inputType = normalizeInputType(it) ?? InputType.text
    }
    else if (q && typeof q === 'object') {
        // Handle object/class instances
        const o = q as Record<string, unknown>
        securityQuestion.title = String(
            o.title ||
            o.Title ||
            (typeof o.getTitle === 'function' ? o.getTitle() : undefined) ||
            '',
        )

        const inputTypeRaw =
            o.inputType ||
            o.InputType ||
            (typeof o.getInputType === 'function' ? o.getInputType() : undefined)

        securityQuestion.inputType = normalizeInputType(inputTypeRaw) ?? InputType.text
    }
    else {
        // Handle string or other primitive
        securityQuestion.title = String(q || '')
        securityQuestion.inputType = InputType.text
    }

    return securityQuestion
}
