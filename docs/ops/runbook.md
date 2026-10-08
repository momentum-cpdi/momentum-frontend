# Runbook d'exploitation Momentum

Procédures de première réponse pour la pile Docker (frontend + backend). Les commandes se lancent
depuis `momentum-backend/` pour l'API, la base, les sauvegardes et l'alerting, et depuis
`momentum-frontend/` pour le frontend. Toutes les piles partagent le réseau `momentum-net`.

## Vue d'ensemble

| Composant | Conteneur | Santé | Journaux |
|-----------|-----------|-------|----------|
| Frontend (Nginx) | `momentum-frontend` | `http://localhost:8081/health` | JSON sur stdout |
| API Spring Boot | `momentum-api` | `http://localhost:8080/api/health` (actuator sur le port interne 9090) | `docker compose logs api` |
| Ingestion | `momentum-ingest-api` | `/actuator/health` (réseau interne) | `docker compose logs ingest` |
| PostgreSQL | `momentum-postgres` | `pg_isready` (healthcheck Compose) | `docker compose logs postgres` |
| Sauvegardes | `momentum-backup` | dernier fichier dans `momentum-backend/backups/` | JSON sur stdout |
| Prometheus / Grafana | `momentum-prometheus`, `momentum-grafana` | `http://localhost:9091/targets`, `http://localhost:3000` | stdout |
| Alertmanager + Mailpit | `momentum-alertmanager`, `momentum-mailpit` | e-mails sur `http://localhost:8025` | stdout |
| Keycloak | `momentum-keycloak` | `http://localhost:8180` | `docker compose logs keycloak` |

Premier réflexe, quel que soit l'incident :

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}"      # qui est unhealthy / en redémarrage ?
cd ..\momentum-backend; docker compose logs --since 15m --timestamps api postgres
```

## Surveillance et alertes

- **Grafana** (`http://localhost:3000`) : tableau de bord « Momentum - Vue d'ensemble » (disponibilité,
  débit et erreurs HTTP, latence p95, tas JVM, connexions base). Premier réflexe en cas d'incident.
- **Prometheus** (`http://localhost:9091`) : `/targets` indique les cibles `up`/`down`, `/alerts` les règles
  en cours. Règles dans `momentum-backend/ops/monitoring/alerts.yml` :
  `ServiceDown` / `FrontendDown` (30 s), `ApiHighErrorRate` (>5 % de 5xx), `ApiHighLatency`
  (p95 > 1 s), `JvmHeapHigh` (>90 %).
- **Alertmanager** envoie un e-mail `[FIRING] …` puis `[RESOLVED] …`. En local ils arrivent dans Mailpit
  (`http://localhost:8025`). En production, éditez `ops/monitoring/alertmanager.yml` (SMTP réel, destinataire,
  webhook Slack/Teams) puis `docker compose restart alertmanager`.

Tester l'alerte : `docker compose stop ingest`, attendre ~1 min 30, lire le message `[FIRING]` dans Mailpit,
puis `docker compose start ingest` (message `[RESOLVED]` ~1 min plus tard).

### Keycloak indisponible ou connexion refusée

1. `docker compose logs --tail 100 keycloak` ; premier démarrage ≈ 1 min (healthcheck `start_period`).
2. L'API reste disponible : les lectures publiques ne dépendent pas de Keycloak, seules les écritures
   (`POST /api/sports`) renvoient 401 tant que les clés de signature ne sont pas joignables.
3. 401 avec un jeton valide : l'émetteur du jeton doit égaler `KEYCLOAK_PUBLIC_URL` (`http://localhost:8180`).
4. Mot de passe admin perdu : modifier `KEYCLOAK_ADMIN_PASSWORD` ne suffit pas sur un volume existant ;
   utiliser `docker compose exec keycloak /opt/keycloak/bin/kcadm.sh` ou recréer le volume `keycloak_data`
   (les utilisateurs créés à la main seront perdus, le realm est réimporté).
## Pannes

### Le frontend ne répond pas (alerte `FrontendDown`)

1. `docker ps -a --filter name=momentum-frontend` : le conteneur est-il arrêté ou `unhealthy` ?
2. `cd momentum-frontend; docker compose logs --tail 100 frontend` (erreurs Nginx sur stderr).
3. Redémarrer : `docker compose up -d`. Si l'image est en cause : `docker compose up -d --build`.
4. Vérifier : `curl http://localhost:8081/health` renvoie `{"status":"ok"}`.

### L'interface affiche « API indisponible · mode démo »

Le frontend fonctionne mais l'API ne répond pas via `/api`.

1. `curl -i http://localhost:8081/api/health` : un **503** `{"status":"unavailable"}` vient de
   Nginx (API injoignable) ; un **404** indique un mauvais `API_UPSTREAM`.
2. `curl http://localhost:8080/api/health` côté hôte : si KO, voir la section suivante.
3. Si le frontend et l'API ne sont pas sur le même réseau : `docker network inspect momentum-net`
   doit lister `momentum-api` et `momentum-frontend`.
4. `API_UPSTREAM` modifié dans `.env` : `docker compose up -d` (pas de reconstruction).

### L'API ne répond pas (alerte `ServiceDown`)

1. `docker compose ps api` puis `docker compose logs --tail 200 api`.
2. Causes fréquentes :
   - **Base indisponible** (`Connection refused`, `password authentication failed`) : voir « PostgreSQL ».
     Le mot de passe de `.env` doit être celui avec lequel le volume a été initialisé.
   - **Mémoire** (`OOMKilled` dans `docker inspect momentum-api --format "{{.State.OOMKilled}}"`) :
     augmenter la mémoire Docker puis relancer.
   - **Image obsolète / bug** : `docker compose up -d --build api`.
3. Relancer : `docker compose restart api`. L'API redémarre en ~30 s (healthcheck `start_period` 40 s).
4. Vérifier : `curl http://localhost:8080/api/health` → `"status":"UP"`.

### PostgreSQL ne démarre pas ou est `unhealthy`

1. `docker compose logs --tail 100 postgres`.
2. Disque plein (`No space left on device`) : `docker system df`, libérer de la place
   (`docker image prune`), supprimer les vieilles sauvegardes de `backups/`.
3. Volume corrompu ou perdu : arrêter l'API (`docker compose stop api ingest`), recréer la base
   puis **restaurer la dernière sauvegarde** (section suivante).
4. Ne jamais lancer `docker compose down -v` : l'option `-v` supprime le volume de données.

### Erreurs 401 sur l'API

`GET /api/sports` et `GET /api/health` sont publics ; les écritures (`POST /api/sports`)
exigent un jeton Bearer Keycloak avec le rôle `admin`. Un 401 sur une lecture signifie que la route publique a
été retirée de `SecurityConfig`.

### Erreurs CORS dans la console du navigateur

Seulement si l'API est appelée directement depuis un autre domaine (pas via `/api`). Ajouter
l'origine à `CORS_ALLOWED_ORIGINS` dans `momentum-backend/.env`, puis `docker compose up -d api`.

## Sauvegarde et restauration

- **Sauvegarde automatique** : le service `backup` exécute `pg_dump` au démarrage puis toutes les
  24 h (`BACKUP_INTERVAL_SECONDS`) vers `momentum-backend/backups/momentum-<horodatage>.dump`
  (format custom compressé, rétention 14 jours via `BACKUP_RETENTION_DAYS`).
  Copiez ce dossier hors de la machine (stockage distant) pour résister à la perte du disque.
- **Sauvegarde à la demande** :
  `docker compose exec backup sh /ops/backup.sh`
- **Vérifier qu'une sauvegarde est restaurable** (restaure dans une base vide temporaire, compare
  les tables avec la base source, puis supprime la base temporaire) :
  `docker compose run --rm --no-deps --entrypoint sh backup /ops/verify-restore.sh`
  À exécuter après tout changement de schéma et au moins une fois par mois.
- **Restaurer en production** (écrase la base active ; arrêter les écritures avant) :

  ```powershell
  docker compose stop api ingest
  docker compose run --rm --no-deps -e CONFIRM=yes --entrypoint sh backup `
    /ops/restore.sh /backups/<fichier.dump>
  docker compose start api ingest
  ```

  Puis contrôler : `curl http://localhost:8080/api/sports`.

## Escalade

Si l'incident dure plus de 30 minutes ou touche les données, prévenir le responsable du projet,
conserver les journaux (`docker compose logs --timestamps > incident.log`) et consigner la cause
et la correction dans le journal d'incidents de l'équipe.
