# 📁 Dossier Images Références

Ce dossier contient les images pour la section "Nos Références" du site CEA Ingénierie.

## 📂 Structure des Dossiers

```
references/
├── transports/       # Images de projets Transport (aéroports, gares, etc.)
├── hospitalier/      # Images de projets Hospitaliers (cliniques, hôpitaux)
├── datacenter/       # Images de Data Centers
├── public/           # Images d'Établissements Publics (mairies, administrations)
├── parking/          # Images de Parkings
├── hotellerie/       # Images d'Hôtels
└── bureaux/          # Images de Bureaux et espaces tertiaires
```

## 📸 Instructions pour ajouter des photos

### Format des photos

- **Format recommandé** : JPG ou PNG
- **Taille recommandée** : 1200x800 pixels (ratio 3:2)
- **Poids maximum** : 500 Ko par image (optimisez avec TinyPNG ou similaire)

### Nommage des fichiers

Utilisez des noms descriptifs en minuscules avec tirets :
- ✅ `aeroport-nice-cote-azur.jpg`
- ✅ `clinique-saint-george.jpg`
- ✅ `datacenter-sophia-antipolis.jpg`
- ❌ `IMG_1234.jpg`
- ❌ `Photo sans titre.png`

### Types de photos à inclure

Pour chaque projet, incluez 2 types de photos :

1. **Photo de présentation du site** (vue d'ensemble, façade, environnement)
   - Exemple : `transports/aeroport-facade.jpg`

2. **Photos techniques des installations** (armoires électriques, onduleurs, installations)
   - Exemple : `transports/aeroport-armoire-ht.jpg`
   - Exemple : `datacenter/onduleurs-salle.jpg`

## 🔄 Comment ajouter une nouvelle référence

1. **Placez vos images** dans le dossier approprié
   ```
   images/references/transports/mon-projet.jpg
   ```

2. **Modifiez index.html** pour ajouter une nouvelle carte de référence :
   ```html
   <div class="ref-card">
       <div class="ref-image">
           <img src="images/references/transports/mon-projet.jpg"
                alt="Description du projet"
                class="ref-img">
           <div class="image-placeholder">
               <i class="fas fa-plane-departure"></i>
           </div>
       </div>
       <div class="ref-content">
           <h4>Nom du Projet</h4>
           <p>Description courte du projet et des installations réalisées</p>
       </div>
   </div>
   ```

3. **Testez l'affichage** en ouvrant index.html dans votre navigateur

## 💡 Conseils

- Utilisez des photos de **haute qualité** et **professionnelles**
- Évitez les photos floues ou mal cadrées
- Vérifiez que vous avez l'**autorisation** d'utiliser les photos (droits d'auteur)
- Optimisez les images pour le web pour un chargement rapide
- Ajoutez des **légendes descriptives** pour le SEO

## 🎨 Placeholders

Si vous n'avez pas encore de photo pour un projet, le système affichera automatiquement une icône de remplacement. Vous pourrez ajouter les vraies photos plus tard.

---

**Besoin d'aide ?** Consultez le fichier `GUIDE_CONTENU.md` à la racine du projet.
