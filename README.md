# Circle User-Controlled Wallets React Native SDK

> SDK for integrating Circle's user-controlled wallet into React Native applications

> [!IMPORTANT]
> This SDK supports both Expo and bare React Native projects. Select the appropriate guide based on your project type.
>
> - **Bare React Native** (manages native code manually) → Go to [Bare React Native Integration Guide](./BARE_REACT_NATIVE_GUIDE.md)
> - **Expo project** (uses `expo prebuild` and has `app.json`/`app.config.js`) ↓ Continue below

---

## Migrating from SDK v1 (Bare React Native)

If you have an existing bare React Native project using SDK v1 and want to upgrade to SDK v2, see the [SDK v1 Migration Guide](https://github.com/circlefin/w3s-react-native-sample-app-wallets/blob/master/MIGRATION_GUIDE.md).

You can also find the SDK v1 sample app in the sample app repository's [sdk-v1 branch](https://github.com/circlefin/w3s-react-native-sample-app-wallets/tree/sdk-v1).

## System Requirements

| Platform     | Minimum Version | Recommended Version |
| ------------ | --------------- | ------------------- |
| React Native | 0.60+           | 0.76-0.81           |
| iOS          | 15.1+           | iOS 17+             |
| Android      | API 21+         | API 33+             |
| Expo SDK     | 49+             | 53+                 |

## Installation

> [!IMPORTANT]
> **Prerequisites**: This SDK uses native modules and requires a [development build](https://docs.expo.dev/develop/development-builds/introduction). Expo Go is not supported.

Follow these steps in order. The SDK will be fully configured after running `expo prebuild`.

#### Step 1: Generate Native Projects (Skip if `android`/`ios` Already Exist)

If you don't have `android/` and `ios/` directories yet, generate them:

```shell
npx expo prebuild
```

#### Step 2: Install the SDK Package

```shell
npx expo install @circle-fin/w3s-pw-react-native-sdk
```

#### Step 3: Configure app.json

Add both required plugins to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "@circle-fin/w3s-pw-react-native-sdk/plugins/withCopyFiles",
        {
          "sourceDir": "prebuild-sync-src",
          "targetDir": ".",
          "overwrite": true
        }
      ],
      "@circle-fin/w3s-pw-react-native-sdk/plugins/podfile-modifier"
    ]
  }
}
```

**What these plugins do:**

- `withCopyFiles`: Preserves your Android/iOS configurations across rebuilds
- `podfile-modifier`: Automatically configures iOS Podfile for Circle SDK

> [!TIP]
> Prefer manual setup? Skip `podfile-modifier` and follow the [iOS configuration](./BARE_REACT_NATIVE_GUIDE.md#step-3-configure-ios) in the **Bare React Native Integration Guide** after prebuild.

<details>
<summary><strong>Learn more about withCopyFiles plugin</strong></summary>

The `withCopyFiles` plugin copies files from a source directory to your native project during prebuild, ensuring custom configurations are preserved.

**Directory structure example:**

```
prebuild-sync-src/
├── android/
│   └── build.gradle
└── ios/
    └── YourApp/Resources/
        ├── CirclePWLocalizable.strings
        └── CirclePWTheme.json
```

During `expo prebuild`, files from `prebuild-sync-src/android` → `android/` and `prebuild-sync-src/ios` → `ios/`.

**Options:**

| Option      | Default             | Description                                   |
| ----------- | ------------------- | --------------------------------------------- |
| `sourceDir` | `prebuild-sync-src` | Root directory with android/ and ios/ folders |
| `overwrite` | `true`              | Whether to overwrite existing files           |

**Note:** This solves the problem of `expo prebuild --clean` erasing manual changes.

</details>

#### Step 4: Configure Android Repository

> [!NOTE]
> The SDK depends on `w3s-android-sdk` hosted on GitHub Gradle registry, which requires authentication.

**4.1** Create `.env` in project root with your GitHub credentials:

```bash
PWSDK_MAVEN_URL=https://maven.pkg.github.com/circlefin/w3s-android-sdk
PWSDK_MAVEN_USERNAME=<YOUR_GITHUB_USERNAME>
PWSDK_MAVEN_PASSWORD=<YOUR_GITHUB_PAT>
```

Get a [Personal Access Token](https://github.com/settings/tokens) with `read:packages` permission.

**4.2** Add to `android/build.gradle` (project-level) in the `repositories` block:

```gradle
repositories {
  // Keep your other repositories here
  // google()
  // mavenCentral()

  maven {
    url System.getenv('PWSDK_MAVEN_URL')
    credentials {
      username System.getenv('PWSDK_MAVEN_USERNAME')
      password System.getenv('PWSDK_MAVEN_PASSWORD')
    }
  }
}
```

#### Step 5: Create Sync Directory Structure

Create `prebuild-sync-src/` folder and copy your modified Android files:

```shell
mkdir -p prebuild-sync-src/android
cp android/build.gradle prebuild-sync-src/android/
```

> [!IMPORTANT]
> Place all manual Android/iOS changes in `prebuild-sync-src/` to preserve them across rebuilds.

#### Step 6: Generate Native Code

```shell
npx expo prebuild --clean
```

This command generates native directories and applies all configurations automatically.

> [!TIP]
> **Verify iOS Configuration:** Check if the Circle SDK repository was added correctly:
>
> ```shell
> cat ios/Podfile | grep "circlefin"
> ```
>
> Expected output: `source 'https://github.com/circlefin/w3s-ios-sdk.git'`

#### Step 7: Install iOS Dependencies

```shell
cd ios && pod install && cd ..
```

#### Step 8: Build and Run

**Local development:**

For iOS:

```shell
npx expo run:ios
```

For Android:

```shell
npx expo run:android
```

**EAS Build:**

First, install EAS CLI globally (one-time setup):

```shell
npm install -g eas-cli
```

Then build your app:

```shell
eas build --profile development --platform all
```

> [!TIP]
> **EAS Setup**: Add secrets `PWSDK_MAVEN_USERNAME` and `PWSDK_MAVEN_PASSWORD` to your EAS project. [Learn more](https://docs.expo.dev/build-reference/variables/)

---

## Additional Resources

**Circle Resources:**

- [User-Controlled Wallets Documentation](https://developers.circle.com/wallets/user-controlled) - Product overview and architecture
- [React Native SDK Documentation](https://developers.circle.com/wallets/user-controlled/react-native-sdk) - Complete API reference
- [UI Customization API](https://developers.circle.com/wallets/user-controlled/react-native-sdk-ui-customization-api) - Theming and localization options
- [React Native Sample App](https://github.com/circlefin/w3s-react-native-sample-app-wallets) - Working Expo sample app with integration guide
- [SDK v1 Migration Guide](https://github.com/circlefin/w3s-react-native-sample-app-wallets/blob/master/MIGRATION_GUIDE.md) - Complete guide for upgrading from bare React Native + SDK v1 to Expo Modules + SDK v2

**Expo Resources:**

- [Expo Development Build](https://docs.expo.dev/development/build/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
