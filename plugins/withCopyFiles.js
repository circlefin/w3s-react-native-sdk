/**
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

const {
  withXcodeProject,
  withProjectBuildGradle,
} = require('@expo/config-plugins')
const fs = require('fs')
const path = require('path')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function copyFile(srcPath, dstPath, overwrite = true) {
  ensureDir(path.dirname(dstPath))
  if (!overwrite && fs.existsSync(dstPath)) {
    console.log(`[withCopyFiles] Skipped (exists): ${dstPath}`)
    return
  }
  fs.copyFileSync(srcPath, dstPath)
  console.log(`[withCopyFiles] Copied: ${srcPath} -> ${dstPath}`)
}

function normalizeRelativePath(relativePath) {
  return relativePath.split(path.sep).join('/')
}

function copyDirRecursive(
  srcDir,
  dstDir,
  overwrite = true,
  excludeFiles = [],
  relativeDir = '',
) {
  if (!fs.existsSync(srcDir)) return
  const entries = fs.readdirSync(srcDir, { withFileTypes: true })
  for (const entry of entries) {
    const s = path.join(srcDir, entry.name)
    const d = path.join(dstDir, entry.name)
    const relativePath = normalizeRelativePath(path.join(relativeDir, entry.name))

    // Skip excluded file paths (relative to platform source root)
    if (excludeFiles.includes(relativePath)) {
      console.log(`[withCopyFiles] Skipped (excluded): ${s}`)
      continue
    }

    if (entry.isDirectory()) {
      copyDirRecursive(s, d, overwrite, excludeFiles, relativePath)
    } else {
      copyFile(s, d, overwrite)
    }
  }
}

function runCopyPlatform(
  config,
  { sourceDir, overwrite, platform, excludeFiles = [] },
) {
  const projectRoot = config.modRequest.projectRoot

  // Expect source layout:
  //   <sourceDir>/
  //     android/  -> will sync into <projectRoot>/android/
  //     ios/      -> will sync into <projectRoot>/ios/
  const srcRoot = path.resolve(projectRoot, sourceDir, platform)
  const dstRoot = path.resolve(projectRoot, platform)

  if (!fs.existsSync(srcRoot)) {
    console.log(`[withCopyFiles] No ${platform} source folder: ${srcRoot}`)
    return config
  }

  try {
    console.log(`[withCopyFiles] Syncing ${platform}…`)
    copyDirRecursive(srcRoot, dstRoot, overwrite, excludeFiles)
  } catch (error) {
    error.message = `[withCopyFiles] Error during file synchronization for ${platform}: ${error.message}`
    throw error
  }
  return config
}

const withCopyFiles = (
  config,
  { sourceDir = 'prebuild-sync-src', overwrite = true } = {},
) => {
  // iOS
  config = withXcodeProject(config, cfg => {
    console.log('[withCopyFiles] iOS stage (withXcodeProject)')
    return runCopyPlatform(cfg, { sourceDir, overwrite, platform: 'ios' })
  })

  // Android
  config = withProjectBuildGradle(config, cfg => {
    console.log('[withCopyFiles] Android stage (withProjectBuildGradle)')

    const projectRoot = cfg.modRequest.projectRoot
    const dstBuildGradle = path.resolve(projectRoot, 'android', 'build.gradle')
    const srcBuildGradle = path.resolve(
      projectRoot,
      sourceDir,
      'android',
      'build.gradle',
    )

    // Special handling for build.gradle: update modResults.contents instead of direct file copy
    if (fs.existsSync(srcBuildGradle)) {
      if (!overwrite && fs.existsSync(dstBuildGradle)) {
        console.log(`[withCopyFiles] Skipped (exists): ${dstBuildGradle}`)
      } else {
        const buildGradleContents = fs.readFileSync(srcBuildGradle, 'utf8')
        cfg.modResults.contents = buildGradleContents
        console.log(
          `[withCopyFiles] Updated build.gradle contents from: ${srcBuildGradle}`,
        )
      }
    }

    // Copy other Android files (excluding build.gradle which is handled above)
    return runCopyPlatform(cfg, {
      sourceDir,
      overwrite,
      platform: 'android',
      excludeFiles: ['build.gradle'],
    })
  })

  return config
}

module.exports = withCopyFiles
