import React from "react";

function Search({ searchTerm, setSearchTerm }) {
  return (
    <div className="search animate-fade-in-up">
      <div>
        <img 
          src="search.svg" 
          alt="svg" 
          className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-5"
        />
        <input
          type="text"
          placeholder="Search through thousands of manga"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="transition-all duration-300 focus:text-white"
        />
      </div>
    </div>
  );
}

export default Search;
