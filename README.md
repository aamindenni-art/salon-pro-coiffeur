# Salon Pro — application téléphone (PWA)

Application **autonome** pour coiffeur : clients, rendez-vous, caisse, finances et
**rappels de rendez-vous**. Elle fonctionne **hors-ligne**, toutes les données restent
**sur le téléphone** (aucun serveur, aucun compte).

C'est une **PWA** : une page web installable sur l'écran d'accueil qui se comporte comme
une vraie application.

## Les rappels (sans serveur)

Dans l'agenda, chaque rendez-vous a un bouton **Rappeler** (🔔) : il ouvre **WhatsApp**,
**SMS** ou **Email** avec le message déjà écrit (nom, date, heure). Le coiffeur n'a plus
qu'à appuyer sur *Envoyer*, depuis son propre numéro / sa messagerie. Le rendez-vous est
alors marqué « Rappelé » et l'envoi est noté dans l'**Historique** (bouton 🕑 de l'agenda).
Le modèle du message se règle dans **Paramètres → Message de rappel**
(variables `{client}`, `{salon}`, `{date}`, `{heure}`).

## Installer sur le téléphone

L'appli doit être servie depuis une adresse **https** (ou localhost). Choisissez une option :

### Option A — hébergement gratuit, sans compte (le plus simple)
1. Allez sur **https://app.netlify.com/drop** depuis un ordinateur.
2. Glissez-déposez **tout le dossier `telephone`** dans la page.
3. Netlify donne une adresse `https://…netlify.app` — ouvrez-la sur le téléphone.
4. **Android (Chrome)** : menu ⋮ → *Ajouter à l'écran d'accueil* (ou le bouton ⤓ dans l'appli).
   **iPhone (Safari)** : bouton Partager → *Sur l'écran d'accueil*.

L'icône apparaît sur l'écran d'accueil ; l'appli s'ouvre en plein écran et marche hors-ligne.

### Option B — GitHub Pages
Poussez ce dossier sur un dépôt GitHub et activez **Settings → Pages** (branche + dossier
`telephone`). L'adresse `https://<vous>.github.io/<repo>/` est installable de la même façon.

### Essai rapide sur le même Wi-Fi (sans installer)
Sur l'ordinateur, dans ce dossier : `python -m http.server 8300`
puis sur le téléphone (même Wi-Fi) ouvrez `http://<IP-de-l-ordinateur>:8300`.
(L'installation « écran d'accueil » nécessite https ; cet essai sert juste à tester.)

## Sauvegarde

Les données vivent dans le téléphone. **Paramètres → Copier la sauvegarde** exporte tout
en texte (à coller dans une note/email) ; **Restaurer** le réimporte. À faire de temps en
temps pour ne rien perdre.

## Fichiers

```
telephone/
  index.html              l'application (HTML/CSS/JS, tout-en-un)
  manifest.webmanifest    déclaration PWA (nom, icônes, couleurs)
  service-worker.js        cache hors-ligne
  vendor/chart.umd.min.js  graphiques (local, pour marcher hors-ligne)
  icons/                   icônes de l'application
```
