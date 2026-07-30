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

import UIKit

extension UIColor {

    convenience init(_ string: String) {
        if string.hasPrefix("rgba(") {
            self.init(rgba: string)
        } else {
            self.init(hex: string)
        }
    }

    /// Initialize UIColor with hex string
    ///
    /// - from: https://stackoverflow.com/a/59367504
    ///
    /// - Parameters:
    ///   - hex: color hex string, ex: "#000" or "#000000" or "#00000000"
    convenience init(hex: String) {

        var hexFormatted: String = hex.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines).uppercased()

        if hexFormatted.hasPrefix("#") {
            hexFormatted = String(hexFormatted.dropFirst())
        }

        var argbValue: UInt64 = 0
        Scanner(string: hexFormatted).scanHexInt64(&argbValue)

        let a, r, g, b: UInt64
        switch hexFormatted.count {
        case 3:                         // RGB (12-bit)
            (a, r, g, b) = (255,
                            (argbValue >> 8) * 17,
                            (argbValue >> 4 & 0xF) * 17,
                            (argbValue & 0xF) * 17)
        case 6:                         // RGB (24-bit)
            (a, r, g, b) = (255,
                            argbValue >> 16,
                            argbValue >> 8 & 0xFF,
                            argbValue & 0xFF)
        case 8:                         // ARGB (32-bit)
            (a, r, g, b) = (argbValue >> 24,
                            argbValue >> 16 & 0xFF,
                            argbValue >> 8 & 0xFF,
                            argbValue & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
            print("Invalid hex code used.")
        }

        self.init(red: CGFloat(r) / 255.0,
                  green: CGFloat(g) / 255.0,
                  blue: CGFloat(b) / 255.0,
                  alpha: CGFloat(a) / 255.0)
    }

    /// Initialize UIColor with custom rgba string
    ///
    /// - Parameter rgba: custom rgba string, ex: "rgba(83,90,110,0.87)"
    convenience init(rgba: String) {
        guard rgba.hasPrefix("rgba(") else {
            fatalError("Invalid rgba format used.")
        }

        let arr = rgba.replacingOccurrences(of: "rgba(", with: "")
            .replacingOccurrences(of: ")", with: "")
            .split(separator: ",")

        guard arr.count == 4,
              let r = Double(arr[0]),
              let g = Double(arr[1]),
              let b = Double(arr[2]),
              let a = Double(arr[3]) else {
            fatalError("Invalid rgba format used.")
        }

        self.init(red: CGFloat(r) / 255.0,
                  green: CGFloat(g) / 255.0,
                  blue: CGFloat(b) / 255.0,
                  alpha: a)
    }
}
