const FILTRE = "species=Humanoid&page=1";
let generique;

/*
  Valeurs constatées pour ce filtre (info.pages et résultats de l'API) :
  - premier épisode : minimum = 3, maximum = 31
  - compteur attendu (épisodes différents couverts) : 15
  - nombre de pages du filtre : 4 (page 1 imposée par la fiche, 20 personnages)
  Égalité de tri : à numéro égal, on départage par id croissant.
*/

// ZONE RÉSEAU
const URL_API = "https://rickandmortyapi.com/api/character/?";

async function chargerPersonnages() {
  try {
    const reponse = await fetch(URL_API + FILTRE);
    if (!reponse.ok) return null;
    const donnees = await reponse.json();
    if (!donnees.results || donnees.results.length === 0) return null;
    return donnees.results;
  } catch (erreur) {
    return null;
  }
}

// ZONE DONNÉES
function numeroEpisode(url) {
  return Number(url.split("/").pop());
}

function preparer(personnages) {
  const liste = personnages.map((p) => ({
    ...p,
    premier: numeroEpisode(p.episode[0]),
  }));
  liste.sort((a, b) => a.premier - b.premier || a.id - b.id);

  const premiers = liste.map((p) => p.premier);
  const episodes = new Set();
  personnages.forEach((p) => p.episode.forEach((e) => episodes.add(numeroEpisode(e))));

  return {
    liste,
    min: Math.min(...premiers),
    max: Math.max(...premiers),
    totalEpisodes: episodes.size,
  };
}

// ZONE RENDU
function echapper(valeur) {
  return String(valeur)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const CLASSES_PASTILLE = {
  Alive: "pastille pastille--vivant",
  Dead: "pastille pastille--mort",
  unknown: "pastille pastille--inconnu",
};

const LIBELLES_STATUT = { Alive: "Vivant", Dead: "Mort", unknown: "Inconnu" };

function creerCarte(p) {
  const classe = CLASSES_PASTILLE[p.status] || CLASSES_PASTILLE.unknown;
  const libelle = LIBELLES_STATUT[p.status] || LIBELLES_STATUT.unknown;
  const carte = document.createElement("article");
  carte.className = "carte";
  carte.innerHTML = `
    <div class="carte__portail">
      <img src="${echapper(p.image)}" alt="Portrait de ${echapper(p.name)}" width="300" height="300">
    </div>
    <h3>${echapper(p.name)}</h3>
    <span class="${classe}">${echapper(libelle)}</span>
    <p>${echapper(p.species)} · ${echapper(p.origin.name)}</p>
    <p class="carte__episodes">1er épisode : n°${echapper(p.premier)} · ${echapper(p.episode.length)} épisode(s)</p>`;
  return carte;
}

function afficherCartes(liste) {
  const grille = document.querySelector("#grille");
  grille.replaceChildren(...liste.map(creerCarte));
  return [...grille.children];
}

function afficherBilan(donnees) {
  document.querySelector("#bilan-personnages").textContent = donnees.liste.length;
  document.querySelector("#bilan-premier").textContent = donnees.min;
  document.querySelector("#bilan-dernier").textContent = donnees.max;
  document.querySelector("#bilan").hidden = false;
}

function afficherErreur() {
  document.querySelector("#message").hidden = false;
  document.querySelectorAll(".generique-bloc, .commandes").forEach((el) => {
    el.hidden = true;
  });
}

// ZONE STYLE
const OMBRE_REPOS = "0 2px 8px rgba(151, 206, 76, 0.25)";
const OMBRE_SURVOL = "0 14px 34px rgba(151, 206, 76, 0.7)";

// ZONE MOUVEMENT
const DUREE = 3;
const DUREE_CARTE = 0.7;
let vitesse = 1;

function instantEntree(valeur, min, max) {
  if (max === min) return 0;
  return (DUREE * (valeur - min)) / (max - min);
}

function construireGenerique(donnees, cartes) {
  const titre = document.querySelector("#titre");
  const compteur = document.querySelector("#compteur");
  const barre = document.querySelector("#jauge-barre");
  const mm = gsap.matchMedia();

  mm.add(
    {
      normal: "(prefers-reduced-motion: no-preference)",
      reduit: "(prefers-reduced-motion: reduce)",
    },
    (contexte) => {
      if (contexte.conditions.reduit) {
        // Mouvement réduit : tout est visible d'emblée, valeurs finales.
        compteur.textContent = donnees.totalEpisodes;
        gsap.set(barre, { scaleY: 1 });
        generique = gsap.timeline();
        return;
      }

      const lettres = SplitText.create(titre, { type: "chars" });
      const etat = { valeur: 0 };
      generique = gsap.timeline();

      generique.from(
        lettres.chars,
        { y: -30, opacity: 0, duration: 0.5, ease: "power2.out", stagger: { each: 0.03, from: "random" } },
        0
      );

      generique.to(
        etat,
        {
          valeur: donnees.totalEpisodes,
          duration: DUREE,
          ease: "none",
          snap: { valeur: 1 },
          onUpdate: () => {
            compteur.textContent = etat.valeur;
          },
        },
        0
      );

      generique.fromTo(
        barre,
        { scaleY: 0, transformOrigin: "center bottom" },
        { scaleY: 1, duration: DUREE, ease: "none" },
        0
      );

      donnees.liste.forEach((p, i) => {
        const t = instantEntree(p.premier, donnees.min, donnees.max);
        const pastille = cartes[i].querySelector(".pastille");
        generique.from(cartes[i], { scale: 0.6, opacity: 0, duration: DUREE_CARTE, ease: "power2.out" }, t);
        generique.from(pastille, { scale: 0, duration: 0.4, ease: "back.out(2.5)" }, "<");
      });

      generique.timeScale(vitesse);

      // Bonus ScrollTrigger : le bilan se révèle au défilement (scrub), après les cartes.
      gsap.from(".bilan__item", {
        y: 80,
        opacity: 0,
        stagger: 0.2,
        ease: "none",
        scrollTrigger: {
          trigger: "#bilan",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
      });
    }
  );
}

function activerSurvol(cartes) {
  cartes.forEach((carte) => {
    carte.addEventListener("mouseenter", () => {
      gsap.to(carte, { y: -4, boxShadow: OMBRE_SURVOL, duration: 0.25, overwrite: "auto" });
    });
    carte.addEventListener("mouseleave", () => {
      gsap.to(carte, { y: 0, boxShadow: OMBRE_REPOS, duration: 0.25, overwrite: "auto" });
    });
  });
}

function activerCommandes() {
  const rejouer = document.querySelector("#rejouer");
  const curseur = document.querySelector("#vitesse");
  const affichage = document.querySelector("#vitesse-valeur");

  rejouer.addEventListener("click", () => generique.restart());
  curseur.addEventListener("input", () => {
    vitesse = Number(curseur.value);
    affichage.textContent = "×" + vitesse;
    generique.timeScale(vitesse);
  });
}

// ZONE ACCESSIBILITÉ
function annoncerChargement(enCours) {
  document.querySelector("#grille").setAttribute("aria-busy", String(enCours));
}

async function demarrer() {
  annoncerChargement(true);
  const personnages = await chargerPersonnages();
  if (!personnages) {
    annoncerChargement(false);
    afficherErreur();
    return;
  }
  const donnees = preparer(personnages);
  const cartes = afficherCartes(donnees.liste);
  gsap.set(cartes, { boxShadow: OMBRE_REPOS });
  afficherBilan(donnees);
  gsap.registerPlugin(SplitText, ScrollTrigger);
  construireGenerique(donnees, cartes);
  ScrollTrigger.refresh();
  // Les images et polices finissent de charger après : on recalcule les positions.
  window.addEventListener("load", () => ScrollTrigger.refresh());
  activerSurvol(cartes);
  activerCommandes();
  annoncerChargement(false);
}

demarrer();
