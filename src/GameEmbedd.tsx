import { useEffect, useState } from "react";
import {
  addNewScore,
  deleteScore,
  listenToLeaderboard,
} from "./services/LeaderboardServices";
import { LeaderboardEntry } from "./model/LeaderboardInterfaces";

export const GameEmbed = () => {
  const [score, setScore] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState<string>("");

  useEffect(() => {
    const readScoreFromSessionStorage = () => {
      const storedScore = sessionStorage.getItem("gameScore");
      if (storedScore !== null) {
        setScore(parseInt(storedScore));
      }
    };

    readScoreFromSessionStorage();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "gameScore") {
        readScoreFromSessionStorage();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    const unsubscribe = listenToLeaderboard(setLeaderboard);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      unsubscribe();
    };
  }, []);

  const sanitizeName = (name: string): string => {
    return name.replace(/<\/?[^>]+(>|$)/g, "").trim();
  };

  const validateName = (name: string): boolean => {
    return name.length > 0 && name.length <= 8;
  };

  const validateScore = (score: number): boolean => {
    return Number.isInteger(score) && score >= 0;
  };

  const handleSubmitScore = async () => {
    if (score !== null && playerName.trim()) {
      const sanitizedPlayerName = sanitizeName(playerName);
      if (validateName(sanitizedPlayerName) && validateScore(score)) {
        try {
          const canSubmitScore = checkLeaderboard(score);
          if (canSubmitScore) {
            if (leaderboard.length === 10) {
              const lowestScoreEntry = leaderboard.reduce((prev, curr) =>
                prev.highscore < curr.highscore ? prev : curr
              );
              await deleteScore(lowestScoreEntry.id);
            }
            await addNewScore(sanitizedPlayerName, score);
            sessionStorage.removeItem("gameScore");
            setScore(0);
            setPlayerName("");
            console.log("Poäng inlagd och sessionStorage rensad.");
          } else {
            console.log("Din poäng är för låg för leaderboarden.");
          }
        } catch (error) {
          console.error("Error adding score: ", error);
        }
      } else {
        console.error("Invalid name or score.");
      }
    } else {
      console.error("Score or player name is missing.");
    }
  };

  const checkLeaderboard = (currentScore: number): boolean => {
    if (leaderboard.length < 10) {
      return true;
    }
    const isHigher = leaderboard.some(
      (entry) => currentScore > entry.highscore
    );
    return isHigher;
  };

  return (
    <div className="main-container">
      <div className="game-row">
        <iframe
          src="/game/SBRun.html"
          title="Game"
          style={{ width: "1024px", height: "600px", border: "none" }}
        />

        <div className="leader-board">
          <section>
            <h2>Leaderboard</h2>
            <ul>
              {leaderboard.map((entry, index) => (
                <li key={entry.id}>
                  <div className="entry">
                    <span>
                      {index + 1}. {entry.name}
                    </span>
                    <span>{entry.highscore}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          {score && score !== 0 ? (
            <section className="submit-score">
              <h2>Your Score</h2>
              <span>{score}</span>
            </section>
          ) : null}
        </div>
      </div>
      <div className="input-submit">
        {score && score !== 0 && checkLeaderboard(score) ? (
          <section>
            <p>
              Congratulations! You scored enough points to make it to the
              leaderboard.
            </p>
            <p>Please enter your name (maximum 8 letters).</p>
            <div className="input-col">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              <button
                onClick={handleSubmitScore}
                disabled={!playerName || score === null}
              >
                Submit Score
              </button>
            </div>
          </section>
        ) : (
          <div className="text-column">
            <p>Swim by pressing spacebar</p>
            <p>Use arrow left and right to avoid dangers</p>
            <p>Collect litter and gather points to compete for the top 10</p>
            <p>Don't forget to get some fresh air from time to time!</p>
          </div>
        )}
      </div>
    </div>
  );
};
