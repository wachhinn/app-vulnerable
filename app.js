// Aplicación vulnerable de ejemplo
const express = require('express');
const app = express();

// Vulnerabilidad: XSS potencial
app.get('/search', (req, res) => {
  const query = req.query.q || '';
  res.send(`<h1>Result: ${query}</h1>`);
});

app.get('/', (req, res) => {
  res.send('App Vulnerable para pruebas de seguridad');
});

app.listen(3000, () => {
  console.log('App running on http://localhost:3000');
});
