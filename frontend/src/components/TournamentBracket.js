import React, { useEffect, useState } from "react";
import { SingleEliminationBracket, Match } from "@g-loot/react-tournament-brackets";
import axios from "axios";

// Utility: Next power of two >= n
function nextPowerOfTwo(n) {
  return 2 ** Math.ceil(Math.log2(n));
}

// Build matches recursively for all rounds with formatted startTime
function buildMatches(teams) {
  const totalSlots = nextPowerOfTwo(teams.length);
  const byesCount = totalSlots - teams.length;

  const allTeams = [...teams];
  for (let i = 0; i < byesCount; i++) {
    allTeams.push({ team_name: "BYE" });
  }

  const firstRoundMatches = [];
  for (let i = 0; i < totalSlots; i += 2) {
    firstRoundMatches.push({
      id: `match-0-${i / 2}`,
      name: `Round 1 Match ${i / 2 + 1}`,
      tournamentRoundText: "Round 1",
      startTime: new Date().toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      state: "SCHEDULED",
      participants: [
        {
          id: `0-${i}-a`,
          name: allTeams[i].team_name,
          resultText: "",
          isWinner: false,
          picture: null,
        },
        {
          id: `0-${i + 1}-b`,
          name: allTeams[i + 1].team_name,
          resultText: "",
          isWinner: false,
          picture: null,
        },
      ],
      nextMatchId: null,
      nextMatchSide: null,
    });
  }

  let matchesByRound = [firstRoundMatches];

  let round = 1;
  let prevRoundMatches = firstRoundMatches;

  while (prevRoundMatches.length > 1) {
    const roundMatches = [];
    for (let i = 0; i < prevRoundMatches.length; i += 2) {
      const matchId = `match-${round}-${i / 2}`;
      roundMatches.push({
        id: matchId,
        name: `Round ${round + 1} Match ${i / 2 + 1}`,
        tournamentRoundText: `Round ${round + 1}`,
        startTime: new Date().toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        state: "SCHEDULED",
        participants: [
          {
            id: `placeholder-${matchId}-a`,
            name: "TBD",
            resultText: "",
            isWinner: false,
            picture: null,
          },
          {
            id: `placeholder-${matchId}-b`,
            name: "TBD",
            resultText: "",
            isWinner: false,
            picture: null,
          },
        ],
        nextMatchId: null,
        nextMatchSide: null,
      });

      prevRoundMatches[i].nextMatchId = matchId;
      prevRoundMatches[i].nextMatchSide = "a";
      prevRoundMatches[i + 1].nextMatchId = matchId;
      prevRoundMatches[i + 1].nextMatchSide = "b";
    }
    matchesByRound.push(roundMatches);
    prevRoundMatches = roundMatches;
    round++;
  }

  return matchesByRound.flat();
}

// Styled Match component with visible, wrapped match name
const StyledMatch = (props) => (
  <div style={styles.matchWrapper}>
    <div style={styles.matchName}>{props.name}</div>
    <Match {...props} />
  </div>
);

const BracketComponent = ({ tournamentId }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTieSheet = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/tournaments/${tournamentId}/tie-sheet`
        );
        const { registered_teams } = res.data;

        if (!registered_teams || registered_teams.length === 0) {
          setMatches([]);
          setLoading(false);
          return;
        }

        const builtMatches = buildMatches(registered_teams);
        setMatches(builtMatches);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tie sheet:", error);
        setLoading(false);
      }
    };

    fetchTieSheet();
  }, [tournamentId]);

  if (loading) return <p style={styles.loadingText}>Loading bracket...</p>;
  if (!matches.length)
    return <p style={styles.loadingText}>No teams registered or no matches to display.</p>;

  return (
    <div style={styles.pageContainer}>
      <div style={styles.bracketContainer}>
        <SingleEliminationBracket matches={matches} matchComponent={StyledMatch} />
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    color: "#eee",
    overflow: "hidden",
    padding: 16,
  },
  bracketContainer: {
    flex: 1,
    minWidth: 600,
    maxWidth: "95vw",
    height: "95vh",
    overflow: "auto",
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    boxShadow: "0 0 15px rgba(0,0,0,0.7)",
    padding: 20,
  },
  matchWrapper: {
    borderRadius: 8,
    border: "1px solid #444",
    backgroundColor: "#272727",
    padding: 8,
    margin: "6px 0",
    boxShadow: "inset 0 0 6px rgba(255,255,255,0.1)",
  },
  matchName: {
    fontWeight: "600",
    color: "#ddd",
    marginBottom: 6,
    fontSize: 14,
    whiteSpace: "normal",
    wordBreak: "break-word",
    maxWidth: 200,
  },
  loadingText: {
    color: "#ccc",
    fontSize: 18,
    textAlign: "center",
    marginTop: 40,
  },
};

export default BracketComponent;
