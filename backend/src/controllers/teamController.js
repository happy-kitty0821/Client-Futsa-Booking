import pool from "../config/db.js";

export const registerTeam = async (req, res) => {
  try {
    const { name, players } = req.body;
    const user_id = req.user.id;

    const [existing] = await pool.query("SELECT * FROM teams WHERE name = ?", [name]);
    if (existing.length > 0) return res.status(400).json({ message: "Team name already exists" });

    await pool.query("INSERT INTO teams (user_id, name, players) VALUES (?, ?, ?)", [user_id, name, JSON.stringify(players)]);

    res.status(201).json({ message: "Team registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTeams = async (req, res) => {
  try {
    const [teams] = await pool.query("SELECT * FROM teams");
    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
