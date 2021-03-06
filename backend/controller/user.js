/* Importation des modules */
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

/* Fonction 'signup' pour créer un nouveau 'user'
-Si l'utilisateur renseigne un email valide (unique et non présent dans la BDD) et un mots de passe
, le mots de passe est hashé via 'bcrypt' et un nouvel objet est créé puis sauvegarder dans la BDD. 
-Sinon renvoie une erreur
request body = {
  email = String, 
  password = String
}
*/
exports.signup = (req, res, next) => {
  bcrypt /* hashage du mots de passe - Promise */
    .hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        /*creation de l'objet JSON 'user'*/
        email: req.body.email,
        password: hash
      })
      user
        .save() /* Sauvegarde dans la BDD */
        .then(() =>
          res.status(201).json({ message: 'Utilisateur créé avec succés ! ' })
        )
        .catch(error => res.status(400).json({ error }))
    })
    .catch(error => res.status(500).json({ error }))
}

/* Fonction 'login' pour créer une session d'un 'user'
Recherche dans la BDD l'utilisateur via son email. Le cas echeant, utilise la fonction 'compare()' de "bcrypt"
pour comparer le mots de passe hashé enregistré dans la BDD avec celui que l'utilisateur a entré. 
-Si le resultats est positif (true), renvoie au frontend un objet contenant l''_id' de l'utilisateur ainsi qu'un token, toujours
 sur la base de l'id de l'utilisateur via "jws"
-Si le resultat est negatif, renvoie une erreur
request body = {
  email = String, 
  password = String
}
*/
exports.login = (req, res, next) => {
  User.findOne({
    email: req.body.email
  }) /*  Recherche dans la BDD l'utilisateur */
    .then(user => {
      if (!user) {
        /* Si 'user' introuvable : erreur */
        return res.status(401).json({ error: 'Utilisateur introuvable !' })
      }

      bcrypt /* Sinon, comparaison du hash de la BDD avec le MDP entrés hashé*/
        .compare(req.body.password, user.password)
        .then(valid => {
          /* Si invalide : erreurs */
          if (!valid) {
            return res.status(401).json({ error: 'Mot de passe incorrect !' })
          }
          /* Si ok : création de l'objet JSON contenant l'_id et le token généré */
          res.status(200).json({
            userId: user._id,
            token: jwt.sign({ userId: user._id }, 'RANDOM_TOKEN_SECRET', {
              expiresIn: '24h'
            })
          }) 
        })
        .catch(error => res.status(500).json({ error }))
    })
    .catch(error => res.status(500).json({ error }))
}
