import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import useIsMobile from "../utils/useIsMobile";
import { fallbackArticles } from "../data/fallbackData";

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Memoized Article Card
const ArticleCard = React.memo(function ArticleCard({ article, onClick, index, isMobile }) {
  return (
    <motion.div
      initial={isMobile ? {} : { opacity: 0, y: 30 }}
      whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={isMobile ? {} : { y: -6, scale: 1.02 }}
      className="group flex flex-col gap-1.5 cursor-pointer backdrop-blur-md bg-white/5 border border-white/10 hover:border-purple-400/50 rounded-2xl overflow-hidden shadow-2xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300"
      onClick={onClick}
    >
      {article.image_url ? ( 
        <div className="relative rounded-t-2xl overflow-hidden aspect-video">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <img
            src={article.image_url} 
            alt={article.title}
            className="absolute inset-0 object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          {/* Read more badge */}
          <div className="absolute top-2.5 right-2.5 z-20 bg-gradient-to-r from-purple-500 to-[#00C6FE] text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
            Read More →
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-purple-500/20 to-[#00C6FE]/20 rounded-t-2xl aspect-video flex items-center justify-center">
          <svg className="w-12 h-12 text-[#00C6FE]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      )}
      <div className="p-3 sm:p-3.5">
        <h3 className="text-xs sm:text-sm lg:text-[14px] font-bold tracking-tight text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-[#00C6FE] group-hover:bg-clip-text transition-all duration-300 leading-snug line-clamp-2">
          {article.title}
        </h3>
        {/* Animated underline */}
        <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-purple-500 to-[#00C6FE] transition-all duration-300 mt-1.5" />
      </div>
    </motion.div>
  );
});

const Blog = () => {
  const isMobile = useIsMobile();
  const [showAll, setShowAll] = useState(false);
  const [articles, setArticles] = useState(fallbackArticles);

  // Add useEffect to fetch articles
  useEffect(() => {
    fetch(`${API_URL}/articles`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const enabledArticles = data
            .filter(article => article.enabled)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          if (enabledArticles.length > 0) {
            setArticles(enabledArticles);
          }
        }
      })
      .catch(() => {
        // Fallback data already loaded
      });
  }, []);

  const visibleArticles = showAll ? articles : articles.slice(0, 4);

  const handleArticleClick = useCallback((url) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, []);

  return (
    <div className="relative">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#00C6FE]/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, -50, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {/* Header */}
      <motion.div
        initial={isMobile ? {} : { opacity: 0, y: -20 }}
        whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-4 sm:mb-6 lg:mb-4 xl:mb-6"
      >
        <h2 className="text-white font-black text-2xl xs:text-3xl sm:text-4xl lg:text-4xl xl:text-5xl">
          <span className="bg-gradient-to-r from-purple-500 to-[#00C6FE] bg-clip-text text-transparent">
            Blog
          </span>
        </h2>
        <motion.div
          initial={isMobile ? {} : { scaleX: 0 }}
          whileInView={isMobile ? {} : { scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="h-1 w-16 sm:w-20 bg-gradient-to-r from-purple-500 to-[#00C6FE] mx-auto mt-2 sm:mt-2.5 rounded-full"
        />
        <motion.p
          initial={isMobile ? {} : { opacity: 0 }}
          whileInView={isMobile ? {} : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-2 text-secondary text-xs sm:text-sm lg:text-base max-w-2xl mx-auto leading-relaxed px-2"
        >
          {showAll ? "All articles - Explore my thoughts and tutorials" : "Latest articles - Stay updated with my recent posts"}
        </motion.p>
      </motion.div>

      {/* Articles Grid */}
      <div className="container mx-auto flex flex-col gap-4 sm:gap-6 lg:gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-4 xl:gap-6">
          {visibleArticles.map((article, index) => (
            <ArticleCard
              key={index}
              article={article}
              index={index}
              isMobile={isMobile}
              onClick={() => handleArticleClick(article.url)}
            />
          ))}
        </div>

        {/* "View All" Button */}
        {!showAll && articles.length > 4 && (
          <motion.div 
            className="flex justify-center mt-3 sm:mt-5 lg:mt-4 xl:mt-6"
            initial={isMobile ? {} : { opacity: 0, y: 20 }}
            whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <motion.button
              onClick={() => setShowAll(true)}
              whileHover={isMobile ? {} : { scale: 1.05, x: 5 }}
              whileTap={isMobile ? {} : { scale: 0.95 }}
              className="group relative bg-gradient-to-r from-purple-500 to-[#00C6FE] hover:from-purple-500/90 hover:to-[#00C6FE]/90 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 outline-none text-white font-bold py-2.5 sm:py-3 px-6 sm:px-8 text-xs sm:text-sm rounded-full overflow-hidden"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              
              <span className="relative flex items-center gap-2">
                View All Articles
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SectionWrapper(Blog, "blog");














