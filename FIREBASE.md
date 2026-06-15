# Firebase

Questa guida contiene solo i passaggi necessari per creare il database Firebase di Subber e configurare le variabili d'ambiente usate dall'app.

## 1. Crea il progetto Firebase

1. Apri https://console.firebase.google.com.
2. Crea un nuovo progetto, ad esempio `subber-prod`.
3. Google Analytics non e' necessario per la sincronizzazione dati.
4. Dopo la creazione, entra nel progetto.

## 2. Registra l'app Web

1. Nella dashboard Firebase clicca l'icona Web `</>`.
2. Dai un nome all'app, ad esempio `Subber Web`.
3. Non serve attivare Firebase Hosting per forza.
4. Copia il blocco `firebaseConfig`: quei valori andranno nel file `.env`.

## 3. Abilita Authentication

1. Vai in `Build > Authentication`.
2. Clicca `Get started`.
3. Apri la tab `Sign-in method`.
4. Abilita `Email/Password`.
5. In `Settings > Authorized domains`, lascia solo i domini che userai:
   - `localhost` per sviluppo;
   - il dominio reale della PWA;
   - eventuali domini di staging.

## 4. Crea Cloud Firestore

1. Vai in `Build > Firestore Database`.
2. Clicca `Create database`.
3. Scegli `Production mode`.
4. Seleziona una location europea se gli utenti sono in UE.
5. Crea il database.

## 5. Inserisci le Security Rules

In `Firestore Database > Rules`, usa queste regole iniziali:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /settings/{documentId} {
        allow read, write: if isOwner(userId);
      }

      match /categories/{categoryId} {
        allow read, write: if isOwner(userId);
      }

      match /subscriptions/{subscriptionId} {
        allow read, write: if isOwner(userId);
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Con queste regole ogni utente puo' leggere e scrivere solo i propri dati sotto:

```text
users/{uid}
users/{uid}/settings/main
users/{uid}/categories/{categoryId}
users/{uid}/subscriptions/{subscriptionId}
```

## 6. Configura `.env`

Crea un file `.env.local` nella root del progetto.

```env
VITE_FIREBASE_API_KEY=incolla_apiKey
VITE_FIREBASE_AUTH_DOMAIN=incolla_authDomain
VITE_FIREBASE_PROJECT_ID=incolla_projectId
VITE_FIREBASE_STORAGE_BUCKET=incolla_storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=incolla_messagingSenderId
VITE_FIREBASE_APP_ID=incolla_appId
VITE_FIREBASE_ALLOWED_EMAILS=utente1@example.com,utente2@example.com
```

`VITE_FIREBASE_ALLOWED_EMAILS` limita la registrazione mostrata dall'app alle email indicate, separate da virgola.

Nota importante: questa allowlist e' un controllo lato app. Per una chiusura totale lato server devi creare manualmente gli utenti dalla console Firebase oppure aggiungere in futuro una Auth blocking function.

## 7. Build

Dopo aver configurato `.env.local`, verifica:

```bash
npm run build
```

