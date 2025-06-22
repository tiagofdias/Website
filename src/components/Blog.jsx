import React, { useState, useEffect, useCallback } from "react";
import { styles } from "../styles";
import { SectionWrapper } from "../hoc";

const API_URL = import.meta.env.VITE_API_URL;

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

const Blog = () => {
  const [showAll, setShowAll] = useState(false);
  const [articles, setArticles] = useState([]);

  // Add useEffect to fetch articles
  useEffect(() => {
    fetch(`${API_URL}/articles`)
      .then((res) => res.json())
      .then((data) => {
        // Filter enabled articles and sort by order
        const enabledArticles = data
          .filter(article => article.enabled)
          .sort((a, b) => a.order - b.order);
        setArticles(enabledArticles);
      })
      .catch((err) => console.error("Failed to fetch articles:", err));
  }, []);

  const visibleArticles = showAll ? articles : articles.slice(0, 4);

  const handleArticleClick = useCallback((url) => {
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














