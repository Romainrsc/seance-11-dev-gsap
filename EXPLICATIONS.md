Romain Scheers

# Explications

1. **Quelle ligne fixe le nombre de cartes, et combien de pages le filtre compte-t-il (source) ?**
   C'est la première ligne du script, la constante `FILTRE` (`species=Humanoid&page=1`). Le filtre compte 4 pages d'après `info.pages` dans la réponse de l'API.

2. **Pause sur Aqua Morty à `s + 0.2` : attribut `style` exact de sa carte et propriété GSAP écrite.**
   Avec `generique.pause(0.95)` (0,75 + 0,2), l'inspecteur montre sur la carte : `box-shadow: rgba(151, 206, 76, 0.25) 0px 2px 8px; translate: none; rotate: none; scale: none; opacity: 0.6356; transform: translate3d(0px, 0px, 0px) scale(0.8542, 0.8542);`. Les propriétés GSAP écrites par le générique sont `scale` (via `transform`) et `opacity`.

3. **Où changer la durée totale, et combien d'endroits modifier ?**
   Il faut changer la constante `DUREE`, dans la zone MOUVEMENT de `script.js`. Un seul endroit suffit, car le compteur, la jauge et le calcul du moment d'entrée des cartes utilisent tous cette constante.

4. **Seconde d'entrée d'Aqua Morty, avec le calcul, le minimum et le maximum.**
   Formule : 3 × (v − min) / (max − min). Avec v = 10, min = 3 et max = 31 : 3 × (10 − 3) / (31 − 3) = 0,75 s.

5. **Pourquoi la timeline ne peut pas être créée avant la réponse de `fetch()` ?**
   Parce que `fetch()` est asynchrone : au démarrage les cartes n'existent pas encore. La timeline a besoin des cartes à animer, du minimum et du maximum pour placer leur entrée, et du total d'épisodes pour le compteur. Tout ça n'arrive qu'avec la réponse de l'API.

6. **Effet d'un nom contenant `<img src=x onerror=alert(1)>`, avec et sans la fonction d'échappement ?**
   Sans échappement, le navigateur lit le nom comme du HTML : il crée une image cassée et `onerror` exécute `alert(1)`, donc du code injecté. Avec `echapper`, les `<` et `>` deviennent `&lt;` et `&gt;`, le nom s'affiche comme du simple texte et rien ne s'exécute.
