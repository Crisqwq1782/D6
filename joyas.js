const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'TU CONTRASEÑA',
  database: 'joyas',
  allowExitOnIdle: true
});

router.get('/joyas', async (req, res) => {
  const limit = Number.parseInt(req.query.limits, 10) || 10;
  const page = Number.parseInt(req.query.page, 10) || 1;
  const offset = (page - 1) * limit;
  const orderParts = (req.query.order_by || 'id_ASC').split('_');
  const allowedColumns = ['id', 'nombre', 'categoria', 'metal', 'precio', 'stock'];
  const orderColumn = allowedColumns.includes(orderParts[0]) ? orderParts[0] : 'id';
  const orderDirection = orderParts[1] === 'DESC' ? 'DESC' : 'ASC';

  if (limit < 1 || page < 1) {
    return res.status(400).json({ error: 'limits y page deben ser mayores que 0' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM inventario ORDER BY ${orderColumn} ${orderDirection} LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      totalJoyas: rows.length,
      stockTotal: rows.reduce((total, joya) => total + joya.stock, 0),
      results: rows.map(({ nombre, id }) => ({
        name: nombre,
        href: `/joyas/${id}`
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
});

router.get('/joyas/filtros', async (req, res) => {
  const { precio_min, precio_max, categoria, metal } = req.query;

  const condiciones = [];
  const valores = [];

  if (precio_min !== undefined) {
    valores.push(Number(precio_min));
    condiciones.push(`precio >= $${valores.length}`);
  }

  if (precio_max !== undefined) {
    valores.push(Number(precio_max));
    condiciones.push(`precio <= $${valores.length}`);
  }

  if (categoria) {
    valores.push(categoria);
    condiciones.push(`categoria = $${valores.length}`);
  }

  if (metal) {
    valores.push(metal);
    condiciones.push(`metal = $${valores.length}`);
  }

  let consulta = 'SELECT * FROM inventario';

  if (condiciones.length > 0) {
    consulta += ` WHERE ${condiciones.join(' AND ')}`;
  }

  try {
    const { rows } = await pool.query(consulta, valores);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
});

module.exports = router;

