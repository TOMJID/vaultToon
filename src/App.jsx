import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import Search from "./components/Search";
import LatestMangaFeed from "./components/MangaFeed";
import MangaDetail from "./components/MangaDetail";

function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <main className="animate-fade-in">
      <div className="pattern">
        <div className="wrapper">
          <header>
            <img src="./hero.png" alt="hero banner" className="animate-float" />
            <h1 className="transition-all duration-500 hover:scale-105">
              Find <span className="text-gradient animate-pulse-glow">Manga</span> You'll Enjoy
            </h1>
          </header>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>
        <LatestMangaFeed searchTerm={debouncedSearchTerm} />
      </div>
    </main>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/manga/:id" element={<MangaDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
