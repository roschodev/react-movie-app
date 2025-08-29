import {useEffect, useState} from 'react'
import './App.css'
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import search from "./components/Search.jsx";
import {useDebounce} from "react-use";
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";
import SideBar from './components/SideBar.jsx';
import { FaBuffer, FaBrain, FaCalendar, FaAddressBook, FaAddressCard } from 'react-icons/fa';

const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
    method: "GET",
    apiKey: API_KEY,
    headers: {
        accept: "application/json",
        Authorization: `Bearer ${API_KEY}`
    }
}
//bg-color-number
const globalIconBgColor = "bg-gray-900";
//hover:bg-color-number
const globalHoverColor = "hover:bg-gray-800";
//text-color-number
const globalIconColor = "text-purple-400";
//bg-color-number
const barColor = "bg-gray-900";
//mt-number
const iconSpacing = "mt-0";

const iconSize = "w-12 h-12"; // Adjust icon size as needed

const sizeMatch = iconSize.match(/w-(\d+)/);
const baseSize = sizeMatch ? parseInt(sizeMatch[1], 10) : 6; // default fallback
const dividedSize = baseSize / 3; // ➝ 2
const dividedSizeRem = `${dividedSize * 0.25}rem`;  // e.g., 2 → 0.5rem

const sidebarItems = [
   { icon: <FaBuffer size={dividedSizeRem} />, 
    tooltip: 'Bottom Icon', 
    iconColor: globalIconColor, 
    index: 0, 
    groupIndex: 0, 
    iconBgColor: globalIconBgColor, 
    hoverColor: globalHoverColor,
    iconSize: iconSize

  },
   { icon: <FaBrain size={dividedSizeRem}/>, 
    tooltip: 'Bottom Icon', 
    iconColor: globalIconColor, 
    index: 1, 
    groupIndex: 0, 
    iconBgColor: globalIconBgColor, 
    hoverColor: globalHoverColor,
    iconSize: iconSize 
  },
   { icon: <FaCalendar size={dividedSizeRem} />, 
    tooltip: 'Bottom Icon', 
    iconColor: globalIconColor, 
    index: 2, 
    groupIndex: 0, 
    iconBgColor: globalIconBgColor, 
    hoverColor: globalHoverColor,
    iconSize: iconSize
  },
  { icon: <FaAddressBook size={dividedSizeRem} />, 
    tooltip: 'Bottom Icon', 
    iconColor: globalIconColor, 
    index: 0, 
    groupIndex: 1, 
    iconBgColor: globalIconBgColor, 
    hoverColor: globalHoverColor,
    iconSize: iconSize 
  },
  { icon: <FaAddressCard size={dividedSizeRem}/>, 
    tooltip: 'Bottom Icon', 
    iconColor: globalIconColor, 
    index: 1, 
    groupIndex: 1, 
    iconBgColor: globalIconBgColor, 
    hoverColor: globalHoverColor,
    iconSize: iconSize
  },
];

const App = () => {
    const [searchTerm, setSearchTerm] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [movieList, setMovieList] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
    const [trendingMovies, setTrendingMovies] = useState([])

    useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

    const fetchMovies = async ({query = ''}) => {
        setIsLoading(true);
        setErrorMessage("");
        try {
            const endpoint = query ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}` : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
            const response = await fetch(endpoint, API_OPTIONS)
            if (!response.ok){
                throw new Error("Error")
            }
            const data = await response.json()

            setMovieList(data.results || [])
            if(query && data.results.length > 0){
                await updateSearchCount(query, data.results[0])
            }
        }
        catch(error) {
            setErrorMessage(`Error Fetching movies: ${error.message}`)
        }
        finally {
            setIsLoading(false)
        }
    }

    const loadTrendingMovies = async () => {
        try
        {
            const movies = await getTrendingMovies();
            setTrendingMovies(movies);

        } catch(error)
        {
            console.log(error)
        }
    }

    useEffect(() => {
        fetchMovies({query: debouncedSearchTerm});
    }, [debouncedSearchTerm]);

    useEffect(() => {
       loadTrendingMovies()
    },[]);

    console.log(trendingMovies.length)

    return(
        <main>
            <div className="pattern"/>
            <div className="wrapper">
                <header>
                    <img src="./hero-img.png" alt="Hero Banner" />
                    <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle</h1>
                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>

                {trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2>Trending Movies</h2>
                        
                        <ul>
                            {trendingMovies.map((movie, index) => (
                                <li key={movie.$id}>
                                    <p>{index + 1}</p>
                                    <img src={movie.poster_url} alt={movie.title} />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className="all-movies">
                    <h2>All Movies</h2>
                   
                    {isLoading ? (
                        <Spinner />
                    ) : errorMessage ? (
                        <p className="text-red-500">{errorMessage}</p>
                    ) : (
                        <ul>
                            {movieList.map((movie) => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    )
}

export default App