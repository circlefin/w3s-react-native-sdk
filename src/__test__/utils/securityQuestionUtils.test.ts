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

import { toPlainSecurityQuestion, normalizeInputType, getStringFromUnknown } from '../../utils/securityQuestionUtils'
import { InputType } from '../../types'

describe('securityQuestionUtils', () => {
    describe('getStringFromUnknown', () => {
        it('handles null and undefined', () => {
            expect(getStringFromUnknown(null)).toBe('')
            expect(getStringFromUnknown(undefined)).toBe('')
        })

        it('handles objects with name property', () => {
            expect(getStringFromUnknown({ name: 'Test Object' })).toBe('Test Object')
        })

        it('uses toString for other values', () => {
            expect(getStringFromUnknown(123)).toBe('123')
            expect(getStringFromUnknown(true)).toBe('true')
        })
    })

    describe('normalizeInputType', () => {
        it('returns InputType directly if already correct', () => {
            expect(normalizeInputType(InputType.text)).toBe(InputType.text)
            expect(normalizeInputType(InputType.datePicker)).toBe(InputType.datePicker)
        })

        it('handles string inputs', () => {
            expect(normalizeInputType('text')).toBe(InputType.text)
            expect(normalizeInputType('date')).toBe(InputType.datePicker)
            expect(normalizeInputType('birthday')).toBe(InputType.datePicker)
        })

        it('handles numeric inputs', () => {
            expect(normalizeInputType(0)).toBe(InputType.text)
            expect(normalizeInputType(1)).toBe(InputType.datePicker)
        })

        it('handles null and undefined', () => {
            expect(normalizeInputType(null)).toBeUndefined()
            expect(normalizeInputType(undefined)).toBeUndefined()
        })

        it('defaults to text for unexpected values', () => {
            expect(normalizeInputType({})).toBe(InputType.text)
            expect(normalizeInputType([])).toBe(InputType.text)
            expect(normalizeInputType(2)).toBe(InputType.text) // not a valid enum value
        })
    })

    describe('toPlainSecurityQuestion', () => {
        it('handles array input format correctly', () => {
            // Test tuple format [title, inputType]
            const result1 = toPlainSecurityQuestion(['What is your pet name?', InputType.text])
            expect(result1.title).toBe('What is your pet name?')
            expect(result1.inputType).toBe(InputType.text)

            const result2 = toPlainSecurityQuestion(['When is your birthday?', InputType.datePicker])
            expect(result2.title).toBe('When is your birthday?')
            expect(result2.inputType).toBe(InputType.datePicker)

            // Test string input type
            const result3 = toPlainSecurityQuestion(['Birth date?', 'date'])
            expect(result3.title).toBe('Birth date?')
            expect(result3.inputType).toBe(InputType.datePicker)

            // Test numeric input type
            const result4 = toPlainSecurityQuestion(['Question?', 1])
            expect(result4.title).toBe('Question?')
            expect(result4.inputType).toBe(InputType.datePicker)
        })

        it('handles object input format correctly', () => {
            // Standard object format
            const result1 = toPlainSecurityQuestion({ title: 'What is your pet name?', inputType: InputType.text })
            expect(result1.title).toBe('What is your pet name?')
            expect(result1.inputType).toBe(InputType.text)

            // Capitalized property names
            const result2 = toPlainSecurityQuestion({ Title: 'Question with capital T', InputType: InputType.datePicker })
            expect(result2.title).toBe('Question with capital T')
            expect(result2.inputType).toBe(InputType.datePicker)

            // String input type
            const result3 = toPlainSecurityQuestion({ title: 'Birth date?', inputType: 'date' })
            expect(result3.title).toBe('Birth date?')
            expect(result3.inputType).toBe(InputType.datePicker)

            // Using getter methods
            const objWithGetters = {
                getTitle: () => 'Title from getter',
                getInputType: () => InputType.datePicker
            }
            const result4 = toPlainSecurityQuestion(objWithGetters)
            expect(result4.title).toBe('Title from getter')
            expect(result4.inputType).toBe(InputType.datePicker)
        })

        it('handles string and primitive input correctly', () => {
            // Direct string
            const result1 = toPlainSecurityQuestion('Simple question string')
            expect(result1.title).toBe('Simple question string')
            expect(result1.inputType).toBe(InputType.text) // Default is text

            // Number
            const result2 = toPlainSecurityQuestion(123)
            expect(result2.title).toBe('123')
            expect(result2.inputType).toBe(InputType.text)

            // Boolean
            const result3 = toPlainSecurityQuestion(true)
            expect(result3.title).toBe('true')
            expect(result3.inputType).toBe(InputType.text)
        })

        it('handles empty or falsy input correctly', () => {
            // Empty array
            const result1 = toPlainSecurityQuestion([])
            expect(result1.title).toBe('')
            expect(result1.inputType).toBe(InputType.text)

            // Empty object
            const result2 = toPlainSecurityQuestion({})
            expect(result2.title).toBe('')
            expect(result2.inputType).toBe(InputType.text)

            // null
            const result3 = toPlainSecurityQuestion(null)
            expect(result3.title).toBe('')
            expect(result3.inputType).toBe(InputType.text)

            // undefined
            const result4 = toPlainSecurityQuestion(undefined)
            expect(result4.title).toBe('')
            expect(result4.inputType).toBe(InputType.text)
        })
    })
})
