
const fs = require('fs');
const path = require('path');

const pytorchAndroidDir = path.join(process.cwd(), 'node_modules', 'react-native-pytorch-core', 'android');

// 1. Sửa build.gradle của PyTorch
const gradlePath = path.join(pytorchAndroidDir, 'build.gradle');
if (fs.existsSync(gradlePath)) {
    console.log('🩹 Patching PyTorch build.gradle (Deterministic Version 2)...');
    
    const newContent = `/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import groovy.json.JsonSlurper
import org.apache.tools.ant.filters.ReplaceTokens

def parseAppRnVersion() {
   def inputFile = new File(rootDir, '../node_modules/react-native/package.json')
   def json = new JsonSlurper().parseText(inputFile.text)
   return json.version as String
}

def (appRnMajorVersion, appRnMinorVersion, appRnPatchVersion) = parseAppRnVersion().tokenize('.')

buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath "com.android.tools.build:gradle:8.2.1"
  }
}

apply plugin: "com.android.library"

def safeExtGet(prop, fallback) {
    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}

configurations {
    extractHeaders
    extractJNI
    extractForNativeBuild
}

android {
  compileSdkVersion 34
  buildToolsVersion "34.0.0"
  
  defaultConfig {
    minSdkVersion 24
    targetSdkVersion 34
    versionCode 1
    versionName "1.0"
    testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    
    packaging {
      resources {
        excludes += ["**/libc++_shared.so", "**/libreactnativeutilsjni.so", "**/libfbjni.so", "META-INF/MANIFEST.MF"]
      }
      pickFirst "**/*.so"
    }

    externalNativeBuild {
      cmake {
        cppFlags "-fexceptions", "-frtti", "-std=c++1y", "-DONANDROID"
        abiFilters 'x86', 'x86_64', 'armeabi-v7a', 'arm64-v8a'
        arguments '-DANDROID_STL=c++_shared', "-DNODE_MODULES_DIR=\${rootDir}/../node_modules", "-DREACT_NATIVE_MINOR_VERSION=\${appRnMinorVersion}"
      }
    }
  }

  buildTypes {
    release {
      minifyEnabled false
    }
  }
  
  lintOptions {
    disable 'GradleCompatible'
  }
  
  compileOptions {
    sourceCompatibility JavaVersion.VERSION_1_8
    targetCompatibility JavaVersion.VERSION_1_8
  }
  
  externalNativeBuild {
    cmake {
      path "CMakeLists.txt"
    }
  }

  packaging {
    resources {
      excludes += ["**/libc++_shared.so", "**/libreactnativeutilsjni.so", "**/libfbjni.so", "META-INF/MANIFEST.MF"]
    }
  }
}

repositories {
    google()
    mavenCentral()
    maven {
        url("\${rootDir}/../node_modules/react-native/android")
    }
}

dependencies {
  def pytorchLiteVersion = '1.12.2'
  implementation "org.pytorch:pytorch_android_lite:\${pytorchLiteVersion}"
  
  def fbjniVersion = '0.5.1'
  implementation "com.facebook.fbjni:fbjni:\${fbjniVersion}"
  extractHeaders("com.facebook.fbjni:fbjni:\${fbjniVersion}")

  api "com.facebook.react:react-native:+"

  // extractHeaders bypassed
  // extractJNI bypassed

  extractForNativeBuild("org.pytorch:pytorch_android_lite:\${pytorchLiteVersion}")

  implementation "androidx.appcompat:appcompat:1.2.0"
  implementation "androidx.constraintlayout:constraintlayout:2.1.4"
  implementation "androidx.coordinatorlayout:coordinatorlayout:1.1.0"
  implementation "androidx.cardview:cardview:1.0.0"
  
  testImplementation 'junit:junit:4.12'
  testImplementation 'org.json:json:20140107'
  testImplementation 'org.mockito:mockito-core:1.10.19'

  androidTestImplementation 'junit:junit:4.12'
  androidTestImplementation 'androidx.test:core:1.3.0'
  androidTestImplementation 'androidx.test:runner:1.3.0'
  androidTestImplementation 'androidx.test:rules:1.3.0'
  androidTestImplementation 'com.facebook.soloader:soloader:0.9.0'

  def cameraxVersion = "1.1.0-alpha05"
  implementation "androidx.camera:camera-core:\${cameraxVersion}"
  implementation "androidx.camera:camera-camera2:\${cameraxVersion}"
  implementation "androidx.camera:camera-lifecycle:\${cameraxVersion}"
  implementation "androidx.camera:camera-view:1.0.0-alpha25"
}

task extractAARHeaders {
  doLast {
    project.configurations.extractHeaders.getFiles().each {
      def file = it.absoluteFile
      copy {
        from zipTree(file)
        into "\$buildDir/\$file.name"
        include "**/*.h"
      }
    }
  }
}

task extractJNIFiles {
  doLast {
    project.configurations.extractJNI.getFiles().each {
      def file = it.absoluteFile
      copy {
        from zipTree(file)
        into "\$buildDir/\$file.name"
        include "jni/**/*"
      }
    }
  }
}

task extractAARForNativeBuild {
  doLast {
    project.configurations.extractForNativeBuild.getFiles().each {
      def file = it.absoluteFile
      copy {
        from zipTree(file)
        into "\$buildDir/\$file.name"
        include "headers/**"
        include "jni/**"
      }
    }
  }
}

def configureCMakeTaskName = Integer.parseInt(appRnMinorVersion) < 68 ? "externalNativeBuild" : "configureCMake"
tasks.whenTaskAdded { task ->
  if (task.name.contains(configureCMakeTaskName)) {
    task.dependsOn(extractAARHeaders)
    task.dependsOn(extractJNIFiles)
    task.dependsOn(extractAARForNativeBuild)
  }
}
`;

    fs.writeFileSync(gradlePath, newContent);
    console.log('✅ Deterministic PyTorch build.gradle patch applied!');
}

// 2. Sửa CMakeLists.txt
const cmakePath = path.join(pytorchAndroidDir, 'CMakeLists.txt');
if (fs.existsSync(cmakePath)) {
    console.log('🩹 Patching PyTorch CMakeLists.txt...');
    let content = fs.readFileSync(cmakePath, 'utf8');
    
    // We must use actual newlines, not escaped characters that might be misinterpreted
    if (!content.includes('project(torchlive)')) {
        content = 'cmake_minimum_required(VERSION 3.4.1)\nproject(torchlive)\n' + content;
    }
    
    // Vô hiệu hóa việc tìm kiếm các thư viện JNI cũ (vốn đã có sẵn trong RN mới)
    content = content.replace(/find_library\([^]*?FBJNI_LIBRARY[^]*?\)/g, 'set(FBJNI_LIBRARY "")');
    content = content.replace(/find_library\([^]*?JSI_LIB[^]*?\)/g, 'set(JSI_LIB "")');
    content = content.replace(/find_library\([^]*?REACT_NATIVE_JNI_LIB[^]*?\)/g, 'set(REACT_NATIVE_JNI_LIB "")');
    
    // Fix include paths for React Native 0.73+
    const newIncludePath = '"${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/jni/react/turbomodule"';
    if (!content.includes('jni/react/turbomodule')) {
       console.log('  Adding TurboModule include path...');
       // Replace the last item in the list or insert before closing parenthesis
       // We look for "src/main/cpp" which is usually the last entry before closing bracket
       const targetStr = '"src/main/cpp"';
       if (content.includes(targetStr)) {
           content = content.replace(
               targetStr,
               targetStr + '\n        ' + newIncludePath
           );
           console.log('  Successfully patched Include paths.');
       } else {
           console.log('  WARNING: Could not find insertion point for TurboModule include path.');
       }
    }

    // Fix FBJNI header search path
    if (content.includes('fbjni-*-headers.jar')) {
         const fbjniPatch = `
file (GLOB LIBFBJNI_INCLUDE_DIR "\${BUILD_DIR}/fbjni-*/headers")
if (NOT LIBFBJNI_INCLUDE_DIR)
    file (GLOB LIBFBJNI_INCLUDE_DIR "\${BUILD_DIR}/fbjni-*/include")
endif()
message(STATUS " [Patch] BUILD_DIR: \${BUILD_DIR}")
message(STATUS " [Patch] LIBFBJNI_INCLUDE_DIR: \${LIBFBJNI_INCLUDE_DIR}")
file(GLOB_RECURSE FBJNI_FILES "\${BUILD_DIR}/fbjni-*/*")
if(NOT LIBFBJNI_INCLUDE_DIR)
    message(WARNING " [Patch] Could not find fbjni headers! Searching build dir...")
    foreach(f \${FBJNI_FILES})
        if(f MATCHES "fbjni.h")
            message(STATUS " [Patch] Found fbjni.h at: \${f}")
        endif()
    endforeach()
endif()
`;
         content = content.replace(
             /file\s*\(GLOB\s*LIBFBJNI_INCLUDE_DIR\s*"\${BUILD_DIR}\/fbjni-\*-headers\.jar\/"\)/,
             fbjniPatch
         );
         // Also handle the case where we already replaced it partially in previous attempts if needed, 
         // but regex above is safer for targeting the original or slightly modified line if it matches.
         // Let's stick to replacing the original pattern or our previous replaced pattern if safe.
         // Since I previously replaced it with 'fbjni-*/headers', I should target that too.
         
         if (content.includes('fbjni-*/headers')) {
             // It was already patched previously, let's refine it with the debug block
              content = content.replace(
                 'file (GLOB LIBFBJNI_INCLUDE_DIR "${BUILD_DIR}/fbjni-*/headers")',
                 fbjniPatch
             );
         } else {
             // Fallback for fresh file
             content = content.replace(
                 'file (GLOB LIBFBJNI_INCLUDE_DIR "${BUILD_DIR}/fbjni-*-headers.jar/")',
                 fbjniPatch
             );
         }
         
         console.log('  Fixed FBJNI header glob & added Cmake debugging.');
    }

    fs.writeFileSync(cmakePath, content);
}

console.log('✅ Final PyTorch native patches applied!');
