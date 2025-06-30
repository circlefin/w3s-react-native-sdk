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

import Foundation
import CircleProgrammableWalletSDK

class BridgeHelper: NSObject {

    static func getSecurityQuestions(_ rnQuestions: NSArray) -> [SecurityQuestion] {

        func getInputType(_ string: String?) -> SecurityQuestion.InputType {
            if string == "datePicker" {
                return .datePicker
            }
            return .text
        }

        var questions: [SecurityQuestion] = []
        for e in rnQuestions {
            if let e = e as? [String: Any],
               let title = e["title"] as? String {
                let question = SecurityQuestion(title: title,
                                                inputType: getInputType(e["inputType"] as? String))
                questions.append(question)
            }
        }
        return questions
    }

    static func getImageKey(rnKey: String) -> ImageStore.Img? {
        switch rnKey {
        case "close": return .naviClose
        case "back": return .naviBack
        case "dropdownArrow": return .dropdownArrow
        case "selectCheckMark": return .selectCheckMark
        case "errorInfo": return .errorInfo
        case "securityIntroMain": return .securityIntroMain
        case "securityConfirmMain": return .securityConfirmMain
        case "biometricsAllowMain": return .biometricsAllowMain
        case "showPin": return .showPin
        case "hidePin": return .hidePin
        case "transactionTokenIcon": return .transactionTokenIcon
        case "networkFeeTipIcon": return .networkFeeTipIcon
        case "showLessDetailArrow": return .showLessDetailArrow
        case "showMoreDetailArrow": return .showMoreDetailArrow
        case "requestIcon": return .requestIcon
        default: return nil
        }
    }

    static func getSecurityConfirmItemAndConfigs(_ rnDic: NSDictionary) -> ([SecurityConfirmItem], [TextConfig]) {
        var items: [SecurityConfirmItem] = []
        var textConfigs: [TextConfig] = []
        if let rnItems = rnDic[IconTextsKey.securityConfirmationItems.rawValue] as? NSArray {
            for e in rnItems {
                guard let e = e as? [String: Any],
                      let dict = e["textConfig"] as? [String: Any] else { continue }

                let textConfig = getTextConfig(dict)
                if let text = textConfig.text {
                    if let image = e["image"] as? String {
                        if image.starts(with: "http") {
                            items.append(SecurityConfirmItem(image: nil, imageUrl: URL(string: image), text: text))
                        } else {
                            var url = URL(string: image)
                            if let url = url {
                                items.append(SecurityConfirmItem(image: UIImage(contentsOfFile: url.path), text: text))
                            }
                        }
                    } else{
                        items.append(SecurityConfirmItem(text: text))
                    }
                    textConfigs.append(textConfig)
                }
            }
        }
        return (items, textConfigs)
    }

    static func getTextsMap(_ rnDic: NSDictionary) -> [TextsKey: [TextConfig]] {
        var map: [TextsKey: [TextConfig]] = [:]
        for (key, value) in rnDic {
            guard let key = key as? String,
                  let textsKey = TextsKey(rawValue: key),
                  let value = value as? [[String: Any]] else { continue }

            let array: [TextConfig] = value.compactMap { getTextConfig($0) }
            map[textsKey] = array
        }
        return map
    }

    static func getTextMap(_ rnDic: NSDictionary) -> [TextKey: TextConfig] {
        var map: [TextKey: TextConfig] = [:]
        for (key, value) in rnDic {
            guard let key = key as? String,
                  let textKey = TextKey(rawValue: key),
                  let v = value as? [String: Any] else { continue }

            map[textKey] = getTextConfig(v)
        }
        return map
    }

    static func getDismissOnCallbackMap(_ rnDic: NSDictionary) -> [Int: Bool] {
        var map: [Int: Bool] = [:]
        for (key, value) in rnDic {
            guard let key = key as? String,
                  let intKey = Int(key),
                  let v = value as? Bool else { continue }
            map[intKey] = v
        }
        return map
    }
    
    public static func getErrorStringMap(_ rnDic: NSDictionary) -> [Int: String] {
        var map: [Int: String] = [:]
        for (key, value) in rnDic {
            guard let key = key as? String,
                  let intKey = Int(key),
                  let v = value as? String else { continue }
            map[intKey] = v
        }
        return map
    }
    
    public static func getErrorString(_ code: Int, _ errorStr: String?, _ textMap: [TextKey: TextConfig]) -> String?{
        var constMap: [Int: [String]] = [:]
        constMap[ApiError.ErrorCode.incorrectUserPin.rawValue] = ["The PIN you entered is incorrect.", 
                                                                  "You have %@ attempts left.",
                                                                  TextKey.circlepw_pin_remain_attemps_template.rawValue]
        constMap[ApiError.ErrorCode.incorrectSecurityAnswers.rawValue] = ["The answers you entered are incorrect.", 
                                                                          "You have %@ attempts left",
                                                                          TextKey.circlepw_answer_remain_attemps_template.rawValue]
        constMap[ApiError.ErrorCode.userPinLocked.rawValue] = ["You’ve used up all PIN attempts.", 
                                                               "Please wait for %@ mins to retry later.",
                                                               TextKey.circlepw_pin_lock_period_template.rawValue]
        constMap[ApiError.ErrorCode.securityAnswersLocked.rawValue] = ["The answers you entered are incorrect.",
                                                                       "Please wait for %@ mins to retry again.",
                                                                       TextKey.circlepw_answer_lock_period_template.rawValue]
        guard let textKey = TextKey(rawValue: constMap[code]?[safe: 2] ?? "") else { return errorStr }
        let textConfig: TextConfig? = textMap[textKey]
        let configText = textConfig?.text ?? constMap[code]?[safe: 1]

        guard let text = configText else { return errorStr }
        if let errStr = errorStr {
            return "\(errStr) \(text)"
        } else{
            if let errStr = constMap[code]?[safe: 0] {
                return "\(errStr) \(text)"
            } else{
                return "\(text)"
            } 
        }
    }
}

extension BridgeHelper {

    private static func getTextConfig(_ dict: [String: Any]) -> TextConfig {
        var textConfig = TextConfig(text: dict["text"] as? String,
                                    textColor: dict["textColor"] as? String,
                                    gradientColors: nil,
                                    font: dict["font"] as? String)

        if let gradientColors = dict["gradientColors"] as? NSArray {
            let colors: [String] = gradientColors.compactMap { $0 as? String }
            textConfig.gradientColors = colors
        }
        return textConfig
    }

}
