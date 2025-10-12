import React from "react";

function Search({ searchTerm, setSearchTerm }) {
  return (
    <>
      <div className="search">
        <div>
          <img src="search.svg" alt="svg" />
          <input
            type="text"
            placeholder="Search through thousands of manga"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}

export default Search;
