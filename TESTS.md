# Tests automatisés — Salon Pro

Une suite de tests **Playwright** joue le rôle d'un utilisateur qui essaie l'application
dans un vrai navigateur (format téléphone), pour vérifier que rien n'est cassé avant
chaque mise en ligne.

## Lancer les tests sur votre ordinateur

```bash
npm install
npx playwright install chromium
npm test
```

- `npm test` — lance tous les tests
- `npm run test:ui` — mode visuel (on voit le navigateur jouer chaque étape)
- `npm run report` — ouvre le dernier rapport détaillé

Le site étant 100 % statique, les tests le servent tout seuls (http-server) : rien d'autre à démarrer.

## Ce qui est vérifié

### Page de réservation (`tests/reservation.spec.js`)
- L'identité du salon et les prestations s'affichent.
- Le bouton d'envoi reste bloqué tant que la réservation est incomplète.
- Parcours complet d'un client : prestation → jour → heure → coordonnées → bouton WhatsApp actif.

### Application de gestion (`tests/app.spec.js`)
- L'accueil s'affiche après la mise en route, avec des données.
- La navigation ouvre bien chaque onglet (Accueil, Agenda, Caisse, Clients, Finances).
- Caisse : ajouter une prestation puis encaisser crée une vente et affiche le reçu.
- Verrouillage : définir un code PIN, verrouiller, mauvais code refusé, bon code accepté.
- Récupération : la question secrète permet de déverrouiller en cas de code oublié.

## En continu (CI)

À chaque envoi sur GitHub, le workflow `.github/workflows/tests.yml` relance toute la
suite automatiquement. Si un test échoue, l'envoi est signalé en rouge et un rapport
est joint (onglet **Actions** du dépôt).
