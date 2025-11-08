import { useState } from "react";
import Search from "./components/Search";
import MangaFeed from "./components/MangaFeed";
import LatestMangaFeed from "./components/MangaFeed";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  return (
    <main>
      <div className="pattern">
        <div className="wrapper">
          <header>
            <img src="./hero.png" alt="hero banner" />
            <h1>
              Find <span className="text-gradient">Manga</span> You'll Enjoy
            </h1>
          </header>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <h1> {searchTerm} </h1>
        </div>
        <LatestMangaFeed />
      </div>
    </main>
  );
}

export default App;
