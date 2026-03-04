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

/**
 * Bridge-safe utilities for React Native/Expo
 * - bridgeSafe: Converts values to JSON-safe format
 * - bridgeDiff: Detects data loss or unexpected transformations
 */

export type BridgePrimitive = string | number | boolean | null;
export type BridgeValue = BridgePrimitive | { [k: string]: BridgeValue } | BridgeValue[];

type TypeName =
    | 'null' | 'boolean' | 'number' | 'string'
    | 'array' | 'object'
    | 'date' | 'bigint' | 'map' | 'set'
    | 'function' | 'symbol' | 'undefined'
    | 'nan' | 'infinity';

function typeOf(x: unknown): TypeName {
    if (x === null) return 'null'
    const t = typeof x
    if (t === 'number') {
        if (Number.isNaN(x as number)) return 'nan'
        if (!Number.isFinite(x as number)) return 'infinity'
        return 'number'
    }
    if (t === 'bigint') return 'bigint'
    if (t === 'function') return 'function'
    if (t === 'symbol') return 'symbol'
    if (t === 'undefined') return 'undefined'
    if (t === 'string' || t === 'boolean') return t
    // Check complex types
    if (x instanceof Date) return 'date'
    if (Array.isArray(x)) return 'array'
    if (x instanceof Map) return 'map'
    if (x instanceof Set) return 'set'
    return 'object'
}

export function bridgeSafe<T = unknown>(input: T): BridgeValue {
    const seen = new WeakSet<object>()
    const replacer = (_k: string, v: unknown) => {
        const ty = typeOf(v)
        if (ty === 'undefined' || ty === 'function' || ty === 'symbol') return undefined
        if (ty === 'nan' || ty === 'infinity') return String(v)
        if (ty === 'bigint') return String(v)
        if (ty === 'date') return (v as Date).toISOString()
        if (ty === 'map') {
            return Object.fromEntries(Array.from((v as Map<unknown, unknown>).entries(), ([k, val]) => [String(k), val]))
        }
        if (ty === 'set') {
            return Array.from((v as Set<unknown>).values())
        }
        if (v && typeof v === 'object') {
            if (seen.has(v)) return '[Circular]'
            seen.add(v)
        }
        return v
    }
    return JSON.parse(JSON.stringify(input, replacer)) as BridgeValue
}

export interface BridgeDiff {
    lostPaths: string[];               // paths that disappeared after serialization
    transformed: Array<{ path: string; from: TypeName; to: TypeName; note?: string }>;
}

export interface DiffPolicy {
    /** allow typical transforms without flagging */
    allow?: Partial<Record<`${TypeName}->${TypeName}`, boolean>>;
    /** treat dropping undefined/function/symbol as allowed (default true) */
    allowDropSpecial?: boolean;
}

/**
 * Compare original and bridged values to identify transformations and data loss
 * @note This is a best-effort detector that cannot guarantee perfect bijection
 */
export function bridgeDiff(original: unknown, bridged: BridgeValue, policy?: DiffPolicy): BridgeDiff {
    const allow = new Set<string>(Object.entries({
        'date->string': true,
        'bigint->string': true,
        'map->object': true,
        'set->array': true,
        'nan->string': true,
        'infinity->string': true,
        ...(policy?.allow ?? {}),
    }).filter(([, v]) => v).map(([k]) => k))

    const allowDropSpecial = policy?.allowDropSpecial ?? true

    const lostPaths: string[] = []
    const transformed: Array<{ path: string; from: TypeName; to: TypeName; note?: string }> = []

    function walk(o: unknown, b: unknown, path: string) {
        const to = typeOf(b)
        const fo = typeOf(o)

        // record transform
        if (!(fo === to || allow.has(`${fo}->${to}`))) {
            // exclude expected object/array shape diffs handled below
            if (!(fo === 'object' && to === 'object') && !(fo === 'array' && to === 'array')) {
                transformed.push({ path, from: fo, to })
            }
        }

        // if bridged is undefined, nothing to recurse
        if (b === undefined) return

        if (to === 'object') {
            const oKeys = (o && typeof o === 'object') ? Object.keys(o) : []
            const bKeys = (b && typeof b === 'object') ? Object.keys(b) : []
            // find missing keys
            for (const k of oKeys) {
                if (!(k in (b as Record<string, unknown>))) {
                    const child = (o as Record<string, unknown>)[k]
                    const tChild = typeOf(child)
                    const droppedSpecial = (tChild === 'undefined' || tChild === 'function' || tChild === 'symbol')
                    if (!(allowDropSpecial && droppedSpecial)) {
                        lostPaths.push(path ? `${path}.${k}` : k)
                    }
                }
            }
            // recurse
            for (const k of bKeys) {
                walk((o as Record<string, unknown>)?.[k], (b as Record<string, unknown>)[k], path ? `${path}.${k}` : k)
            }
        } else if (to === 'array') {
            const len = Array.isArray(b) ? (b as unknown[]).length : 0
            for (let i = 0; i < len; i++) {
                walk((o as unknown[])?.[i], (b as unknown[])[i], `${path}[${i}]`)
            }
        }
    }

    walk(original, bridged, '')

    return { lostPaths, transformed }
}

