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

extension UIView {

    func setGradientTextColors(_ colors: [UIColor]) {

        func getGradientLayer(bounds: CGRect, colors: [UIColor]) -> CAGradientLayer {
            let gradient = CAGradientLayer()
            gradient.frame = bounds
            gradient.colors = colors.map { $0.cgColor }
            gradient.startPoint = CGPoint(x: 0.0, y: 0.5)
            gradient.endPoint = CGPoint(x: 1.0, y: 0.5)
            return gradient
        }

        func gradientColor(bounds: CGRect, gradientLayer: CAGradientLayer) -> UIColor? {
            guard bounds.width != 0, bounds.height != 0 else { return nil }
            UIGraphicsBeginImageContext(gradientLayer.bounds.size)
            gradientLayer.render(in: UIGraphicsGetCurrentContext()!)
            let image = UIGraphicsGetImageFromCurrentImageContext()
            UIGraphicsEndImageContext()
            return UIColor(patternImage: image!)
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            if let textView = self as? UITextView {
                let gradientLayer = getGradientLayer(bounds: self.bounds, colors: colors)
                let gradientColor = gradientColor(bounds: self.bounds, gradientLayer: gradientLayer)
                textView.textColor = gradientColor

            } else if let label = self as? UILabel {
                let bounds = CGRect(origin: .zero, size: label.intrinsicContentSize)
                let gradientLayer = getGradientLayer(bounds: bounds, colors: colors)
                let gradientColor = gradientColor(bounds: bounds, gradientLayer: gradientLayer)
                label.textColor = gradientColor

            } else if let button = self as? UIButton, let bounds = button.titleLabel?.bounds {
                let gradientLayer = getGradientLayer(bounds: bounds, colors: colors)
                let gradientColor = gradientColor(bounds: bounds, gradientLayer: gradientLayer)
                button.setTitleColor(gradientColor, for: .normal)
                button.setTitleColor(gradientColor?.withAlphaComponent(0.2), for: .highlighted)
            }
        }
    }
}
