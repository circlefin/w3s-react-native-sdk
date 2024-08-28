# @circle-fin/w3s-pw-react-native-sdk
React Native SDK for Circle Programmable Wallet
## Install NVM

Install Node Version Manager to use different versions of node and npm easily.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

> **Note:** See [nvm repo](https://github.com/nvm-sh/nvm) for the most updated instruction.

## Authenticate the npm registry

Create a Personal Access Token in your [GitHub setting](https://github.com/settings/tokens). Use `Configure SSO` button next to your created token to authorize `circlefin` organization. More instruction can be found [here](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens). Then, log in to `npm` on your terminal.

```bash
npm login --scope=@OWNER --registry=https://registry.npmjs.org
```
This will ask you to submit your GitHub personal access token as below.
Check below links for creating GitHub PAT:
- [Creating a fine-grained personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)
- [Creating a personal access token (classic)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)

```properties
npm notice Log in on https://registry.npmjs.org/
Username: <insert your GitHub username here>
Password: <insert your GitHub personal access token here>
```
## [Enable the New Architecture]((https://reactnative.dev/docs/new-architecture-app-intro#android---enable-the-new-architecture) )
The SDK is supporting both React Native old and [new architectures](https://reactnative.dev/docs/the-new-architecture/landing-page).
You can enable the new architecture by changing the project setting.
### Android
Update the `android/gradle.properties` file as follows:
```properties
newArchEnabled=true
```
### iOS
Reinstall your pods by running pod install with the right flag:
```shell
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
```
## Installation
### Using yarn
```shell
yarn add @circle-fin/w3s-pw-react-native-sdk
```
### Using npm
```shell
npm install @circle-fin/w3s-pw-react-native-sdk
```
## Link Native Dependencies
### Android
Add the maven repository to your `android/build.gradle`. It's suggested that load settings from `local.properties`:
```properties
repositories {
	...
	maven {
        	Properties properties = new Properties()
		// Load local.properties.
        	properties.load(new File(rootDir.absolutePath + "/local.properties").newDataInputStream())

		url properties.getProperty('pwsdk.maven.url')
		credentials {
        		username properties.getProperty('pwsdk.maven.username')
        		password properties.getProperty('pwsdk.maven.password')
		}
	}
}
```
Add the maven setting values in `local.properties` file.
```properties
pwsdk.maven.url=https://maven.pkg.github.com/circlefin/w3s-android-sdk
pwsdk.maven.username=<GITHUB_USERNAME>
# Fine-grained personal access tokens or classic with package write permission.
pwsdk.maven.password=<GITHUB_PAT>
```
### iOS
Add below links at tne top of `ios/Podfile`:
```ruby
source 'https://github.com/circlefin/w3s-ios-sdk.git'
source 'https://github.com/CocoaPods/Specs.git'

platform :ios, '13.4'
```
Declare dynamic link as below:
```ruby
target 'W3sSampleWallet' do
  use_frameworks!
end
```
And add the following `post_install` hook:
```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings["ONLY_ACTIVE_ARCH"] = "NO"
      config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.0'
    end
  end
end
```
## Run the Example
### Android
```bash
yarn example android
```
### iOS
```bash
yarn example ios
```
