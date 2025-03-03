const { pool } = require('../models/db');

// Find card by ID
const findById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM cards WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
};

// Find card by name
const findByName = async (name) => {
  const [rows] = await pool.execute('SELECT * FROM cards WHERE name = ?', [
    name,
  ]);
  return rows.length > 0 ? rows[0] : null;
};

// Save card
const save = async (card) => {
  const {
    id,
    name,
    mana_cost,
    type_line,
    oracle_text,
    usd,
    usd_foil,
    image_url,
    set_name,
  } = card;

  await pool.execute(
    `INSERT INTO cards 
     (id, name, mana_cost, type_line, oracle_text, usd, usd_foil, image_url, set_name) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     name = VALUES(name),
     mana_cost = VALUES(mana_cost),
     type_line = VALUES(type_line),
     oracle_text = VALUES(oracle_text),
     usd = VALUES(usd),
     usd_foil = VALUES(usd_foil),
     image_url = VALUES(image_url),
     set_name = VALUES(set_name)`,
    [
      id,
      name,
      mana_cost,
      type_line,
      oracle_text,
      usd,
      usd_foil,
      image_url,
      set_name,
    ]
  );

  return card;
};

module.exports = {
  findById,
  findByName,
  save,
};
