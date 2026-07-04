// Entrée par défaut : version "tout-en-un" avec RoleGateScreen (utile en dev
// pour tester les 4 rôles depuis un seul écran).
// En production, chaque interface a son propre index :
//   index.client.ts / index.restaurant.ts / index.courier.ts / index.admin.ts
import { registerRootComponent } from 'expo';
import App from './App.dev';
registerRootComponent(App);
