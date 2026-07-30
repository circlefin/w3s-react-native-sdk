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
import UIKit
import CircleProgrammableWalletSDK

@objc
public class RNWalletSdk: NSObject {

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

    @objc public func initSdk(_ configuration: NSDictionary,
                              resolve: @escaping RCTPromiseResolveBlock,
                              reject: @escaping RCTPromiseRejectBlock) {
        WalletSdk.shared.setLayoutProvider(self)
        WalletSdk.shared.setDelegate(self)
        WalletSdk.shared.setErrorMessenger(self)
        guard var endPoint = configuration["endpoint"] as? String,
              let appId = configuration["appId"] as? String else { return }
        if endPoint.last == "/" {
            endPoint.removeLast()
        }

        var enableBiometricsPin = false
        if let settingsManagement = configuration["settingsManagement"] as? NSDictionary,
           let enableBio = settingsManagement["enableBiometricsPin"] as? Bool {
            enableBiometricsPin = enableBio
        }

        let settings = WalletSdk.SettingsManagement(enableBiometricsPin: enableBiometricsPin)
        let configuration = WalletSdk.Configuration(endPoint: endPoint, appId: appId, settingsManagement: settings)

        do {
            try WalletSdk.shared.setConfiguration(configuration)
            resolve([:])
        } catch let error as ApiError {
            reject("\(error.errorCode.rawValue)", error.displayString, error)
        } catch {
            reject(nil, error.localizedDescription, error)
        }
    }

    @objc public func execute(_ userToken: String,
                              encryptionKey: String,
                              challengeIds: NSArray,
                              resolve: @escaping RCTPromiseResolveBlock,
                              reject: @escaping RCTPromiseRejectBlock) {
        guard let challengeIdArr = challengeIds as? [String] else {
            reject(nil, "[unknown format] challengeIds", nil)
            return
        }

        DispatchQueue.main.async {
            WalletSdk.shared.execute(userToken: userToken,
                                     encryptionKey: encryptionKey,
                                     challengeIds: challengeIdArr) { executeCompletion in
                switch executeCompletion.result {
                case .success(let executeResult):
                    self._handleExecuteResult(result: executeResult,
                                              onWarning: executeCompletion.onWarning,
                                              controller: executeCompletion.onErrorController,
                                              resolve: resolve)

                case .failure(let error):
                    self._handleErrorResult(error: error,
                                            controller: executeCompletion.onErrorController,
                                            reject: reject)
                }

                // Remove cache controller
                self.sdkNavigationController = nil
            }
        }
    }

    @objc public func executeWithUserSecret(_ userToken: String,
                                            encryptionKey: String,
                                            userSecret: String,
                                            challengeIds: NSArray,
                                            resolve: @escaping RCTPromiseResolveBlock,
                                            reject: @escaping RCTPromiseRejectBlock) {
        reject(nil, "executeWithUserSecret func deprecated", nil)
    }

    @objc public func setBiometricsPin(_ userToken: String,
                                       encryptionKey: String,
                                       resolve: @escaping RCTPromiseResolveBlock,
                                       reject: @escaping RCTPromiseRejectBlock) {

        DispatchQueue.main.async {
            WalletSdk.shared.setBiometricsPin(userToken: userToken, encryptionKey: encryptionKey) { executeCompletion in
                switch executeCompletion.result {
                case .success(let executeResult):
                    self._handleExecuteResult(result: executeResult,
                                              onWarning: executeCompletion.onWarning,
                                              controller: executeCompletion.onErrorController,
                                              resolve: resolve)

                case .failure(let error):
                    self._handleErrorResult(error: error,
                                            controller: executeCompletion.onErrorController,
                                            reject: reject)
                }
            }
        }
    }

    @objc public func performLogin(provider: String,
                                   deviceToken: String,
                                   encryptionKey: String,
                                   resolve: @escaping RCTPromiseResolveBlock,
                                   reject: @escaping RCTPromiseRejectBlock) {
        guard let socialProvider = SocialProvider(rawValue: provider) else {
            reject(nil, "[unknown format] invalid provider string", nil)
            return
        }
        DispatchQueue.main.async {
            WalletSdk.shared.performLogin(provider: socialProvider,
                                          deviceToken: deviceToken,
                                          encryptionKey: encryptionKey) { loginCompletion in
                switch loginCompletion.result {
                case .success(let loginResult):
                    self._handleLoginResult(result: loginResult, resolve: resolve)

                case .failure(let error):
                    reject(String(error.errorCode.rawValue), error.displayString, error)
                }
            }
        }
    }

    @objc public func verifyOTP(deviceToken: String,
                                encryptionKey: String,
                                otpToken: String,
                                resolve: @escaping RCTPromiseResolveBlock,
                                reject: @escaping RCTPromiseRejectBlock) {

        DispatchQueue.main.async {
            WalletSdk.shared.verifyOTP(deviceToken: deviceToken,
                                       encryptionKey: encryptionKey,
                                       otpToken: otpToken) { loginCompletion in
                switch loginCompletion.result {
                case .success(let loginResult):
                    self._handleLoginResult(result: loginResult, resolve: resolve)

                case .failure(let error):
                    self._handleErrorResult(error: error,
                                            controller: loginCompletion.onErrorController,
                                            reject: reject)
                }
            }
        }
    }

    @objc public func performLogout(provider: String,
                                    resolve: @escaping RCTPromiseResolveBlock,
                                    reject: @escaping RCTPromiseRejectBlock) {
        guard let socialProvider = SocialProvider(rawValue: provider) else {
            reject(nil, "[unknown format] invalid provider string", nil)
            return
        }
        DispatchQueue.main.async {
            WalletSdk.shared.performLogout(provider: socialProvider) { _ in
                resolve(nil)
            }
        }
    }

    @objc public func setSecurityQuestions(_ questions: NSArray) {
        sQuestions = BridgeHelper.getSecurityQuestions(questions)
    }

    @objc public func setImageMap(_ map: NSDictionary) {
        for (key, value) in map {
            guard let key = key as? String,
                  let value = value as? String,
                  let imgUrl = URL(string: value),
                  let imgKey = BridgeHelper.getImageKey(rnKey: key) else { continue }
            sRemote[imgKey] = imgUrl
        }
    }

    @objc public func setIconTextConfigsMap(_ map: NSDictionary) {
        sSecurityConfirmItemAndConfigs = BridgeHelper.getSecurityConfirmItemAndConfigs(map)
    }

    @objc public func setTextConfigsMap(_ map: NSDictionary) {
        sTextsMap = BridgeHelper.getTextsMap(map)
    }

    @objc public func setTextConfigMap(_ map: NSDictionary) {
        sTextMap = BridgeHelper.getTextMap(map)
    }

    @objc public func setDismissOnCallbackMap(_ map: NSDictionary) {
        sDismissOnCallbackMap = BridgeHelper.getDismissOnCallbackMap(map)
    }

    @objc public func setErrorStringMap(_ map: NSDictionary) {
        sErrorStringMap = BridgeHelper.getErrorStringMap(map)
    }

    @objc public func moveRnTaskToFront() {
        DispatchQueue.main.async {
            guard let sdkVc = self.sdkNavigationController else { return }
            sdkVc.dismiss(animated: true)
            print("moveRnTaskToFront")
        }
    }

    @objc public func moveTaskToFront() {
        DispatchQueue.main.async {
            guard let sdkVc = self.sdkNavigationController else { return }
            let topMostVC = UIApplication.shared.topMostViewController()
            sdkVc.modalPresentationStyle = .overFullScreen
            topMostVC?.present(sdkVc, animated: true)
            print("moveTaskToFront")
        }
    }

    @objc public func sdkVersion() -> String? {
        return WalletSdk.shared.sdkVersion()
    }

    @objc public func getDeviceId() -> String? {
        return WalletSdk.shared.getDeviceId()
    }

    @objc public func setCustomUserAgent(userAgent: String) {
        WalletSdk.shared.customUserAgent = userAgent
    }

    @objc public func setDateFormat(format: String) {
        sDateFormat = format
    }

    @objc public func setDebugging(debugging: Bool) {
        print("setDebugging: \(debugging)")
    }
}

extension RNWalletSdk: ErrorMessenger {

    public func getErrorString(_ code: CircleProgrammableWalletSDK.ApiError.ErrorCode) -> String? {
        return BridgeHelper.getErrorString(code.rawValue, sErrorStringMap[code.rawValue], sTextMap)
    }
}

extension RNWalletSdk: WalletSdkDelegate {

    public func walletSdk(willPresentController controller: UIViewController) {
        customizeAdapter(controller: controller)
    }

    public func walletSdk(controller: UIViewController, onForgetPINButtonSelected onSelect: Void) {
        self.sdkNavigationController = controller.navigationController
        EventEmitter.sharedInstance.dispatch(name: "CirclePwOnEvent", body: "forgotPin")
    }
}

extension RNWalletSdk: WalletSdkLayoutProvider {

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

private extension RNWalletSdk {

    func _handleExecuteResult(result: ExecuteResult,
                              onWarning: ExecuteWarning?,
                              controller: UIViewController?,
                              resolve: @escaping RCTPromiseResolveBlock) {
        let challengeStatus = result.status.rawValue
        let challengeType = result.resultType.rawValue
        var dismiss = false
        var dict: [String: Any] = [
            "result": [
                "status": challengeStatus,
                "resultType": challengeType,
                "data": [
                    "signature": result.data?.signature
                ]
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
            controller?.dismiss(animated: true)
            resolve(dict)

        } else {
            EventEmitter.sharedInstance.dispatch(name: "CirclePwOnSuccess", body: dict)
        }
    }

    func _handleLoginResult(result: LoginResult,
                            resolve: @escaping RCTPromiseResolveBlock) {
        
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

    func _handleErrorResult(error: ApiError,
                            controller: UIViewController?,
                            reject: @escaping RCTPromiseRejectBlock) {

        if self.sDismissOnCallbackMap[error.errorCode.rawValue] == true {
            controller?.dismiss(animated: true)
            reject(String(error.errorCode.rawValue), error.displayString, error)

        } else {
            let dict: [String: Any] = [
                "code": String(error.errorCode.rawValue),
                "message": error.displayString
            ]
            EventEmitter.sharedInstance.dispatch(name: "CirclePwOnError", body: dict)
        }
    }
}
