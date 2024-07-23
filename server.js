const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 3000;

app.use(express.json());

// Remplacez par vos propres informations de connexion à la base de données
const db = mysql.createConnection({
  host: 'mortsed260.mysql.db',
  user: 'mortsed260',
  password: 'Ifomortseb1',
  database: 'mortsed260'
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('MySQL Connected...');
});

app.post('/save-score', (req, res) => {
  const { pseudonym, score } = req.body;
  const query = 'INSERT INTO LidlGame1 (pseudo, score) VALUES (?, ?)';

  db.query(query, [pseudonym, score], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('An error occurred while saving the score.');
    }

    res.send('Score saved successfully.');
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
