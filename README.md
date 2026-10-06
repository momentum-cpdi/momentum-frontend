# Momentum Frontend

Application Ionic/React servie comme un site statique. Docker Compose fournit un
démarrage reproductible et un serveur Nginx non privilégié.

## Démarrer

Prérequis : Docker Engine et Docker Compose v2.

Copiez `.env.example` vers `.env` pour adapter les valeurs, puis démarrez
l'application depuis ce dossier :

```powershell
Copy-Item .env.example .env
docker compose up --build
```

L'application est disponible sur `http://localhost:8081`. Pour arrêter et
supprimer le conteneur : `docker compose down`.

## Configuration

`VITE_API_BASE_URL` fournit le point de configuration prévu pour l'API au build ;
les écrans actuels n'effectuent pas encore d'appels API. Toute modification de
cette valeur requiert une reconstruction (`docker compose up --build`). Les
variables préfixées par `VITE_` sont publiques : n'y placez aucun secret.

`FRONTEND_PORT` choisit le port local publié par Docker Compose (8081 par défaut).
Les valeurs sensibles et les fichiers `.env` locaux ne doivent pas être commités ;
seul `.env.example` est versionné.

Pour lancer le serveur Vite en développement avec Node.js 24 et npm :

```powershell
npm ci
npm run dev
```

Le serveur de développement expose également `GET /health`.

## Livraison et sécurité

GitHub Actions exécute le lint, les tests, la compilation et les tests end-to-end
sur chaque push et pull request. Le scan Trivy bloque le pipeline sur les
vulnérabilités HIGH/CRITICAL corrigibles et publie le rapport JSON comme artefact.
CodeQL complète cette analyse sur les push, pull requests et selon un calendrier
hebdomadaire.

## Santé et journaux

`GET http://localhost:8081/health` répond HTTP 200 avec `{"status":"ok"}`.
Compose et l'image Docker vérifient automatiquement cet endpoint.

Nginx envoie les accès en JSON vers stdout et les erreurs vers stderr. Consultez
les journaux horodatés avec :

```powershell
docker compose logs --follow --timestamps frontend
```

## Contrôles locaux

```powershell
npm ci
npm run lint
npm run test.unit -- --run
npm run build
```

Pour les tests end-to-end locaux, démarrez `npm run dev` dans un premier
terminal, puis exécutez `npm run test.e2e` dans un second.
