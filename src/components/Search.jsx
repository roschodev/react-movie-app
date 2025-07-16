import React from 'react'

function Search({searchTerm, setSearchTerm}) {
    return (
        <div className="search">
            <div>
                <img src ="./search.svg" alt="Search"/>
                <input placeholder = "Search through thousands of movies!" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
        </div>
    )
}

export default Search
