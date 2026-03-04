const { withDangerousMod } = require('@expo/config-plugins')
const fs = require('fs/promises')
const path = require('path')

/**
 * Simple Podfile modifier plugin for Circle SDK
 */
const withPodfileModifier = (config, options = {}) => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile',
      )

      try {
        let content = await fs.readFile(podfilePath, 'utf8')

        // Add Circle sources if not exists
        if (!content.includes('github.com/circlefin/w3s-ios-sdk.git')) {
          content =
            `source 'https://github.com/circlefin/w3s-ios-sdk.git'\n` + content
        }
        if (!content.includes('github.com/CocoaPods/Specs.git')) {
          content =
            `source 'https://github.com/CocoaPods/Specs.git'\n` + content
        }

        // Add static frameworks with dynamic exceptions configuration
        if (!content.includes('dynamic_frameworks')) {
          const frameworksConfig = `
  # Dynamic frameworks configuration
  dynamic_frameworks = ['GoogleSignIn', 'FBSDKLoginKit', 'AppAuth', 'GTMAppAuth', 'GTMSessionFetcher']

  pre_install do |installer|
    installer.pod_targets.each do |target|
      if dynamic_frameworks.include?(target.name)
        def target.build_type
          Pod::BuildType.dynamic_framework
        end
      end
    end
  end`

          // Insert after target declaration
          content = content.replace(
            /(target ['"][^'"]*['"] do)/,
            `$1${frameworksConfig}`,
          )

          // Find the last use_frameworks! line and add our static override after it
          const useFrameworksRegex = /use_frameworks!.*\n/g
          let lastMatch
          let match
          while ((match = useFrameworksRegex.exec(content)) !== null) {
            lastMatch = match
          }

          if (lastMatch) {
            const position = lastMatch.index + lastMatch[0].length
            content =
              content.slice(0, position) +
              '  # Override to use static frameworks (added by Circle SDK plugin)\n' +
              '  use_frameworks! :linkage => :static\n' +
              content.slice(position)
          }
        }

        await fs.writeFile(podfilePath, content, 'utf8')
        console.log('✅ Podfile automatically modified')
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error
        }
        // Podfile doesn't exist, skip modification
      }

      return config
    },
  ])
}

module.exports = withPodfileModifier
