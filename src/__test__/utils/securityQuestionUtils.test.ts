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
  getStringFromUnknown,
  normalizeInputType,
  toPlainSecurityQuestion,
} from '../../utils/securityQuestionUtils'
import { InputType } from '../../types'

describe('securityQuestionUtils', () => {
  describe('getStringFromUnknown', () => {
    it('returns an empty string for nullish values', () => {
      expect(getStringFromUnknown(null)).toBe('')
      expect(getStringFromUnknown(undefined)).toBe('')
    })

    it('returns the name property for objects with a string name', () => {
      expect(getStringFromUnknown({ name: 'date' })).toBe('date')
    })

    it('falls back to toString for values without a string name', () => {
      expect(getStringFromUnknown(42)).toBe('42')
      expect(
        getStringFromUnknown({
          toString: () => 'custom date value',
        }),
      ).toBe('custom date value')
    })
  })

  describe('normalizeInputType', () => {
    let warnSpy: jest.SpyInstance

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      warnSpy.mockRestore()
    })

    it('returns undefined for nullish values', () => {
      expect(normalizeInputType(null)).toBeUndefined()
      expect(normalizeInputType(undefined)).toBeUndefined()
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('returns enum input types unchanged', () => {
      expect(normalizeInputType(InputType.text)).toBe(InputType.text)
      expect(normalizeInputType(InputType.datePicker)).toBe(
        InputType.datePicker,
      )
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('maps date-like strings to datePicker', () => {
      expect(normalizeInputType('birthday')).toBe(InputType.datePicker)
      expect(normalizeInputType('dateOfBirth')).toBe(InputType.datePicker)
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('maps text strings to text without warning', () => {
      expect(normalizeInputType('text')).toBe(InputType.text)
      expect(normalizeInputType('')).toBe(InputType.text)
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('warns once and defaults unexpected strings to text', () => {
      expect(normalizeInputType('other')).toBe(InputType.text)

      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected inputType string: "other"'),
      )
    })

    it('maps numeric input types without warning', () => {
      expect(normalizeInputType(0)).toBe(InputType.text)
      expect(normalizeInputType(1)).toBe(InputType.datePicker)
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('warns once and defaults unexpected numbers to text', () => {
      expect(normalizeInputType(2)).toBe(InputType.text)

      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected inputType number: 2'),
      )
    })

    it('maps objects with date hints to datePicker', () => {
      expect(
        normalizeInputType({
          toString: () => 'datePicker',
        }),
      ).toBe(InputType.datePicker)
      expect(normalizeInputType({ name: 'dateOfBirth' })).toBe(
        InputType.datePicker,
      )
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('defaults named objects without a date hint to text', () => {
      expect(normalizeInputType({ name: 'city' })).toBe(InputType.text)

      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected inputType: object'),
      )
    })

    it('warns once and defaults arbitrary objects to text', () => {
      expect(normalizeInputType({})).toBe(InputType.text)

      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected inputType: object'),
      )
    })
  })

  describe('toPlainSecurityQuestion', () => {
    it('handles array input format correctly', () => {
      const textQuestion = toPlainSecurityQuestion([
        'What is your pet name?',
        InputType.text,
      ])
      expect(textQuestion.title).toBe('What is your pet name?')
      expect(textQuestion.inputType).toBe(InputType.text)

      const dateQuestion = toPlainSecurityQuestion([
        'When is your birthday?',
        InputType.datePicker,
      ])
      expect(dateQuestion.title).toBe('When is your birthday?')
      expect(dateQuestion.inputType).toBe(InputType.datePicker)

      const stringInputTypeQuestion = toPlainSecurityQuestion([
        'Birth date?',
        'date',
      ])
      expect(stringInputTypeQuestion.title).toBe('Birth date?')
      expect(stringInputTypeQuestion.inputType).toBe(InputType.datePicker)

      const numericInputTypeQuestion = toPlainSecurityQuestion(['Question?', 1])
      expect(numericInputTypeQuestion.title).toBe('Question?')
      expect(numericInputTypeQuestion.inputType).toBe(InputType.datePicker)
    })

    it('handles object input format correctly', () => {
      const textQuestion = toPlainSecurityQuestion({
        title: 'What is your pet name?',
        inputType: InputType.text,
      })
      expect(textQuestion.title).toBe('What is your pet name?')
      expect(textQuestion.inputType).toBe(InputType.text)

      const capitalizedQuestion = toPlainSecurityQuestion({
        Title: 'Question with capital T',
        InputType: InputType.datePicker,
      })
      expect(capitalizedQuestion.title).toBe('Question with capital T')
      expect(capitalizedQuestion.inputType).toBe(InputType.datePicker)

      const stringInputTypeQuestion = toPlainSecurityQuestion({
        title: 'Birth date?',
        inputType: 'date',
      })
      expect(stringInputTypeQuestion.title).toBe('Birth date?')
      expect(stringInputTypeQuestion.inputType).toBe(InputType.datePicker)

      const getterQuestion = toPlainSecurityQuestion({
        getTitle: () => 'Title from getter',
        getInputType: () => InputType.datePicker,
      })
      expect(getterQuestion.title).toBe('Title from getter')
      expect(getterQuestion.inputType).toBe(InputType.datePicker)
    })

    it('handles string and primitive input correctly', () => {
      const stringQuestion = toPlainSecurityQuestion('Simple question string')
      expect(stringQuestion.title).toBe('Simple question string')
      expect(stringQuestion.inputType).toBe(InputType.text)

      const numberQuestion = toPlainSecurityQuestion(123)
      expect(numberQuestion.title).toBe('123')
      expect(numberQuestion.inputType).toBe(InputType.text)

      const booleanQuestion = toPlainSecurityQuestion(true)
      expect(booleanQuestion.title).toBe('true')
      expect(booleanQuestion.inputType).toBe(InputType.text)
    })

    it('handles empty or falsy input correctly', () => {
      const emptyArrayQuestion = toPlainSecurityQuestion([])
      expect(emptyArrayQuestion.title).toBe('')
      expect(emptyArrayQuestion.inputType).toBe(InputType.text)

      const emptyObjectQuestion = toPlainSecurityQuestion({})
      expect(emptyObjectQuestion.title).toBe('')
      expect(emptyObjectQuestion.inputType).toBe(InputType.text)

      const nullQuestion = toPlainSecurityQuestion(null)
      expect(nullQuestion.title).toBe('')
      expect(nullQuestion.inputType).toBe(InputType.text)

      const undefinedQuestion = toPlainSecurityQuestion(undefined)
      expect(undefinedQuestion.title).toBe('')
      expect(undefinedQuestion.inputType).toBe(InputType.text)
    })
  })
})
