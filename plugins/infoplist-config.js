const { withInfoPlist } = require('@expo/config-plugins')

/**
 * Config plugin to set Info.plist values for Circle SDK
 * Reads values from environment variables or options
 */
const withInfoPlistConfig = (config, options = {}) => {
  return withInfoPlist(config, config => {
    const infoPlist = config.modResults

    // Initialize CFBundleURLTypes if not exists
    if (!infoPlist.CFBundleURLTypes) {
      infoPlist.CFBundleURLTypes = []
    }

    // Facebook configuration
    const facebookAppId = options.facebookAppId || process.env.IOS_FACEBOOK_APP_ID
    if (facebookAppId) {
      infoPlist.FacebookAppID = facebookAppId

      // Add Facebook URL Scheme: fb{app-id}
      const facebookUrlScheme = `fb${facebookAppId}`
      const hasFacebookScheme = infoPlist.CFBundleURLTypes.some(urlType =>
        urlType.CFBundleURLSchemes?.includes(facebookUrlScheme)
      )

      if (!hasFacebookScheme) {
        infoPlist.CFBundleURLTypes.push({
          CFBundleURLSchemes: [facebookUrlScheme]
        })
        console.log(`✅ Added Facebook URL Scheme: ${facebookUrlScheme}`)
      }
    }

    if (options.facebookClientToken || process.env.IOS_FACEBOOK_CLIENT_TOKEN) {
      infoPlist.FacebookClientToken =
        options.facebookClientToken || process.env.IOS_FACEBOOK_CLIENT_TOKEN
    }
    if (options.facebookDisplayName || process.env.IOS_FACEBOOK_DISPLAY_NAME) {
      infoPlist.FacebookDisplayName =
        options.facebookDisplayName || process.env.IOS_FACEBOOK_DISPLAY_NAME
    }

    // Google configuration
    const googleClientId = options.googleClientId || process.env.IOS_GOOGLE_CLIENT_ID
    if (googleClientId) {
      infoPlist.GIDClientID = googleClientId

      // Add Google Reversed Client ID URL Scheme
      // Convert: "123-abc.apps.googleusercontent.com" -> "com.googleusercontent.apps.123-abc"
      const reversedClientId = googleClientId.split('.').reverse().join('.')

      // Check if Google URL scheme already exists
      const hasGoogleScheme = infoPlist.CFBundleURLTypes.some(urlType =>
        urlType.CFBundleURLSchemes?.includes(reversedClientId)
      )

      if (!hasGoogleScheme) {
        infoPlist.CFBundleURLTypes.push({
          CFBundleURLSchemes: [reversedClientId]
        })
        console.log(`✅ Added Google Reversed Client ID URL Scheme: ${reversedClientId}`)
      }
    }

    // Apple Sign In - No URL Scheme needed
    // Apple Sign In uses entitlements only (handled by apple-signin-entitlements plugin)

    // Face ID configuration (hard coded)
    infoPlist.NSFaceIDUsageDescription = 'Enable Biometrics PIN'

    console.log('✅ Info.plist configuration updated')
    return config
  })
}

module.exports = withInfoPlistConfig
