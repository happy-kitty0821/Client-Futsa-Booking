import React, { useState } from "react";
import { useQuery, useMutation } from "react-query";
import axios from "axios";
import Swal from "sweetalert2";
import { Calendar, CheckCircle, Eye, X, Search, MapPin } from "lucide-react";
import BracketComponent from "../components/TournamentBracket";

// TagInput component for team members input with max 7 members validation
const TagInput = ({ tags, setTags }) => {
  const [input, setInput] = useState("");

  const addTag = () => {
    const newTag = input.trim();
    if (!newTag) return;
    if (tags.length >= 7) {
      Swal.fire({
        icon: "warning",
        title: "Limit reached",
        text: "You can add up to 7 team members only.",
      });
      setInput("");
      return;
    }
    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setInput("");
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="border rounded p-2 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <div
          key={tag}
          className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full flex items-center gap-1"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-blue-900 hover:text-blue-700"
          >
            &times;
          </button>
        </div>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add member and press Enter"
        className="flex-grow p-1 outline-none"
      />
    </div>
  );
};

const TournamentPage = () => {
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});
  const [showingTeamsFor, setShowingTeamsFor] = useState(null);
  const [showingTieSheetFor, setShowingTieSheetFor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const TOURNAMENTS_PER_PAGE = 6;

  const fetchTournaments = async () => {
    const res = await axios.get("http://localhost:5000/api/tournaments/upcoming");
    return res.data.filter((t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const { data: tournaments = [], refetch } = useQuery(
    ["upcomingTournaments", searchTerm],
    fetchTournaments
  );

  const fetchUserRegistrations = async () => {
    const res = await axios.get("http://localhost:5000/api/tournaments/my-registrations", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return res.data;
  };

  const { data: registrations = [] } = useQuery("userRegistrations", fetchUserRegistrations);

  const registeredIds = registrations.map((r) => r.tournament_id);

  const mutation = useMutation(
    (data) =>
      axios.post("http://localhost:5000/api/tournaments/register-team", data, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }),
    {
      onSuccess: () => {
        Swal.fire({
          icon: "success",
          title: "Team registered!",
          text: "Your team has been successfully registered.",
          timer: 2000,
          showConfirmButton: false,
        });
        setTeamName("");
        setMembers([]);
        setSelectedTournament(null);
        refetch();
      },
      onError: (err) => {
        Swal.fire({
          icon: "error",
          title: "Registration failed",
          text: err.response?.data?.message || "Something went wrong.",
        });
      },
    }
  );

  const handleViewTeams = async (tournament) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/tournaments/${tournament.id}/teams`
      );
      const sortedTeams = res.data.sort((a, b) =>
        a.team_name.localeCompare(b.team_name)
      );
      setTeamsMap((prev) => ({ ...prev, [tournament.id]: sortedTeams }));
      setShowingTeamsFor(tournament.id);
      setShowingTieSheetFor(null);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch teams for this tournament.",
      });
    }
  };

  const totalPages = Math.ceil(tournaments.length / TOURNAMENTS_PER_PAGE);
  const paginatedTournaments = tournaments.slice(
    (page - 1) * TOURNAMENTS_PER_PAGE,
    page * TOURNAMENTS_PER_PAGE
  );

  const handleRegister = (e) => {
    e.preventDefault();
    if (!selectedTournament) return;

    const teamsRegistered = teamsMap[selectedTournament.id]?.length || 0;
    if (teamsRegistered >= selectedTournament.max_teams) {
      Swal.fire({
        icon: "error",
        title: "Tournament Full",
        text: "Maximum number of teams registered for this tournament.",
      });
      return;
    }

    if (members.length === 0) {
      Swal.fire({
        icon: "error",
        title: "No members",
        text: "Please add at least one team member.",
      });
      return;
    }

    mutation.mutate({
      tournament_id: selectedTournament.id,
      team_name: teamName,
      members: members.join(","),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-100 py-10 px-6">
      <h1 className="text-4xl font-bold text-center text-blue-800 mb-10">
        🏆 Upcoming Tournaments
      </h1>

      <div className="max-w-4xl mx-auto mb-6 flex items-center gap-2">
        <Search className="w-6 h-6 text-gray-600" />
        <input
          type="search"
          placeholder="Search tournaments..."
          className="flex-grow p-2 border rounded"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {paginatedTournaments.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5 border"
          >
            <h2 className="text-xl font-bold text-green-800 mb-2">{t.name}</h2>
            <p className="text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(t.start_date).toLocaleDateString()} –{" "}
              {new Date(t.end_date).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Court Name: {t.court_name}
            </p>
            <p className="text-sm text-gray-500 mb-2">Max Teams: {t.max_teams}</p>
            <p className="text-sm text-gray-500 mb-4">Status: {t.status}</p>

            {registeredIds.includes(t.id) ? (
              <p className="text-green-600 font-semibold flex items-center gap-1">
                <CheckCircle className="h-5 w-5" />
                Already Registered
              </p>
            ) : teamsMap[t.id] && teamsMap[t.id].length >= t.max_teams ? (
              <p className="text-red-600 font-semibold">Tournament Full</p>
            ) : (
              <button
                onClick={() => setSelectedTournament(t)}
                className="px-4 py-2 bg-blue-600 text-white rounded mt-2"
              >
                Register Team
              </button>
            )}

            <button
              onClick={() => handleViewTeams(t)}
              className="mt-2 px-3 py-1 border border-gray-400 rounded hover:bg-gray-100 flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              View Teams
            </button>

            <button
              onClick={() =>
                setShowingTieSheetFor(showingTieSheetFor === t.id ? null : t.id)
              }
              className="mt-2 px-3 py-1 border border-gray-400 rounded hover:bg-gray-100 flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              {showingTieSheetFor === t.id ? "Hide Tie Sheet" : "View Tie Sheet"}
            </button>

            {showingTeamsFor === t.id && (
              <div className="mt-4 bg-gray-50 p-3 rounded border text-sm">
                <h3 className="font-semibold mb-2">Registered Teams</h3>
                {teamsMap[t.id]?.length ? (
                  <ul className="list-disc pl-5">
                    {teamsMap[t.id].map((team, index) => (
                      <li key={team.id ?? `team-${index}`}>{team.team_name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No teams registered yet.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="max-w-7xl mx-auto flex justify-center gap-4 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded border ${
                page === i + 1 ? "bg-blue-600 text-white" : ""
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {selectedTournament && (
        <form
          onSubmit={handleRegister}
          className="mt-10 max-w-xl mx-auto bg-white shadow-lg rounded-lg p-6 border"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-700">
              Register for {selectedTournament.name}
            </h2>
            <button
              onClick={() => setSelectedTournament(null)}
              type="button"
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <input
            type="text"
            name="team_name"
            placeholder="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
            required
          />

          <label className="mb-2 font-medium">Team Members</label>
          <TagInput tags={members} setTags={setMembers} />

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setSelectedTournament(null)}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading || !teamName || members.length === 0}
              className={`px-4 py-2 rounded text-white ${
                mutation.isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {mutation.isLoading ? "Registering..." : "Submit"}
            </button>
          </div>
        </form>
      )}

      {/* Fullscreen modal for Tie Sheet */}
      {showingTieSheetFor && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50"
          onClick={() => setShowingTieSheetFor(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-full max-h-full overflow-auto"
            style={{ width: "90vw", height: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Knockout Bracket</h3>
              <button
                className="text-red-600 hover:text-red-800 font-bold text-xl"
                onClick={() => setShowingTieSheetFor(null)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <BracketComponent tournamentId={showingTieSheetFor} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentPage;
