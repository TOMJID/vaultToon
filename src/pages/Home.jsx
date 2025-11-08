import { useState, useEffect } from "react";
import Search from "../components/Search";
import LatestMangaFeed from "../components/MangaFeed";
function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Clear search when navigating to home via logo click
  useEffect(() => {
    const handleClearSearch = () => {
      setSearchTerm("");
    };

    window.addEventListener("clearSearch", handleClearSearch);
    return () => {
      window.removeEventListener("clearSearch", handleClearSearch);
    };
  }, []);

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <main className="animate-fade-in">
      <div className="pattern -mt-20">
        <div className="wrapper pt-20">
          <header>
            <img src="./hero.png" alt="hero banner" className="animate-float" />
            <h1 className="transition-all duration-500 hover:scale-105">
              Find{" "}
              <span className="text-gradient animate-pulse-glow">Manga</span>{" "}
              You'll Enjoy
            </h1>
          </header>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>
        <LatestMangaFeed searchTerm={debouncedSearchTerm} />
      </div>
    </main>
  );
}
export default Home;
