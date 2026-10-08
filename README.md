# Momentum Frontend

Application Ionic/React servie comme un site statique. Docker Compose fournit un
démarrage reproductible et un serveur Nginx non privilégié.

## Prérequis

- Docker Desktop / Docker Engine avec Compose v2 (lancement complet) ;
- Node.js 24 et npm (développement sans Docker) ;
- le dépôt voisin `momentum-backend` cloné dans le même dossier parent.

## Interface

Le tableau de bord présente les sports, matchs, classements et une équipe
Fantasy de démonstration. Les scores et statistiques sont des exemples locaux,
pas des données en direct ; les favoris, filtres et sélections Fantasy
fonctionnent uniquement dans la session navigateur.

L'interface est reliée au backend pour l'état de santé (`GET /api/health`) et
le référentiel de sports (`GET /api/sports`) : l'indicateur de la barre
supérieure affiche « API connectée » ou bascule en « API indisponible · mode
démo » sans casser l'écran. Les matchs et classements restent des données de
démonstration (`src/data/demoSports.ts`) tant que le backend ne les expose pas ;
le client HTTP est dans `src/api/` et le hook `src/hooks/useBackend.ts`.

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

Le navigateur appelle l'API sur sa propre origine (`/api/...`) : en Docker, Nginx
relaie `/api/` vers `API_UPSTREAM` (`http://api:8080`, lu au lancement), et
`npm run dev` relaie vers `DEV_API_PROXY` (`http://localhost:8080`). Il n'y a
donc pas de CORS à gérer. `VITE_API_BASE_URL` (vide par défaut, lu au build)
ne sert que si l'API est publiée sur un autre domaine. Les variables préfixées
par `VITE_` sont publiques : n'y placez aucun secret.

`FRONTEND_PORT` choisit le port local publié par Docker Compose (8081 par défaut).
Les valeurs sensibles et les fichiers `.env` locaux ne doivent pas être commités ;
seul `.env.example` est versionné.

Pour lancer le serveur Vite en développement avec Node.js 24 et npm :

```powershell
npm ci
npm run dev
```

Le serveur de développement expose également `GET /health`.

## Lancer avec le backend

Les deux piles Docker partagent le réseau `momentum-net` ; l'ordre de lancement
n'a pas d'importance (Nginx résout l'API à la demande et renvoie un 503 JSON
tant qu'elle est absente).

```powershell
# 1. Backend (PostgreSQL, API, ingestion, sauvegardes, alerting)
cd ..\momentum-backend
Copy-Item .env.example .env   # puis changer POSTGRES_PASSWORD
docker compose up -d --build

# 2. Frontend
cd ..\momentum-frontend
docker compose up -d --build
```

Application : `http://localhost:8081` · API directe : `http://localhost:8080/api/health`
· e-mails d'alerte : `http://localhost:8025` (outils de supervision et Keycloak : fournis par le compose du backend, voir `docs/ops/audit-socle.md`). Exploitation (pannes, sauvegarde,
restauration) : [`docs/ops/runbook.md`](docs/ops/runbook.md).

## Livraison et sécurité (CI/CD)

**CI** (`.github/workflows/ci.yml`, sur chaque push de branche et pull request). Chaque job
est bloquant : un seul échec rouge la pipeline.

| Job | Contrôle |
|---|---|
| `secrets-scan` | Gitleaks sur tout l'historique Git |
| `security` | Trivy (dépendances + secrets), `npm audit` ; rapport JSON en artefact |
| `quality` | ESLint, `tsc`, tests unitaires avec **seuil de couverture** (90 % lignes/fonctions/statements, 85 % branches), build |
| `dockerfile-lint` | Hadolint |
| `end-to-end` | Cypress |
| `docker` | Règles Trivy sur `Dockerfile`/`compose.yaml` (toutes sévérités : un écart bloque), build, scan Trivy de l'image (vulnérabilités, secrets, configuration), démarrage et tests de fumée (`/health`, CSP, SPA, repli 503) |

CodeQL (`codeql.yml`) analyse le code à chaque push et chaque semaine ; Dependabot propose les mises
à jour npm, Docker et GitHub Actions.

**CD** (`cd.yml` + `deploy.yml` réutilisable) :

| Déclencheur | Étapes |
|---|---|
| push sur `main` | CI complète → publication GHCR (`:edge`, `:sha`) avec provenance, SBOM, scan Trivy, attestation → **staging** |
| tag `vX.Y.Z` | idem (+ tags `X.Y.Z`/`X.Y`) → staging → **production** si le staging est vert |

Le staging a deux niveaux :
1. `staging-verify` (toujours actif, sans serveur) : l'image **publiée** est tirée de GHCR, lancée sur le
   runner puis testée (`/health`, CSP, SPA, repli 503). Un échec bloque la production.
2. `deploy-staging` (optionnel) : déploiement SSH sur un serveur de staging, activé par la variable
   `STAGING_HOST`.

La production n'est déployée que sur un tag, si `DEPLOY_HOST` est défini et que le staging a réussi.

Configuration dans *Settings → Secrets and variables → Actions* :

| Cible | Variables | Secrets |
|---|---|---|
| Staging | `STAGING_HOST`, `STAGING_USER`, `STAGING_URL`, `STAGING_PATH` (défaut `/opt/momentum-frontend-staging`), `STAGING_PORT` (défaut 8081) | `STAGING_SSH_KEY`, `STAGING_KNOWN_HOSTS` |
| Production | `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_URL`, `DEPLOY_PATH` (défaut `/opt/momentum-frontend`), `DEPLOY_PORT` | `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS` |

Créez les environnements `staging` et `production` (*Settings → Environments*) ; ajoutez des
« required reviewers » sur `production` pour une approbation manuelle. `KNOWN_HOSTS` s'obtient avec
`ssh-keyscan -H <hôte>`. Le serveur doit avoir Docker, le réseau `momentum-net` et un accès en lecture
à GHCR. Retour arrière : relancer le workflow CD sur le tag précédent.

### Tester le staging

1. **Sans serveur** : poussez sur `main` (ou *Actions → CD → Run workflow*). Le job
   `Staging - run the published image` doit être vert ; ses logs montrent `{"status":"ok"}` et les
   journaux JSON du conteneur.
2. **En local**, mêmes contrôles que le job :
   ```powershell
   docker build -t momentum-frontend:ci .
   docker run -d --name staging -p 8081:8080 momentum-frontend:ci
   curl http://localhost:8081/health ; curl -I http://localhost:8081/ ; docker rm -f staging
   ```
   Pour tester l'image publiée : `docker login ghcr.io`, puis utilisez `ghcr.io/<owner>/<repo>:edge`.
3. **Avec un serveur** : définissez les variables/secrets de staging, relancez le CD ; le job
   `Deploy to staging` doit finir par un `/health` vert. Vérifiez sur le serveur avec `docker ps`.
4. **Production** : `git tag v0.1.0 ; git push origin v0.1.0`.

### Dependabot

`.github/dependabot.yml` suit npm (groupé minor/patch), le `Dockerfile`, `compose.yaml` et les actions
GitHub chaque lundi. **Il n'est actif qu'une fois le fichier présent sur la branche par défaut (`main`)**.
Vérifiez dans *Insights → Dependency graph → Dependabot* puis *Pull requests* (auteur `dependabot`) ;
activez aussi *Settings → Advanced Security → Dependabot alerts* et *security updates*.
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
npm run typecheck
npm run test.unit.ci   # tests + couverture (échoue sous les seuils)
npm run build
```

Pour les tests end-to-end locaux, démarrez `npm run dev` dans un premier
terminal, puis exécutez `npm run test.e2e` dans un second.

## Contribuer

1. Créez une branche depuis `main` : `git switch -c feature/ma-fonctionnalite`.
2. Développez en petits commits clairs (`feat:`, `fix:`, `docs:`, `chore:`).
3. Avant de pousser, lancez `npm run lint`, `npm run typecheck`, `npm run test.unit.ci` et `npm run build` : la CI exécute les mêmes contrôles et bloque la fusion en cas d'échec.
4. Ouvrez une pull request décrivant le changement et la manière de le tester.

Règles : aucun secret dans le code (utiliser `.env`, jamais commité), accessibilité préservée (libellés, contrastes, clavier), tests ajoutés ou mis à jour avec le code, documentation
mise à jour si le comportement ou la configuration change.

## Dépannage

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| `POSTGRES_PASSWORD` obligatoire | `.env` absent côté backend | `Copy-Item .env.example .env` |
| `port is already allocated` / accès refusé | Port hôte déjà pris | Changer `FRONTEND_PORT` / `API_PORT` dans `.env` |
| Interface en « mode démo » | API non lancée | Lancer le backend, voir le runbook |
| Erreur `docker daemon` | Docker Desktop arrêté | Démarrer Docker Desktop |

## Documentation

- Architecture : [`docs/architecture.md`](docs/architecture.md)
- API : Swagger UI `http://localhost:8080/swagger-ui.html` ; spécification : `momentum-backend/docs/api/openapi.json`
- Exploitation (pannes, sauvegarde, restauration) : [runbook](docs/ops/runbook.md)
- Audit DevOps : [audit](docs/ops/audit-socle.md)