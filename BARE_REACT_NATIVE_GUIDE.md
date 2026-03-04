# Bare React Native Integration Guide

This guide provides step-by-step instructions for integrating the Circle User-Controlled Wallets SDK into a **bare React Native** project (projects created with `npx react-native init`, without Expo).

> [!NOTE]
> **Expo users**: If you prefer manual iOS configuration instead of using the `podfile-modifier` plugin, you can also follow this guide. However, be aware that `expo prebuild` regenerates files, requiring manual reapplication of changes.

## System Requirements

- React Native 0.60+ (recommended 0.76-0.81)
- Node.js 16+ and npm/yarn
- Android API 21+ (recommended API 33+)
- iOS 15.1+ (recommended iOS 17+)
- CocoaPods (for iOS projects)

> [!NOTE]
> For React Native 0.82+, the `install-expo-modules` tool may not yet have version mappings available. In this case, you can manually install Expo by running `npm install expo` and following [Expo's manual installation guide](https://docs.expo.dev/bare/installing-expo-modules/).

## Installation Steps

### Step 1: Install Dependencies

Install the SDK package through npm:

```bash
npm install @circle-fin/w3s-pw-react-native-sdk
```

or yarn:

```bash
yarn add @circle-fin/w3s-pw-react-native-sdk
```

Then install Expo modules:

```bash
npx install-expo-modules@latest
```

> [!NOTE]
>
> - This command automatically installs `expo-modules-core` and configures:
>   - iOS Podfile autolinking scripts
>   - Android Gradle settings (`settings.gradle`)
>   - Metro bundler configuration
>   - Babel configuration
> - The SDK uses Expo Modules architecture for cross-platform compatibility
> - These dependencies are lightweight and do not add Expo-specific features to your app bundle
> - [Learn more about installing Expo modules in bare React Native](https://docs.expo.dev/bare/installing-expo-modules/)

### Step 2: Configure Android

#### 2.1 Configure Circle SDK Maven Repository

> [!NOTE]
> The SDK depends on `w3s-android-sdk` hosted on GitHub Gradle registry, which requires authentication.

**Create `android/local.properties`** with your GitHub credentials:

```properties
pwsdk.maven.url=https://maven.pkg.github.com/circlefin/w3s-android-sdk
pwsdk.maven.username=<YOUR_GITHUB_USERNAME>
pwsdk.maven.password=<YOUR_GITHUB_PAT>
```

Get a [Personal Access Token](https://github.com/settings/tokens) with `read:packages` permission.

> [!WARNING]
> **Security**: Make sure `local.properties` is in your `.gitignore` since it contains credentials and shouldn't be committed to version control.

**Add to `android/build.gradle`** (project-level):

<details>
<summary><strong>Groovy (build.gradle)</strong></summary>

```gradle
// --- Add imports at the top of the file ---
import java.util.Properties
import java.io.File

// --- Add inside your repositories block ---
allprojects {
  repositories {
    // Keep your other repositories here
    // google()
    // mavenCentral()

    maven {
      // Load credentials from local.properties (not committed to VCS)
      def localPropertiesFile = new File(rootDir, "local.properties")
      if (!localPropertiesFile.exists()) {
        throw new GradleException(
          "local.properties file not found. Please create it in the project root directory " +
          "with your GitHub credentials (pwsdk.maven.url, pwsdk.maven.username, pwsdk.maven.password)"
        )
      }
      
      Properties properties = new Properties()
      properties.load(localPropertiesFile.newDataInputStream())

      // Private Maven repo URL and basic auth credentials
      url properties.getProperty('pwsdk.maven.url')
      credentials {
        username properties.getProperty('pwsdk.maven.username')
        password properties.getProperty('pwsdk.maven.password')
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Kotlin (build.gradle.kts)</strong></summary>

```kotlin
// --- Add imports at the top of the file ---
import java.util.Properties
import java.io.File

// --- Add inside your repositories block ---
allprojects {
  repositories {
    // Keep your other repositories here
    // google()
    // mavenCentral()

    maven {
      // Load credentials from local.properties (not committed to VCS)
      val localPropertiesFile = File(rootDir, "local.properties")
      if (!localPropertiesFile.exists()) {
        throw GradleException(
          "local.properties file not found. Please create it in the project root directory " +
          "with your GitHub credentials (pwsdk.maven.url, pwsdk.maven.username, pwsdk.maven.password)"
        )
      }
      
      val props = Properties().apply {
        load(localPropertiesFile.inputStream())
      }

      // Private Maven repo URL and basic auth credentials
      url = uri(props.getProperty("pwsdk.maven.url"))
      credentials {
        username = props.getProperty("pwsdk.maven.username")
        password = props.getProperty("pwsdk.maven.password")
      }
    }
  }
}
```

</details>

#### 2.2 Verify Expo Modules Configuration (Optional)

Verify that `npx install-expo-modules@latest` configured the following. If any configurations are missing, add them manually or see the [Expo Modules Installation Guide](https://docs.expo.dev/bare/installing-expo-modules/) for details.

`android/settings.gradle` should include:

```gradle
apply from: new File(["node", "--print", "require.resolve('expo/package.json')"].execute(null, rootDir).text.trim(), "../scripts/autolinking.gradle")
useExpoModules()
```

`android/app/build.gradle` should include:

```gradle
apply from: new File(["node", "--print", "require.resolve('expo/package.json')"].execute(null, rootDir).text.trim(), "../scripts/autolinking.gradle")
```

### Step 3: Configure iOS

This section provides manual iOS Podfile configuration. You may need to adjust these settings or merge with your existing Podfile configuration.

> [!IMPORTANT]
> **If using `expo prebuild`**: The Podfile will be regenerated each time you run `expo prebuild --clean`. Manual changes must be reapplied after each rebuild, or use the `podfile-modifier` config plugin to automate this.

**Step 1:** Add the spec repository sources and require Expo autolinking at the top of your `ios/Podfile`:

```ruby
source 'https://github.com/circlefin/w3s-ios-sdk.git'
source 'https://github.com/CocoaPods/Specs.git'

require File.join(File.dirname(`node --print "require.resolve('expo/package.json')"`), "scripts/autolinking")
require File.join(File.dirname(`node --print "require.resolve('react-native/package.json')"`), "scripts/react_native_pods")

platform :ios, '15.1'
```

**Step 2:** Configure static linkage with dynamic framework exceptions (inside your target block):

```ruby
# Prepare React Native project (add before target block)
prepare_react_native_project!

target 'YourAppName' do
  # Enable Expo Modules autolinking (required for SDK)
  use_expo_modules!

  # Get native modules configuration
  config = use_native_modules!

  # Configure static frameworks (required for Circle SDK)
  use_frameworks! :linkage => :static

  # Configure dynamic frameworks exceptions (exceptions to static framework rule)
  dynamic_frameworks = ['GoogleSignIn', 'FBSDKLoginKit', 'AppAuth', 'GTMAppAuth', 'GTMSessionFetcher']

  pre_install do |installer|
    installer.pod_targets.each do |target|
      if dynamic_frameworks.include?(target.name)
        def target.build_type
          Pod::BuildType.dynamic_framework
        end
      end
    end
  end

  # React Native configuration
  use_react_native!(
    :path => config[:reactNativePath],
    # Add other React Native options as needed
  )
end
```

**Step 3:** (Optional) Add the post-install hook for build settings:

> [!TIP]
> This step is primarily for **bare React Native projects**. If you encounter build issues such as architecture mismatches, module stability warnings, or deployment target version conflicts, add this configuration. If your project already has a `post_install` hook, merge these settings into it.

```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings["ONLY_ACTIVE_ARCH"] = "NO"
      config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
    end
  end
end
```

**Step 4:** Run `pod install`

```shell
cd ios && pod install && cd ..
```

### Step 4: Verify Configuration (Optional)

After running `npx install-expo-modules@latest`, these configurations should be set up automatically. Verify them and add manually if missing.

#### Verify Metro Bundler Configuration

`metro.config.js` should include:

```javascript
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

module.exports = config
```

#### Verify Babel Configuration

`babel.config.js` should include:

```javascript
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
  }
}
```

### Step 5: Run Your App

Build and run your app:

For iOS:

```bash
npx react-native run-ios
```

For Android:

```bash
npx react-native run-android
```

Learn more about [Running On Device](https://reactnative.dev/docs/running-on-device).

## Troubleshooting

### Installation Issues

**Issue**: `npx install-expo-modules@latest` fails with "Unable to find compatible Expo SDK version"

- **Cause**: This occurs when using a very recent React Native version (e.g., 0.82+) that hasn't been added to the `install-expo-modules` tool's version mapping yet.
- **Solution**:
  - Option 1: Use a tested React Native version (0.76-0.81) for the smoothest setup experience
  - Option 2: Manually install Expo modules:
    ```bash
    npm install expo
    ```
    Then follow [Expo's manual installation guide](https://docs.expo.dev/bare/installing-expo-modules/) to configure your iOS and Android projects.

**Issue**: `npx install-expo-modules@latest` fails with other errors

- **Solution**: Ensure Node.js 16+ is installed. Try clearing npm cache: `npm cache clean --force`

### Android Build Issues

**Issue**: `expo-modules-core` not found

- **Solution**:
  - Run `npx install-expo-modules@latest` again
  - Verify `android/settings.gradle` includes Expo autolinking configuration
  - Clean and rebuild: `cd android && ./gradlew clean && cd ..`

**Issue**: Maven repository authentication failed

- **Solution**:
  - Verify your `local.properties` file has correct GitHub credentials
  - Ensure your GitHub Personal Access Token has `read:packages` permission
  - Ensure the `local.properties` file is present in the `android/` directory for local builds. This file must be added to your project's `.gitignore` file to prevent committing credentials to version control.

**Issue**: Duplicate class errors

- **Solution**: Clean Gradle cache and rebuild:

  ```bash
  cd android
  ./gradlew clean
  cd ..
  ```

  If the issue persists, also clear the Gradle cache:

  ```bash
  rm -rf ~/.gradle/caches/
  ```

### iOS Build Issues

**Issue**: `ExpoModulesCore` pod not found

- **Solution**:
  - Run `npx install-expo-modules@latest` again
  - Ensure `require` statements are added at the top of Podfile
  - Run `pod repo update` then `pod install`
  - Delete `ios/Pods` and `ios/Podfile.lock`, then run `pod install` again

**Issue**: Static framework conflicts

- **Solution**: Ensure `use_frameworks! :linkage => :static` is configured correctly with dynamic framework exceptions as shown in Step 3

**Issue**: CocoaPods installation fails with Circle SDK repository error

- **Solution**:
  - Verify the Circle SDK repository source is added at the top of Podfile
  - Run `pod repo update`
  - Check your internet connection

**Issue**: Build fails with "Module 'ExpoModulesCore' not found"

- **Solution**:
  - Ensure `use_expo_modules!` is called in your Podfile before `use_react_native!`
  - Clean build folder in Xcode: Product → Clean Build Folder
  - Delete `ios/build` folder and rebuild

### Metro Bundler Issues

**Issue**: Module not found errors or cache issues

- **Solution**: Clear Metro cache:
  ```bash
  npx react-native start --reset-cache
  ```

**Issue**: "Unable to resolve module" errors

- **Solution**:
  - Ensure `metro.config.js` is configured correctly
  - Clear Metro cache and reinstall dependencies:
    ```bash
    rm -rf node_modules
    npm install
    npx react-native start --reset-cache
    ```
