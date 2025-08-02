import pool from "../config/db.js";

export const getMatches = async (req, res) => {
  try {
    const { tournament_id } = req.params;
    const [matches] = await pool.query("SELECT * FROM matches WHERE tournament_id = ?", [tournament_id]);
    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const [leaderboard] = await pool.query("SELECT name, points FROM teams ORDER BY points DESC");
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const generateFixtures = async (req, res) => {
  try {
    const { tournament_id, start_date } = req.body;

    const [teams] = await pool.query("SELECT id FROM teams WHERE tournament_id = ?", [tournament_id]);
    if (teams.length < 2) return res.status(400).json({ message: "Not enough teams to create matches" });

    let currentDate = new Date(start_date);
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        await pool.query("INSERT INTO matches (tournament_id, team1_id, team2_id, date) VALUES (?, ?, ?, ?)", [
          tournament_id,
          teams[i].id,
          teams[j].id,
          currentDate.toISOString().split("T")[0],
        ]);
        currentDate.setDate(currentDate.getDate() + 2); // Schedule every 2 days
      }
    }

    res.json({ message: "Fixtures generated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMatchScore = async (req, res) => {
  try {
    const { match_id } = req.params;
    const { team1_score, team2_score, goal_scorers } = req.body; // Add goal scorers

    await pool.query("UPDATE matches SET score = ? WHERE id = ?", [JSON.stringify({ team1: team1_score, team2: team2_score, goal_scorers }), match_id]);

    // Update leaderboard points
    const [match] = await pool.query("SELECT team1_id, team2_id FROM matches WHERE id = ?", [match_id]);

    let team1Points = team1_score > team2_score ? 3 : team1_score < team2_score ? 0 : 1;
    let team2Points = team2_score > team1_score ? 3 : team2_score < team1_score ? 0 : 1;

    await pool.query("UPDATE teams SET points = points + ? WHERE id = ?", [team1Points, match[0].team1_id]);
    await pool.query("UPDATE teams SET points = points + ? WHERE id = ?", [team2Points, match[0].team2_id]);

    res.json({ message: "Score and player stats updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const generateKnockoutStage = async (req, res) => {
  try {
    const { tournament_id } = req.body;

    const [qualifiedTeams] = await pool.query(
      "SELECT id FROM teams WHERE tournament_id = ? ORDER BY points DESC LIMIT 8", // Top 8 teams qualify
      [tournament_id]
    );

    if (qualifiedTeams.length < 2) {
      return res.status(400).json({ message: "Not enough teams for knockout stage" });
    }

    let currentDate = new Date();
    for (let i = 0; i < qualifiedTeams.length; i += 2) {
      await pool.query("INSERT INTO matches (tournament_id, team1_id, team2_id, date, round) VALUES (?, ?, ?, ?, 'Quarter-Final')", [
        tournament_id,
        qualifiedTeams[i].id,
        qualifiedTeams[i + 1].id,
        currentDate.toISOString().split("T")[0],
      ]);
      currentDate.setDate(currentDate.getDate() + 3); // Next round after 3 days
    }

    res.json({ message: "Knockout stage generated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
