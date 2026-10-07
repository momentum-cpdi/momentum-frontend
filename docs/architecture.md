# Architecture Momentum

## Vue d'ensemble

```mermaid
flowchart LR
    user([Navigateur / PWA])

    subgraph net["Réseau Docker momentum-net"]
        fe["frontend<br/>Nginx + Ionic/React<br/>:8081 → 8080"]
        api["api<br/>Spring Boot<br/>:8080"]
        ingest["ingest<br/>Spring Boot<br/>:8081"]
        db[("postgres<br/>:5432")]
        backup["backup<br/>pg_dump quotidien"]
        alerter["alerter<br/>sonde /health"]
        mail["mailpit<br/>SMTP :1025 / UI :8025"]
    end

    ext["API sportive externe<br/>(prévu)"]

    user -->|"HTTP :8081"| fe
    fe -->|"/api/* (proxy)"| api
    api -->|JDBC| db
    ingest -->|JDBC| db
    ingest -.->|"collecte (prévu)"| ext
    backup -->|pg_dump| db
    backup --> vol[("backups/")]
    alerter -->|"GET /actuator/health"| api
    alerter -->|"GET /actuator/health"| ingest
    alerter -->|e-mail| mail
```

## Composants

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| `momentum-frontend` | Ionic 8, React, Vite, Nginx non privilégié | Interface accessible ; sert les fichiers statiques et relaie `/api/` vers l'API (même origine, pas de CORS) |
| `momentum-api` | Spring Boot 3.5, Java 21, Spring Security | API REST (`/api/health`, `/api/sports`), OpenAPI/Swagger |
| `momentum-ingest-api` | Spring Boot | Ingestion de données sportives (squelette) |
| `momentum-domain` | Bibliothèque JPA | Entités et dépôts partagés par `api` et `ingest` |
| `postgres` | PostgreSQL 18 | Base unique ; volume `postgres_data` |
| `backup` / `alerter` / `mailpit` | Shell + images officielles | Sauvegarde, alerte, boîte mail de test (voir `docs/ops/runbook.md`) |

## Flux d'une requête

```mermaid
sequenceDiagram
    participant B as Navigateur
    participant N as Nginx (frontend)
    participant A as API Spring Boot
    participant D as PostgreSQL
    B->>N: GET /api/sports
    N->>A: GET /api/sports (proxy)
    A->>D: SELECT * FROM sports
    D-->>A: lignes
    A-->>N: 200 JSON
    N-->>B: 200 JSON
    Note over N,A: API absente → Nginx répond 503 JSON,<br/>l'interface bascule en mode démo
```

## Décisions

- **Proxy `/api` plutôt que CORS** : une seule origine pour le navigateur ; CORS reste configuré
  (`CORS_ALLOWED_ORIGINS`) pour les appels directs.
- **Deux piles Compose, un réseau** : chaque dépôt se lance seul ; `momentum-net` les relie.
- **Configuration par variables d'environnement** (`.env`), aucun secret dans le code.
- **Sécurité par défaut** : toute route est authentifiée sauf liste blanche dans `SecurityConfig`.
- **Données sportives** : matchs et classements sont encore des données de démonstration côté frontend.

## Documentation de l'API

- Swagger UI : `http://localhost:8080/swagger-ui.html` (public).
- Spécification OpenAPI vivante : `http://localhost:8080/v3/api-docs`.
- Instantané versionné : [`docs/api/openapi.json`](../../momentum-backend/docs/api/openapi.json) (backend).

| Méthode | Route | Auth | Réponses |
|---------|-------|------|----------|
| GET | `/api/health` | publique | 200 `{status, service, timestamp}` |
| GET | `/actuator/health` | publique | 200 `{"status":"UP"}` |
| GET | `/api/sports` | publique | 200 liste de `{id, name, code, type, active}` |
| POST | `/api/sports` | HTTP Basic | 201 sport créé · 400 données invalides · 401 |