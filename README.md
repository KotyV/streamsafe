# StreamSafe

**Protège automatiquement vos fichiers sensibles pendant un live stream.**

StreamSafe détecte quand vous ouvrez un fichier `.env`, des clés privées ou d'autres fichiers sensibles dans VS Code, et active automatiquement une source OBS qui masque votre écran sur le stream.

Plus jamais de leak de secrets en live.

---

## Fonctionnement

```
Fichier .env ouvert → StreamSafe détecte → OBS masque l'écran
Fichier .env fermé  → StreamSafe détecte → OBS démasque l'écran
```

StreamSafe communique avec OBS Studio via le protocole **OBS WebSocket v5** pour activer/désactiver une source de couverture dans votre scène.

---

## Installation

### Depuis le Marketplace VS Code

1. Ouvrir VS Code
2. `Ctrl+Shift+X` → Rechercher "StreamSafe"
3. Installer

### Depuis les sources

```bash
git clone https://github.com/KotyV/streamsafe.git
cd streamsafe
npm install
npm run compile
```

Puis dans VS Code : `F5` pour lancer en mode développement.

---

## Configuration OBS (obligatoire)

### Étape 1 : Activer le WebSocket Server dans OBS

1. Ouvrir **OBS Studio** (v28+ requis pour WebSocket v5)
2. Menu → **Outils** → **Paramètres du serveur WebSocket**
3. Cocher **Activer le serveur WebSocket**
4. Choisir un port (par défaut : `4455`)
5. Optionnel : définir un mot de passe
6. Cliquer **Appliquer**

### Étape 2 : Créer la source de couverture

1. Dans votre **scène de stream**, cliquer **+** dans le panneau Sources
2. Choisir **Image** (ou **Couleur unie**)
3. Nommer la source : **`StreamSafe_Cover`** (exactement ce nom)
4. Configurer :
   - **Image** : choisir une image de couverture (ex: "BRB", logo, écran noir)
   - **Couleur unie** : choisir une couleur opaque
5. Redimensionner la source pour couvrir **tout l'écran**
6. **Cacher la source** (clic sur l'icône œil) — StreamSafe l'activera automatiquement

> **Important** : La source doit être **au-dessus** de votre capture d'écran/fenêtre dans la liste des sources OBS (elle la recouvre quand activée).

### Étape 3 : Configurer StreamSafe dans VS Code

Ouvrir les paramètres VS Code (`Ctrl+,`) et chercher "StreamSafe" :

| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| `streamsafe.obsWebSocketUrl` | `ws://localhost:4455` | URL du WebSocket OBS |
| `streamsafe.obsWebSocketPassword` | *(vide)* | Mot de passe WebSocket |
| `streamsafe.obsSourceName` | `StreamSafe_Cover` | Nom de la source OBS à activer |
| `streamsafe.obsSceneName` | *(vide = scène active)* | Scène OBS cible |
| `streamsafe.sensitivePatterns` | `.env`, `.pem`, etc. | Patterns de fichiers sensibles |
| `streamsafe.enabled` | `true` | Activer/désactiver |
| `streamsafe.showNotifications` | `true` | Notifications VS Code |

Ou dans `settings.json` :

```json
{
  "streamsafe.obsWebSocketUrl": "ws://localhost:4455",
  "streamsafe.obsWebSocketPassword": "votre_mot_de_passe",
  "streamsafe.obsSourceName": "StreamSafe_Cover",
  "streamsafe.sensitivePatterns": [
    "**/.env",
    "**/.env.*",
    "**/secrets.*",
    "**/*.pem",
    "**/*.key"
  ]
}
```

---

## Fichiers détectés par défaut

| Pattern | Exemple |
|---------|---------|
| `**/.env` | `.env` |
| `**/.env.*` | `.env.local`, `.env.production` |
| `**/secrets.*` | `secrets.json`, `secrets.yaml` |
| `**/credentials.*` | `credentials.json` |
| `**/*.pem` | `private-key.pem` |
| `**/*.key` | `server.key` |

Vous pouvez ajouter vos propres patterns dans les paramètres.

---

## Commandes

| Commande | Description |
|----------|-------------|
| `StreamSafe: Activer/Désactiver` | Toggle on/off |
| `StreamSafe: Reconnecter à OBS` | Reconnecter après une déconnexion |
| `StreamSafe: Afficher le statut` | Voir l'état actuel |

Accès via `Ctrl+Shift+P` → taper "StreamSafe".

---

## Barre de statut

StreamSafe affiche un indicateur dans la barre de statut VS Code :

| Icône | État |
|-------|------|
| 🛡️ `StreamSafe` | Connecté, prêt |
| 🛡️ `StreamSafe (off)` | Déconnecté d'OBS |
| 👁️‍🗨️ `StreamSafe ACTIF` | Écran masqué (fichier sensible ouvert) |
| ⚠️ `StreamSafe` | Erreur de connexion |

---

## Stack technique

- **TypeScript** — Code typé
- **API VS Code** — Événements éditeur
- **obs-websocket-js v5** — Communication OBS
- **minimatch** — Pattern matching fichiers

---

## Développement

```bash
# Installer les dépendances
npm install

# Compiler
npm run compile

# Watch mode
npm run watch

# Lancer dans VS Code (F5)
# → Ouvre une fenêtre Extension Development Host

# Packager en .vsix
npm run package
```

---

## Publier sur le Marketplace

```bash
# Installer vsce
npm install -g @vscode/vsce

# Se connecter
vsce login KotyV

# Publier
vsce publish
```

Prérequis : un [Personal Access Token Azure DevOps](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

---

## Licence

MIT
