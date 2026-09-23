const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    next();
});

app.use(require('./joyas'));

app.listen(3000, () => {
    console.log('Servidor corriendo en el puerto 3000');
});