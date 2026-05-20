# Packaging di Subber

Questa app nasce come PWA React/Vite, ma puo' essere impacchettata anche come app desktop e Android:

- macOS `.dmg`: tramite Electron + electron-builder.
- Windows `.exe`: tramite Electron + electron-builder.
- Android `.apk`: tramite Capacitor.

I dati dell'app restano locali. Nella PWA/browser sono in `localStorage`; nelle versioni Electron e Android vengono salvati nello storage locale del runtime.

## Prima configurazione

Serve Node.js LTS con npm:

```bash
node -v
npm -v
```

Se manca Node.js, installalo da https://nodejs.org/ oppure con Homebrew:

```bash
brew install node
```

Poi installa le dipendenze del progetto:

```bash
npm install
```

Le dipendenze aggiunte per il packaging sono:

- `electron`
- `electron-builder`
- `@capacitor/core`
- `@capacitor/cli`
- `@capacitor/android`
- `png-to-ico`

## Build web normale

```bash
npm run build
```

Output:

```text
dist/
```

## App desktop macOS `.dmg`

Sul Mac e' il percorso piu' semplice:

```bash
npm run package:mac
```

Output:

```text
release/
```

Lo script crea anche l'icona macOS `build/icon.icns` partendo da `public/logo.png`.

Nota: la prima apertura del `.dmg` potrebbe mostrare avvisi di sicurezza se l'app non e' firmata/notarizzata con un account Apple Developer.

## App desktop Windows `.exe`

Da macOS puoi provare:

```bash
npm run package:win
```

Output:

```text
release/
```

Lo script genera anche `build/icon.ico` partendo da `public/logo.png`.

Per creare installer Windows da Mac, electron-builder spesso richiede Wine. Se il comando fallisce per Wine, installalo con:

```bash
brew install --cask wine-stable
```

La soluzione piu' affidabile resta generare il setup `.exe` direttamente da Windows:

```bash
npm install
npm run package:win
```

## Android `.apk`

Per Android serve Android Studio.

Installa:

- Android Studio
- Android SDK
- Android SDK Platform Tools
- JDK incluso o configurato da Android Studio

Apri Android Studio almeno una volta e completa il setup guidato.

### Nota su Java e Gradle

Per compilare Android usa JDK 17 oppure il JDK incluso in Android Studio. Java troppo recenti possono far fallire Gradle con errori come:

```text
Unsupported class file major version 68
```

`major version 68` corrisponde a Java 24. Lo script `npm run package:apk` prova automaticamente a usare il JDK incluso in Android Studio su macOS:

```text
/Applications/Android Studio.app/Contents/jbr/Contents/Home
```

Se vuoi impostarlo manualmente nel terminale:

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

La prima volta crea il progetto Android Capacitor:

```bash
npm run mobile:add:android
```

Poi genera l'APK debug:

```bash
npm run package:apk
```

Durante il packaging lo script rigenera anche le icone launcher Android usando `public/logo.png`, con sfondo bianco per adattarsi meglio allo stile delle app stock Android.

Output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Questo APK e' utile per installazione manuale e test. Per pubblicare sul Play Store serve una build release firmata.

## Script unico

Puoi usare direttamente lo script:

```bash
bash scripts/package.sh mac
bash scripts/package.sh win
bash scripts/package.sh android-init
bash scripts/package.sh apk
bash scripts/package.sh all
```

`all` genera `.dmg`, `.exe` e APK debug.

Alla fine di ogni comando di packaging, lo script stampa nel terminale il percorso assoluto della release generata.

## Pulire le release generate

Per pulire gli output generati e ripartire da capo:

```bash
npm run package:clean
```

Comando equivalente:

```bash
bash scripts/package.sh clean
```

Questo rimuove, se presenti:

```text
release/
build/
dist/
android/app/build/
```

Non elimina la cartella `android/` del progetto Capacitor, quindi non devi rieseguire `npm run mobile:add:android` ogni volta.

## Provare la versione Electron in locale

```bash
npm run desktop:dev
```

Questo fa una build web e apre Subber dentro una finestra Electron.

## Cambiare versione

La versione principale e' in `package.json`:

```json
"version": "1.0.0"
```

Puoi cambiarla manualmente oppure usare npm:

```bash
npm version patch --no-git-tag-version
npm version minor --no-git-tag-version
npm version major --no-git-tag-version
```

Esempi:

- `patch`: `1.0.0` -> `1.0.1`, per bugfix.
- `minor`: `1.0.0` -> `1.1.0`, per nuove funzioni.
- `major`: `1.0.0` -> `2.0.0`, per cambiamenti importanti.

Dopo aver cambiato versione, rigenera i pacchetti:

```bash
npm run package:mac
npm run package:win
npm run package:apk
```

## Note importanti

- La PWA installabile da browser resta disponibile: apri l'app in Chrome/Edge e usa "Installa app".
- `.dmg` non firmato: va bene per uso personale/test, ma non per distribuzione professionale.
- `.exe` non firmato: Windows SmartScreen puo' mostrare un avviso.
- `.apk` debug: va bene per test, non per Play Store.
- Per release pubbliche servono certificati: Apple Developer per macOS, certificato code signing per Windows, keystore Android per APK/AAB release.
