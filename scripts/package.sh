#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

APP_NAME="Subber"
LOGO_PNG="public/logo.png"
BUILD_DIR="build"
ICONSET_DIR="$BUILD_DIR/icon.iconset"
ARTIFACT_MARKER=""

usage() {
  cat <<'EOF'
Uso:
  bash scripts/package.sh mac           Genera il .dmg in release/
  bash scripts/package.sh win           Genera il setup .exe in release/ (su Mac richiede Wine)
  bash scripts/package.sh android-init  Crea la cartella android/ la prima volta
  bash scripts/package.sh apk           Genera un APK debug
  bash scripts/package.sh all           Genera .dmg, .exe e APK debug
  bash scripts/package.sh clean         Rimuove release, build web e output APK
EOF
}

need_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Errore: manca '$1'."
    echo "$2"
    exit 1
  fi
}

ensure_node_deps() {
  need_command node "Installa Node.js LTS da https://nodejs.org/ oppure con Homebrew: brew install node"
  need_command npm "npm arriva insieme a Node.js."

  if [ ! -d node_modules ]; then
    echo "node_modules non trovato: installo le dipendenze..."
    npm install
  fi
}

java_major_version() {
  local java_bin="$1"
  local version
  version="$("$java_bin" -version 2>&1 | awk -F '"' '/version/ { print $2; exit }')"

  if [[ "$version" == 1.* ]]; then
    echo "$version" | cut -d. -f2
  else
    echo "$version" | cut -d. -f1
  fi
}

ensure_android_java() {
  local android_studio_java="/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/java"

  if [ -x "$android_studio_java" ]; then
    local studio_major
    studio_major="$(java_major_version "$android_studio_java")"

    if [ "$studio_major" -ge 17 ] && [ "$studio_major" -le 21 ]; then
      export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
      export PATH="$JAVA_HOME/bin:$PATH"
      echo "Uso JDK $studio_major incluso in Android Studio: $JAVA_HOME"
      return
    fi
  fi

  need_command java "Installa Android Studio oppure un JDK 17/21."

  local current_major
  current_major="$(java_major_version java)"

  if [ "$current_major" -lt 17 ] || [ "$current_major" -gt 21 ]; then
    echo "Errore: Gradle/Android non supporta il Java attivo per questa build."
    echo "Java attivo: $current_major"
    echo ""
    echo "Usa JDK 17 o il JDK incluso in Android Studio. Su macOS puoi provare:"
    echo "  export JAVA_HOME=\"/Applications/Android Studio.app/Contents/jbr/Contents/Home\""
    echo "  export PATH=\"\$JAVA_HOME/bin:\$PATH\""
    echo "  npm run package:apk"
    echo ""
    echo "Il tuo errore 'Unsupported class file major version 68' corrisponde a Java 24."
    exit 1
  fi
}

copy_base_icon() {
  mkdir -p "$BUILD_DIR"
  cp "$LOGO_PNG" "$BUILD_DIR/icon.png"
}

ensure_macos_icon() {
  copy_base_icon

  if [ "$(uname -s)" != "Darwin" ]; then
    return
  fi

  if [ -f "$BUILD_DIR/icon.icns" ]; then
    return
  fi

  need_command sips "sips e' incluso in macOS, ma qui non risulta disponibile."
  need_command iconutil "iconutil e' incluso in macOS, ma qui non risulta disponibile."

  rm -rf "$ICONSET_DIR"
  mkdir -p "$ICONSET_DIR"
  sips -z 16 16 "$LOGO_PNG" --out "$ICONSET_DIR/icon_16x16.png" >/dev/null
  sips -z 32 32 "$LOGO_PNG" --out "$ICONSET_DIR/icon_16x16@2x.png" >/dev/null
  sips -z 32 32 "$LOGO_PNG" --out "$ICONSET_DIR/icon_32x32.png" >/dev/null
  sips -z 64 64 "$LOGO_PNG" --out "$ICONSET_DIR/icon_32x32@2x.png" >/dev/null
  sips -z 128 128 "$LOGO_PNG" --out "$ICONSET_DIR/icon_128x128.png" >/dev/null
  sips -z 256 256 "$LOGO_PNG" --out "$ICONSET_DIR/icon_128x128@2x.png" >/dev/null
  sips -z 256 256 "$LOGO_PNG" --out "$ICONSET_DIR/icon_256x256.png" >/dev/null
  sips -z 512 512 "$LOGO_PNG" --out "$ICONSET_DIR/icon_256x256@2x.png" >/dev/null
  sips -z 512 512 "$LOGO_PNG" --out "$ICONSET_DIR/icon_512x512.png" >/dev/null
  sips -z 1024 1024 "$LOGO_PNG" --out "$ICONSET_DIR/icon_512x512@2x.png" >/dev/null
  iconutil -c icns "$ICONSET_DIR" -o "$BUILD_DIR/icon.icns"
  rm -rf "$ICONSET_DIR"
}

build_web() {
  echo "Creo la build web..."
  npm run build
}

absolute_path() {
  local file="$1"
  local dir
  dir="$(cd "$(dirname "$file")" && pwd)"
  printf "%s/%s\n" "$dir" "$(basename "$file")"
}

print_matching_artifacts() {
  local title="$1"
  local directory="$2"
  local pattern="$3"
  local found=0

  echo ""
  echo "$title"

  if [ ! -d "$directory" ]; then
    echo "  Nessun file trovato: $directory non esiste."
    return
  fi

  if [ -n "$ARTIFACT_MARKER" ] && [ -f "$ARTIFACT_MARKER" ]; then
    while IFS= read -r file; do
      found=1
      echo "  $(absolute_path "$file")"
    done < <(find "$directory" -type f -name "$pattern" -newer "$ARTIFACT_MARKER" | sort)

    if [ "$found" -eq 0 ]; then
      while IFS= read -r file; do
        found=1
        echo "  $(absolute_path "$file")"
      done < <(find "$directory" -type f -name "$pattern" | sort)
    fi
  else
    while IFS= read -r file; do
      found=1
      echo "  $(absolute_path "$file")"
    done < <(find "$directory" -type f -name "$pattern" | sort)
  fi

  if [ "$found" -eq 0 ]; then
    echo "  Nessun file trovato."
  fi
}

start_artifact_marker() {
  mkdir -p "$BUILD_DIR"
  ARTIFACT_MARKER="$BUILD_DIR/.artifact-marker"
  rm -f "$ARTIFACT_MARKER"
  touch "$ARTIFACT_MARKER"
}

print_desktop_artifacts() {
  print_matching_artifacts "Release desktop generata:" "release" "$1"
}

print_apk_artifacts() {
  print_matching_artifacts "APK generato:" "android/app/build/outputs/apk" "*.apk"
}

package_mac() {
  ensure_node_deps
  ensure_macos_icon
  build_web
  echo "Creo il DMG macOS..."
  start_artifact_marker
  npx electron-builder --mac dmg
  print_desktop_artifacts "*.dmg"
}

package_win() {
  ensure_node_deps
  copy_base_icon
  node scripts/create-windows-icon.cjs
  build_web

  if [ "$(uname -s)" = "Darwin" ] && ! command -v wine >/dev/null 2>&1; then
    echo "Nota: per generare un .exe da macOS spesso serve Wine."
    echo "Installa Homebrew e poi: brew install --cask wine-stable"
    echo "In alternativa esegui questo comando da Windows."
  fi

  echo "Creo il setup Windows..."
  start_artifact_marker
  npx electron-builder --win nsis
  print_desktop_artifacts "*.exe"
}

android_init() {
  ensure_node_deps
  ensure_android_java
  build_web
  if [ -d android ]; then
    echo "La cartella android/ esiste gia'."
    node scripts/create-android-icons.cjs
    return
  fi
  echo "Creo il progetto Android Capacitor..."
  npx cap add android
  node scripts/create-android-icons.cjs
}

package_apk() {
  ensure_node_deps
  ensure_android_java

  if [ ! -d android ]; then
    echo "android/ non esiste ancora. Eseguo l'inizializzazione..."
    android_init
  fi

  build_web
  npx cap sync android
  node scripts/create-android-icons.cjs

  if [ ! -x android/gradlew ]; then
    echo "Errore: android/gradlew non trovato. Apri Android Studio o riesegui: npm run mobile:add:android"
    exit 1
  fi

  echo "Creo APK debug..."
  start_artifact_marker
  (cd android && ./gradlew assembleDebug)
  print_apk_artifacts
}

clean_releases() {
  echo "Pulisco release e build generate..."
  rm -rf release
  rm -rf build
  rm -rf dist

  if [ -d android/app/build ]; then
    rm -rf android/app/build
  fi

  echo "Pulizia completata. Rimossi, se presenti:"
  echo "  $ROOT_DIR/release"
  echo "  $ROOT_DIR/build"
  echo "  $ROOT_DIR/dist"
  echo "  $ROOT_DIR/android/app/build"
}

case "${1:-}" in
  mac)
    package_mac
    ;;
  win)
    package_win
    ;;
  android-init)
    android_init
    ;;
  apk)
    package_apk
    ;;
  all)
    package_mac
    package_win
    package_apk
    ;;
  clean)
    clean_releases
    ;;
  ""|-h|--help|help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
