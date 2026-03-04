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

import ExpoModulesCore
import CircleProgrammableWalletSDK

let CIRCLE_PW_ON_EVENT_NAME = "CirclePwOnEvent"
let CIRCLE_PW_ON_SUCCESS_EVENT_NAME = "CirclePwOnSuccess"
let CIRCLE_PW_ON_ERROR_EVENT_NAME = "CirclePwOnError"

public class ProgrammablewalletRnSdkModule: Module {
    
    var sLocal: [ImageStore.Img: UIImage] = [:]
    var sRemote: [ImageStore.Img: URL] = [:]
    var sQuestions: [SecurityQuestion] = []
    var sTextsMap: [TextsKey: [TextConfig]] = [:]
    var sTextMap: [TextKey: TextConfig] = [:]
    var sSecurityConfirmItemAndConfigs: ([SecurityConfirmItem], [TextConfig]) = ([], [])
    var sDismissOnCallbackMap: [Int: Bool] = [:]
    var sErrorStringMap: [Int: String] = [:]
    var sdkNavigationController: UINavigationController?
    var sDateFormat = "yyyy-MM-dd"
    
    // Each module class must implement the definition function. The definition consists of components
    // that describes the module's functionality and behavior.
    // See https://docs.expo.dev/modules/module-api for more details about available components.
    public func definition() -> ModuleDefinition {
        // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
        // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
        // The module will be accessible from `requireNativeModule('ProgrammablewalletRnSdk')` in JavaScript.
        Name("ProgrammablewalletRnSdk")
        
        Events(CIRCLE_PW_ON_EVENT_NAME, CIRCLE_PW_ON_SUCCESS_EVENT_NAME, CIRCLE_PW_ON_ERROR_EVENT_NAME)
        
        // Sets constant properties on the module. Can take a dictionary or a closure that returns a dictionary.
        Constants([
            "sdkVersion": WalletSdk.shared.sdkVersion()
        ])
        
        // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
        Function("getDeviceId") {
            return WalletSdk.shared.getDeviceId()
        }
        
        // Initialize SDK with configuration
        AsyncFunction("initSdk") { (configuration: [String: Any]) async throws -> Void in
            
            WalletSdk.shared.setLayoutProvider(self)
            WalletSdk.shared.setDelegate(self)
            WalletSdk.shared.setErrorMessenger(self)
            
            var endPoint = configuration["endpoint"] as? String ?? ""
            if endPoint.last == "/" {
                endPoint.removeLast()
            }
            let appId = configuration["appId"] as? String ?? ""
            
            var enableBiometricsPin = false
            if let settingsManagement = configuration["settingsManagement"] as? [String: Any],
               let enableBio = settingsManagement["enableBiometricsPin"] as? Bool {
                enableBiometricsPin = enableBio
            }
            
            let settings = WalletSdk.SettingsManagement(enableBiometricsPin: enableBiometricsPin)
            let sdkConfig = WalletSdk.Configuration(endPoint: endPoint, appId: appId, settingsManagement: settings)
            
            try WalletSdk.shared.setConfiguration(sdkConfig)
            return
        }
        
        // Set security questions for the wallet
        Function("setSecurityQuestions") { (securityQuestions: [[String: Any]]) in
            sQuestions = BridgeHelper.getSecurityQuestions(securityQuestions)
        }
        
        // Execute wallet operations
        AsyncFunction("execute") { (userToken: String, encryptionKey: String, challengeIds: [String], promise: Promise) in
            DispatchQueue.main.async {
                WalletSdk.shared.execute(userToken: userToken,
                                         encryptionKey: encryptionKey,
                                         challengeIds: challengeIds) { executeCompletion in
                    self._bridgeExecuteCompletion(executeCompletion, promise)
                }
            }
        }
        
        AsyncFunction("verifyOTP") { (otpToken: String,
                                      deviceToken: String,
                                      deviceEncryptionKey: String,
                                      promise: Promise) in
            DispatchQueue.main.async {
                WalletSdk.shared.verifyOTP(deviceToken: deviceToken,
                                           encryptionKey: deviceEncryptionKey,
                                           otpToken: otpToken) { loginCompletion in
                    switch loginCompletion.result {
                    case .success(let loginResult):
                        self._handleLoginResultExpo(
                            result: loginResult,
                            resolve: { value in promise.resolve(value) }
                        )
                    case .failure(let error):
                        self._handleErrorResultExpo(
                            error: error,
                            controller: loginCompletion.onErrorController,
                            reject: { code, description in promise.reject(code, description) }
                        )
                    }
                }
            }
        }
        
        AsyncFunction("performLogin") { (provider: String,
                                         deviceToken: String,
                                         deviceEncryptionKey: String,
                                         promise: Promise) in
            guard let socialProvider = SocialProvider(rawValue: provider) else {
                promise.reject("155720", "[unknown format] invalid provider string")
                return
            }
            DispatchQueue.main.async {
                WalletSdk.shared.performLogin(provider: socialProvider,
                                              deviceToken: deviceToken,
                                              encryptionKey: deviceEncryptionKey) { loginCompletion in
                    switch loginCompletion.result {
                    case .success(let loginResult):
                        self._handleLoginResultExpo(
                            result: loginResult,
                            resolve: { value in promise.resolve(value) }
                        )
                    case .failure(let error):
                        promise.reject(String(error.errorCode.rawValue), error.displayString)
                    }
                }
            }
        }
        
        AsyncFunction("performLogout") { (provider: String, promise: Promise) in
            guard let socialProvider = SocialProvider(rawValue: provider) else {
                promise.reject("155720", "[unknown format] invalid provider string")
                return
            }
            DispatchQueue.main.async {
                WalletSdk.shared.performLogout(provider: socialProvider) { _ in
                    promise.resolve(nil)
                }
            }
        }
        
        AsyncFunction("setBiometricsPin") { (userToken: String,
                                             encryptionKey: String,
                                             promise: Promise) in
            DispatchQueue.main.async {
                WalletSdk.shared.setBiometricsPin(userToken: userToken, encryptionKey: encryptionKey) { executeCompletion in
                    self._bridgeExecuteCompletion(executeCompletion, promise)
                }
            }
        }
        
        // Set dismiss on callback map for error handling
        Function("setDismissOnCallbackMap") { (mapData: [String: Bool]) in
            sDismissOnCallbackMap = BridgeHelper.getDismissOnCallbackMap(mapData)
        }
        
        Function("moveTaskToFront") {
            DispatchQueue.main.async {
                guard let sdkVc = self.sdkNavigationController else { return }
                let topMostVC = UIApplication.shared.topMostViewController()
                sdkVc.modalPresentationStyle = .overFullScreen
                topMostVC?.present(sdkVc, animated: true)
                print("moveTaskToFront")
            }
        }
        
        Function("moveRnTaskToFront") {
            DispatchQueue.main.async {
                guard let sdkVc = self.sdkNavigationController else { return }
                sdkVc.dismiss(animated: true)
                print("moveRnTaskToFront")
            }
        }
        
        // Set text configurations map
        Function("setTextConfigsMap") { (mapData: [String: Any]) in
            sTextsMap = BridgeHelper.getTextsMap(mapData)
        }
        
        // Set icon text configurations map
        Function("setIconTextConfigsMap") { (mapData: [String: Any]) in
            sSecurityConfirmItemAndConfigs = BridgeHelper.getSecurityConfirmItemAndConfigs(mapData)
        }
        
        // Set text configuration map
        Function("setTextConfigMap") { (mapData: [String: Any]) in
            sTextMap = BridgeHelper.getTextMap(mapData)
        }

        // Set image map for custom images
        Function("setImageMap") { (mapData: [String: String]) in
            for (key, value) in mapData {
                guard let imgUrl = URL(string: value),
                      let imgKey = BridgeHelper.getImageKey(rnKey: key) else { continue }
                sRemote[imgKey] = imgUrl
            }
        }
        
        // Set date format for display
        Function("setDateFormat") { (format: String) in
            sDateFormat = format
        }
        
        // Set debugging (no implementation is needed on the iOS side.)
        Function("setDebugging") { (debugging: Bool) in
            // No-op on iOS
        }
        
        // Register setCustomUserAgent
        Function("setCustomUserAgent") { (userAgent: String) in
            WalletSdk.shared.customUserAgent = userAgent
        }
        
        // Set error string map for custom error messages
        Function("setErrorStringMap") { (mapData: [String: String]) in
            sErrorStringMap = BridgeHelper.getErrorStringMap(mapData)
        }
    }
}

extension ProgrammablewalletRnSdkModule: WalletSdkLayoutProvider {
    
    public func securityQuestions() -> [SecurityQuestion] {
        return sQuestions
    }
    
    public func securityQuestionsRequiredCount() -> Int {
        return sTextsMap[.securityQuestionHeaders]?.count ?? 2
    }
    
    public func securityConfirmItems() -> [SecurityConfirmItem] {
        return sSecurityConfirmItemAndConfigs.0
    }
    
    public func displayDateFormat() -> String {
        return sDateFormat
    }
    
    public func imageStore() -> ImageStore {
        return ImageStore(local: sLocal, remote: sRemote)
    }
}

extension ProgrammablewalletRnSdkModule: WalletSdkDelegate {
    
    public func walletSdk(willPresentController controller: UIViewController) {
        self.customizeAdapter(controller: controller)
    }
    
    public func walletSdk(controller: UIViewController, onForgetPINButtonSelected onSelect: Void) {
        self.sdkNavigationController = controller.navigationController
        self.sendEvent(CIRCLE_PW_ON_EVENT_NAME, ["name": "forgotPin"])
    }
}

extension ProgrammablewalletRnSdkModule: ErrorMessenger {
    
    public func getErrorString(_ code: CircleProgrammableWalletSDK.ApiError.ErrorCode) -> String? {
        return BridgeHelper.getErrorString(code.rawValue, sErrorStringMap[code.rawValue], sTextMap)
    }
}

private extension ProgrammablewalletRnSdkModule {
    func _handleExecuteResultExpo(result: ExecuteResult,
                                  onWarning: ExecuteWarning?,
                                  controller: UIViewController?,
                                  resolve: @escaping ([String: Any]) -> Void) {
        let challengeStatus = result.status.rawValue
        let challengeType = result.resultType.rawValue
        var dismiss = false
        
        let dataDict: [String: Any] = [
            "signature": result.data?.signature,
            "signedTransaction": result.data?.signedTransaction,
            "txHash": result.data?.txHash
        ].compactMapValues { $0 }
        
        var dict: [String: Any] = [
            "result": [
                "status": challengeStatus,
                "resultType": challengeType,
                "data": dataDict
            ]
        ]
        if let onWarning = onWarning {
            dict["warning"] = [
                "warningType": onWarning.warningType.rawValue,
                "warningString": onWarning.warningString
            ]
            dismiss = self.sDismissOnCallbackMap[onWarning.warningType.rawValue] == true
        }
        if dismiss {
            controller?.dismiss(animated: true) {
                resolve(dict)
            }
        } else {
            self.sendEvent(CIRCLE_PW_ON_SUCCESS_EVENT_NAME, dict)
        }
    }
    
    func _handleLoginResultExpo(result: LoginResult,
                                resolve: @escaping ([String: Any]) -> Void) {
        var oauthInfoDict: [String: Any]?
        if let oauthInfo = result.oauthInfo {
            oauthInfoDict = [
                "provider": oauthInfo.provider,
                "scope": oauthInfo.scope as Any,
                "socialUserUUID": oauthInfo.socialUserUUID,
                "socialUserInfo": [
                    "name": oauthInfo.socialUserInfo?.name,
                    "email": oauthInfo.socialUserInfo?.email,
                    "phone": oauthInfo.socialUserInfo?.phone,
                ]
            ]
        }
        let dict: [String: Any] = [
            "userToken": result.userToken,
            "encryptionKey": result.encryptionKey,
            "refreshToken": result.refreshToken,
            "oauthInfo": oauthInfoDict as Any
        ]
        resolve(dict)
    }
    
    func _handleErrorResultExpo(error: ApiError,
                                controller: UIViewController?,
                                reject: @escaping (String, String) -> Void) {
        if self.sDismissOnCallbackMap[error.errorCode.rawValue] == true {
            controller?.dismiss(animated: true)
            
            let code = String(error.errorCode.rawValue)
            let message = error.displayString
            reject(code, message)
            
        } else {
            let dict: [String: Any] = [
                "code": String(error.errorCode.rawValue),
                "message": error.displayString
            ]
            self.sendEvent(CIRCLE_PW_ON_ERROR_EVENT_NAME, dict)
        }
    }
    
    func _bridgeExecuteCompletion(_ executeCompletion: CircleProgrammableWalletSDK.ExecuteCompletionStruct,
                                  _ promise: Promise) {
        switch executeCompletion.result {
        case .success(let executeResult):
            self._handleExecuteResultExpo(
                result: executeResult,
                onWarning: executeCompletion.onWarning,
                controller: executeCompletion.onErrorController,
                resolve: { value in promise.resolve(value) }
            )
        case .failure(let error):
            self._handleErrorResultExpo(
                error: error,
                controller: executeCompletion.onErrorController,
                reject: { code, description in promise.reject(code, description) }
            )
        }
    }
}
