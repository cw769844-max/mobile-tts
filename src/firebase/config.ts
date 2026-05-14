import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import Constants from 'expo-constants';

const firebaseConfig = Constants.expoConfig?.extra?.firebaseConfig ?? {};

let app: FirebaseApp;
let db: Database;
let auth: Auth;
let storage: FirebaseStorage;

function initFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  db = getDatabase(app);
  auth = getAuth(app);
  storage = getStorage(app);
}

initFirebase();

export { db, auth, storage };
