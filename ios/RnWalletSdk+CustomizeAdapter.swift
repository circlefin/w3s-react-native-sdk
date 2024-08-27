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

extension RNWalletSdk {

    func customizeAdapter(controller: UIViewController) {

        // MARK: UI Flow - New PIN

        if let controller = controller as? NewPINCodeViewController {
            if let configs = sTextsMap[.newPinCodeHeadline] { // A1
                for index in configs.indices {
                    if index == 0 {
                        setText(label: controller.titleLabel1, textConfig: configs[index])
                    } else if index == 1 {
                        setText(label: controller.titleLabel2, textConfig: configs[index])
                    }
                }
            }
            if let textConfig = sTextMap[.circlepw_new_pincode_subhead] { // C1
                setText(label: controller.subtitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_pincode_error_config] { // C5
                setText(label: controller.errorMessageLabel, textConfig: textConfig, shouldReplaceText: false)
            }
        }

        if let controller = controller as? ConfirmPINCodeViewController {
            if let textConfig = sTextMap[.circlepw_confirm_pincode_headline] { // C6
                setText(label: controller.titleLabel1, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_confirm_pincode_subhead] { // C7
                setText(label: controller.subtitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_pincode_error_config] { // C5
                setText(label: controller.errorMessageLabel, textConfig: textConfig, shouldReplaceText: false)
            }
        }

        if let controller = controller as? SecurityIntrosViewController {
            if let configs = sTextsMap[.securityIntroHeadline] { // A3
                for index in configs.indices {
                    if index == 0 {
                        setText(label: controller.titleLabel1, textConfig: configs[index])
                    } else if index == 1 {
                        setText(label: controller.titleLabel2, textConfig: configs[index])
                    }
                }
            }
            if let textConfig = sTextMap[.circlepw_security_intros_description] { // C10
                setText(label: controller.introDescLabel, textConfig: textConfig)
            }
            if let configs = sTextsMap[.securityIntroLink] { // A4
                for index in configs.indices {
                    if index == 0 {
                        setText(button: controller.introLinkButton, textConfig: configs[index])
                    } else if index == 1, let urlString = configs[index].text {
                        controller.introURL = URL(string: urlString)
                    }
                }
            }
            if let textConfig = sTextMap[.circlepw_continue] { // C11
                setText(button: controller.continueButton, textConfig: textConfig)
            }
        }

        if let controller = controller as? SecurityQuestionsViewController {
            if let textConfig = sTextMap[.circlepw_security_questions_title] { // C12
                setText(label: controller.baseNaviTitleLabel, textConfig: textConfig)
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                for (i, cell) in controller.tableView.visibleCells.enumerated() {
                    guard let cell = cell as? SecurityQuestionTableViewCell else { continue }

                    if let configs = self.sTextsMap[.securityQuestionHeaders],
                       let config = configs[safe: i] { // A5
                        self.setText(label: cell.questionTitleLabel, textConfig: config)
                    }
                    if let textConfig = self.sTextMap[.circlepw_security_questions_required_mark] { // C13
                        self.setText(label: cell.questionMarkLabel, textConfig: textConfig)
                        self.setText(label: cell.answerMarkLabel, textConfig: textConfig)
                    }
                    if let textConfig = self.sTextMap[.circlepw_security_questions_question_placeholder],
                       let label = cell.questionView.subviews.first as? UILabel { // C15
                        self.setText(label: label, textConfig: textConfig)
                    }

                    if let textConfig = self.sTextMap[.circlepw_security_questions_answer_header] { // C16
                        self.setText(label: cell.answerTitleLabel, textConfig: textConfig)
                    }
                    if let textField = cell.answerStackView.arrangedSubviews.last as? UITextField {
                        self.setText(textField: textField,
                                     textConfig: self.sTextMap[.circlepw_security_questions_answer_input_config], // C17
                                     placeholderTextConfig: self.sTextMap[.circlepw_security_questions_answer_placeholder] // C18
                        )
                    }

                    if let textConfig = self.sTextMap[.circlepw_security_questions_answer_hint_header] { // C19
                        self.setText(label: cell.hintTitleLabel, textConfig: textConfig)
                    }
                    if let textField = cell.hintStackView.arrangedSubviews.first(where: { $0 is UITextField }) as? UITextField {
                        self.setText(textField: textField,
                                     textConfig: self.sTextMap[.circlepw_security_questions_answer_hint_input_config], // C20
                                     placeholderTextConfig: self.sTextMap[.circlepw_security_questions_answer_hint_placeholder] // C21
                        )
                    }
                    if let textConfig = self.sTextMap[.circlepw_security_questions_error_config] { // C22
                        self.setText(label: cell.hintWarningLabel, textConfig: textConfig, shouldReplaceText: false)
                    }
                }
            }

            if let textConfig = sTextMap[.circlepw_next] { // C23
                setText(button: controller.nextButton, textConfig: textConfig)
            }
        }

        if let controller = controller as? SelectQuestionViewController {
            if let textConfig = sTextMap[.circlepw_select_question_title] { // C24
                setText(label: controller.baseNaviTitleLabel, textConfig: textConfig)
            }

            if let textConfig = sTextMap[.circlepw_select_question_item_config] { // C25
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    for cell in controller.tableView.visibleCells {
                        guard let cell = cell as? SelectQuestionTableViewCell else { continue }
                        self.setText(label: cell.titleLabel, textConfig: textConfig, shouldReplaceText: false)
                    }
                }
            }
        }

        if let controller = controller as? SecuritySummaryViewController {
            if let textConfig = sTextMap[.circlepw_security_summary_title] { // C26
                setText(label: controller.baseNaviTitleLabel, textConfig: textConfig)
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                for (i, cell) in controller.tableView.visibleCells.enumerated() {
                    guard let cell = cell as? SecuritySummaryTableViewCell else { continue }

                    if let configs = self.sTextsMap[.securitySummaryQuestionHeaders],
                       let config = configs[safe: i] { // A6
                        self.setText(label: cell.titleLabel, textConfig: config)
                    }

                    if let textConfig = self.sTextMap[.circlepw_question_label] { // C27
                        self.setText(label: cell.questionTitleLabel, textConfig: textConfig)
                    }
                    if let textConfig = self.sTextMap[.circlepw_answer_label] { // C29
                        self.setText(label: cell.answerTitleLabel, textConfig: textConfig)
                    }
                    if let textConfig = self.sTextMap[.circlepw_hint_label] { // C31
                        self.setText(label: cell.hintTitleLabel, textConfig: textConfig)
                    }
                }
            }

            if let textConfig = sTextMap[.circlepw_continue] { // C11
                setText(button: controller.continueButton, textConfig: textConfig)
            }
        }

        if let controller = controller as? SecurityConfirmViewController {
            if let textConfig = sTextMap[.circlepw_security_confirm_title] { // C33
                setText(label: controller.baseNaviTitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_security_confirm_headline] { // C34
                setText(label: controller.tipsTitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_security_confirm_input_headline] { // C35
                setText(label: controller.agreeTitleLabel, textConfig: textConfig)
            }
            self.setText(textField: controller.agreeTextField,
                         textConfig: self.sTextMap[.circlepw_security_confirm_input_config], // C37
                         placeholderTextConfig: self.sTextMap[.circlepw_security_confirm_input_placeholder] // C36
            )
            if let textConfig = sTextMap[.circlepw_continue] { // C11
                setText(button: controller.continueButton, textConfig: textConfig)
            }
        }

        // MARK: UI Flow - Enter PIN

        if let controller = controller as? EnterPINCodeViewController {
            if let configs = sTextsMap[.enterPinCodeHeadline] { // A2
                for index in configs.indices {
                    if index == 0 {
                        setText(label: controller.titleLabel1, textConfig: configs[index])
                    } else if index == 1 {
                        setText(label: controller.titleLabel2, textConfig: configs[index])
                    }
                }
            }
            if let textConfig = sTextMap[.circlepw_enter_pincode_subhead] { // C8
                setText(label: controller.subtitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_enter_pincode_forgot_pin] { // C9
                setText(button: controller.forgotPINButton, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_enter_pincode_use_biometrics] { // C3
                setText(button: controller.biometricsButton, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_pincode_error_config] { // C5
                setText(label: controller.errorMessageLabel, textConfig: textConfig, shouldReplaceText: false)
            }
        }

        // MARK: UI Flow - Recover PIN

        if let controller = controller as? RecoverPINCodeViewController {
            if let configs = sTextsMap[.recoverPinCodeHeadline] { // A7
                for index in configs.indices {
                    if index == 0 {
                        setText(label: controller.titleLabel1, textConfig: configs[index])
                    } else if index == 1 {
                        setText(label: controller.titleLabel2, textConfig: configs[index])
                    }
                }
            }

            if let textConfig = self.sTextMap[.circlepw_recover_pincode_error_config] { // C38
                self.setText(label: controller.errorMessageLabel, textConfig: textConfig, shouldReplaceText: false)
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                for cell in controller.tableView.visibleCells {
                    guard let cell = cell as? RecoverPINCodeTableViewCell else { continue }

                    if let textConfig = self.sTextMap[.circlepw_recover_pincode_question_config] { // C39
                        if let label = cell.questionHintStackView.arrangedSubviews.first as? UILabel {
                            self.setText(label: label, textConfig: textConfig, shouldReplaceText: false)
                        }
                    }
                    if let textConfig = self.sTextMap[.circlepw_hint_tag] { // C40
                        self.setText(label: cell.hintTitleLabel, textConfig: textConfig)
                    }
                    if let textConfig = self.sTextMap[.circlepw_recover_pincode_answer_hint_config] { // C41
                        if let label = cell.hintStackView.arrangedSubviews.last as? UILabel {
                            self.setText(label: label, textConfig: textConfig, shouldReplaceText: false)
                        }
                    }
                    if let textConfig = self.sTextMap[.circlepw_recover_pincode_answer_input_header] { // C42
                        self.setText(label: cell.answerTitleLabel, textConfig: textConfig)
                    }
                    if let textConfig = self.sTextMap[.circlepw_security_questions_required_mark] { // C13
                        self.setText(label: cell.answerMarkLabel, textConfig: textConfig)
                    }
                    if let textField = cell.answerStackView.arrangedSubviews.last as? UITextField {
                        self.setText(textField: textField,
                                     textConfig: self.sTextMap[.circlepw_recover_pincode_input_config], // C44
                                     placeholderTextConfig: self.sTextMap[.circlepw_recover_pincode_answer_input_placeholder] // C43
                        )
                    }
                    if let textConfig = self.sTextMap[.circlepw_confirm] { // C45
                        self.setText(button: controller.confirmButton, textConfig: textConfig)
                    }
                }
            }
        }

        // MARK: UI Flow - Biometrics

        if let controller = controller as? BiometricsPromptViewController {
            if let textConfig = sTextMap[.circlepw_pin_biometrics_allow_title] { // C46
                setText(label: controller.promptTitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_pin_biometrics_allow_subtitle] { // C47
                setText(label: controller.promptSubtitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_continue] { // C11
                setText(button: controller.continueButton, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_skip] { // C48
                setText(button: controller.skipButton, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_pin_biometrics_disable] { // C49
                setText(button: controller.dontAskButton, textConfig: textConfig)
            }
        }

        // MARK: UI Flow - Transaction Request

        if let controller = controller as? BaseRequestViewController {
            if let textConfig = sTextMap[.circlepw_transaction_request_title] { // C63
                setText(label: controller.baseNaviTitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_transaction_request_subtitle] { // C64
                setText(label: controller.descriptionLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_transaction_request_error_config] { // C79
                setText(label: controller.errorLabel, textConfig: textConfig, shouldReplaceText: false)
            }
            if let textConfig = sTextMap[.circlepw_confirm] { // C45
                setText(button: controller.confirmButton, textConfig: textConfig)
            }
        }

        if let controller = controller as? TransactionRequestViewController {
            if let textConfig = sTextMap[.circlepw_transaction_request_main_currency] { // C65
                setText(label: controller.currencyLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_transaction_request_exchange_value] { // C66
                setText(label: controller.txFiatValueLabel, textConfig: textConfig, shouldReplaceText: false)
            }
            if let textConfig = sTextMap[.circlepw_transaction_request_from_label] { // C67
                setText(label: controller.fromTitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_transaction_request_from] { // C68
                setText(label: controller.fromLabel, textConfig: textConfig, shouldReplaceText: false)
            }
            if let textConfig = sTextMap[.circlepw_transaction_request_to_label] { // C69
                setText(label: controller.toTitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_transaction_request_to_config] { // C70
                setText(label: controller.toLabel, textConfig: textConfig, shouldReplaceText: false)
            }
            if let textConfig = sTextMap[.circlepw_transaction_request_to_contract_name] { // C71
                setText(label: controller.toContractNameLabel, textConfig: textConfig, shouldReplaceText: false)
            }
            if let textConfig = sTextMap[.circlepw_transaction_request_to_contract_url] { // C72
                setText(label: controller.toContractURLLabel, textConfig: textConfig, shouldReplaceText: false)
            }
            if let textConfig = sTextMap[.circlepw_transaction_request_network_fee_label] { // C73
                setText(label: controller.feeTitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_transaction_request_network_fee] { // C74
                setText(label: controller.feeLabel, textConfig: textConfig, shouldReplaceText: false)
            }
            if let textConfig = sTextMap[.circlepw_transaction_request_exchange_network_fee] { // C75
                setText(label: controller.feeFiatValueLabel, textConfig: textConfig, shouldReplaceText: false)
            }
            if let textConfig = sTextMap[.circlepw_transaction_request_total_label] { // C76
                setText(label: controller.totalTitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_transaction_request_total_config] { // C77
                setText(label: controller.totalLabel, textConfig: textConfig, shouldReplaceText: false)
            }
            if let textConfig = sTextMap[.circlepw_transaction_request_exchange_total_value] { // C78
                setText(label: controller.totalFiatValueLabel, textConfig: textConfig, shouldReplaceText: false)
            }

        }

        if let controller = controller as? FeeTipViewController {
            if let textConfig = sTextMap[.circlepw_transaction_request_fee_tip] { // C80
                setText(label: controller.descriptionLabel, textConfig: textConfig)
            }
        }

        // MARK: UI Flow - Raw Transaction Request

        if let controller = controller as? RawTransactionRequestViewController {
            if let textConfig = sTextMap[.circlepw_transaction_request_raw_tx_description] { // C89
                setText(label: controller.rawTxTitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_transaction_request_raw_tx_config] { // C90
                setText(label: controller.rawTxLabel, textConfig: textConfig, shouldReplaceText: false)
            }
        }

        // MARK: UI Flow - Contract Interaction Request

        if let controller = controller as? ContractRequestViewController {
            if let textConfig = sTextMap[.circlepw_contract_interaction_title] { // C?
                setText(label: controller.baseNaviTitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_contract_interaction_subtitle] { // C?
                setText(label: controller.descriptionLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_contract_interaction_contract_address_label] { // C81
                setText(label: controller.contractAddressTitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_contract_interaction_contract_address_config] { // C82
                setText(label: controller.contractAddressLabel, textConfig: textConfig, shouldReplaceText: false)
            }
            if let textConfig = sTextMap[.circlepw_contract_interaction_data_details] { // C83
                setText(label: controller.dataDetailsLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_contract_interaction_abi_function_label] { // C84
                setText(label: controller.abiFunctionTitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_contract_interaction_abi_function_config] { // C85
                setText(label: controller.abiFunctionLabel, textConfig: textConfig, shouldReplaceText: false)
            }
            if let textConfig = sTextMap[.circlepw_contract_interaction_abi_parameter_label] { // C86
                setText(label: controller.abiParameterTitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_contract_interaction_call_data_label] { // C87
                setText(label: controller.callDataTitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_contract_interaction_call_data_config] { // C88
                setText(label: controller.abiParameterLabel, textConfig: textConfig, shouldReplaceText: false)
                setText(label: controller.callDataLabel, textConfig: textConfig, shouldReplaceText: false)
            }
        }

        // MARK: UI Flow - Signature Request

        if let controller = controller as? SignatureRequestViewController {
            if let textConfig = sTextMap[.circlepw_signature_request_title] { // C91
                setText(label: controller.titleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_signature_request_contract_name] { // C92
                setText(label: controller.contractNameLabel, textConfig: textConfig, shouldReplaceText: false)
            }
            if let textConfig = sTextMap[.circlepw_signature_request_contract_url] { // C93
                setText(label: controller.contractURLLabel, textConfig: textConfig, shouldReplaceText: false)
            }
            if let textConfig = sTextMap[.circlepw_signature_request_subtitle] { // C94
                setText(label: controller.subtitleLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_signature_request_description] { // C95
                setText(label: controller.descriptionLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_signature_request_msg_config] { // C96
                setText(label: controller.messageLabel, textConfig: textConfig, shouldReplaceText: false)
            }
            if let textConfig = sTextMap[.circlepw_confirm] { // C45
                setText(button: controller.confirmButton, textConfig: textConfig)
            }
        }

        // MARK: UI Flow - Email OTP

        if let controller = controller as? EmailOTPViewController {
            if let textConfig = sTextMap[.circlepw_email_otp_title] { // C99
                setText(label: controller.baseNaviTitleLabel, textConfig: textConfig)
            }
            if let textConfig1 = sTextMap[.circlepw_email_otp_description],
               let textConfig2 = sTextMap[.circlepw_email_otp_email] { // C100, C101
                var textConfig = textConfig1
                if let text2 = textConfig2.text {
                    textConfig.text?.append(" ")
                    textConfig.text?.append(text2)
                }
                setText(label: controller.descriptionLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_email_otp_head_config] { // C102
                setText(label: controller.otpHeadLabel, textConfig: textConfig, shouldReplaceText: false)
            }
            if let textConfig = sTextMap[.circlepw_email_otp_dash] { // C103
                setText(label: controller.otpDashLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_email_otp_send_again_hint] { // C104
                setText(label: controller.sendAgainHintLabel, textConfig: textConfig)
            }
            if let textConfig = sTextMap[.circlepw_email_otp_send_again] { // C105
                setText(button: controller.sendAgainButton, textConfig: textConfig)
            }
        }
    }
}

extension RNWalletSdk {

    private func setText(label: UILabel, textConfig: TextConfig, shouldReplaceText: Bool = true) {
        if let text = textConfig.text, shouldReplaceText {
            label.text = text
        }
        if let textColor = textConfig.textColor {
            label.textColor = UIColor(textColor)
        }
        if let gradientColors = textConfig.gradientColors {
            let colors = gradientColors.map { UIColor($0) }
            label.setGradientTextColors(colors)
        }
        if let font = textConfig.font {
            let size = label.font.pointSize
            label.font = UIFont(name: font, size: size)
        }
    }

    private func setText(button: UIButton, textConfig: TextConfig) {
        if let text = textConfig.text {
            button.setTitle(text, for: .normal)
        }
        if let textColor = textConfig.textColor {
            button.setTitleColor(UIColor(textColor), for: .normal)
            button.setTitleColor(UIColor(textColor).withAlphaComponent(0.2), for: .highlighted)
        }
        if let gradientColors = textConfig.gradientColors {
            let colors = gradientColors.map { UIColor($0) }
            button.setGradientTextColors(colors)
        }
        if let font = textConfig.font,
           let size = button.titleLabel?.font.pointSize {
            button.titleLabel?.font = UIFont(name: font, size: size)
        }
    }

    private func setText(textField: UITextField,
                         textConfig: TextConfig?,
                         placeholderTextConfig: TextConfig?) {

        if let textColor = textConfig?.textColor {
            textField.textColor = UIColor(textColor)
        }
        if let font = textConfig?.font, let size = textField.font?.pointSize {
            textField.font = UIFont(name: font, size: size)
        }

        if let text = placeholderTextConfig?.text {
            textField.placeholder = text
        }
        if let textColor = placeholderTextConfig?.textColor {
            textField.placeholderColor(color: UIColor(textColor))
        }
    }
}

private extension UITextField {

    func placeholderColor(color: UIColor) {
        guard let placeholder = self.placeholder, let font = self.font else { return }
        let attributeString = [
            .foregroundColor: color,
            .font: font,
        ] as [NSAttributedString.Key: Any]
        self.attributedPlaceholder = NSAttributedString(string: placeholder, attributes: attributeString)
    }
}
