import React, { useState, useEffect, useCallback, useRef } from "react";
import { styles } from "../styles";
import { SectionWrapper } from "../hoc";

// Memoized Article Card
const ArticleCard = React.memo(function ArticleCard({ article, onClick }) {
  return (
    <div
      className="flex flex-col gap-2 hover:opacity-75 cursor-pointer"
      onClick={onClick}
    >
      {article.image_url ? ( 
        <div className="relative rounded-md overflow-hidden aspect-video mb-4">
          <img
            src={article.image_url} 
            alt={article.title}
            className="absolute inset-0 object-cover w-full h-full"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="bg-muted rounded-md aspect-video mb-4"></div>
      )}
      <h3 className="text-xl tracking-tight">{article.title}</h3>
    </div>
  );
});

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST;
const MEDIUM_USER_ID = import.meta.env.VITE_MEDIUM_USER_ID;
const API_URL = import.meta.env.VITE_API_URL;

const Blog = () => {
  const [showAll, setShowAll] = useState(false);
  const [articles, setArticles] = useState([]);
  const mediumApiCallCount = useRef(0); // Counter for Medium API calls

  // Helper to log and increment counter
  const logMediumApiCall = (endpoint) => {
    mediumApiCallCount.current += 1;
    console.log(
      `[Medium API Call #${mediumApiCallCount.current}] Endpoint: ${endpoint}`
    );
  };

  // Fetch Medium article IDs from RapidAPI (using associated_articles)
  const fetchMediumArticleIds = async () => {
    logMediumApiCall(`/user/${MEDIUM_USER_ID}/articles`);
    const res = await fetch(
      `https://medium2.p.rapidapi.com/user/${MEDIUM_USER_ID}/articles`,
      {
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": RAPIDAPI_HOST,
        },
      }
    );
    const data = await res.json();
    return data.associated_articles || [];
  };

  // Fetch local article IDs from your backend
  const fetchLocalArticleIds = async () => {
    const res = await fetch(`${API_URL}/articles`);
    const data = await res.json();
    return data.map((article) => article.articleid);
  };

  // Fetch full article info from RapidAPI
  const fetchMediumArticleInfo = async (articleId) => {
    logMediumApiCall(`/article/${articleId}`);
    const res = await fetch(
      `https://medium2.p.rapidapi.com/article/${articleId}`,
      {
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": RAPIDAPI_HOST,
        },
      }
    );
    return await res.json();
  };

  // When saving a new article, set its order to the end (or however you want to define it)
  const saveArticleToBackend = async (article) => {
    // Fetch current articles to determine the next order value
    const res = await fetch(`${API_URL}/articles`);
    const data = await res.json();
    const maxOrder = data.reduce((max, a) => Math.max(max, a.order || 0), 0);

    await fetch(`${API_URL}/articles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...article,
        order: maxOrder + 1, // Set order to last
      }),
    });
  };

  // Main effect to sync Medium articles with local DB and display
  useEffect(() => {
    let ignore = false;

    const syncArticles = async () => {
      // 1. Get all Medium article IDs from associated_articles
      const mediumIds = await fetchMediumArticleIds();

      // 2. Get all local article IDs
      const localIds = await fetchLocalArticleIds();

      // 3. Find missing IDs
      const missingIds = mediumIds.filter((id) => !localIds.includes(id));

      // 4. For each missing ID, fetch and save to backend
      for (const id of missingIds) {
        // Double-check to avoid duplicates (in case of race conditions)
        if (localIds.includes(id)) continue;
        const info = await fetchMediumArticleInfo(id);
        // Only save if info is valid
        if (info && info.id && info.title && info.url) {
          await saveArticleToBackend({
            articleid: info.id,
            title: info.title,
            url: info.url, 
            image_url: info.image_url, 
          });
        }
      }

      // 5. Fetch all articles from backend to display (already sorted by order)
      const res = await fetch(`${API_URL}/articles`);
      const data = await res.json();
      if (!ignore) setArticles(data);
    };

    syncArticles();

    return () => {
      ignore = true;
    };
  }, []);

  // Remove the reverse logic, since backend now returns sorted by order
  const visibleArticles = showAll ? articles : articles.slice(0, 4);

  const handleArticleClick = useCallback((url) => { // <-- use url
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, []);

  return (
    <>
      {/* Header */}
      <div>
        <h2 className={`${styles.sectionHeadText}`}>Blog.</h2>
      </div>
      <div className="w-full flex">
        <p className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]">
          {showAll ? "All articles" : "Latest articles"}
        </p>
      </div>
      <br />

      {/* Articles Grid */}
      <div className="container mx-auto flex flex-col gap-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {visibleArticles.map((article, index) => (
            <ArticleCard
              key={index}
              article={article}
              onClick={() => handleArticleClick(article.url)}
            />
          ))}
        </div>

        {/* "View All" Button */}
        {!showAll && articles.length > 4 && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowAll(true)}
              className="bg-tertiary transition-transform duration-300 transform hover:scale-110 hover:bg-[#00C6FE] outline-none shadow-md shadow-primary text-white font-bold py-2 w-[1000px] rounded-3xl"
            >
              View all Articles
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default SectionWrapper(Blog, "blog");














