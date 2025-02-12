import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { articles } from "../constants";
import Modal from "./Modal"; // Import your Modal component

const Blog = () => {
  const [showAll, setShowAll] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [modalContent, setModalContent] = useState("");

  const visibleArticles = showAll ? articles : articles.slice(0, 4);

  useEffect(() => {
    if (selectedArticle && selectedArticle.contentFile) {
      const fetchContent = async () => {
        try {
          const response = await fetch(selectedArticle.contentFile);
          if (!response.ok) throw new Error("Network response was not ok");
          const text = await response.text();
          setModalContent(text);
        } catch (error) {
          setModalContent("Error loading content.");
        }
      };
      fetchContent();
    }
  }, [selectedArticle]);

  useEffect(() => {
    document.body.style.overflow = selectedArticle ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedArticle]);

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
            <div
              key={index}
              className="flex flex-col gap-2 hover:opacity-75 cursor-pointer"
              onClick={() => {
                setSelectedArticle(article);
                setModalContent(""); // Clear previous content
              }}
            >
              {article.image ? (
                <div className="relative rounded-md overflow-hidden aspect-video mb-4">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="absolute inset-0 object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="bg-muted rounded-md aspect-video mb-4"></div>
              )}
              <h3 className="text-xl tracking-tight">{article.title}</h3>
            </div>
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

      {/* Modal Preview via React Portal */}
      {selectedArticle && (
        <Modal onClose={() => setSelectedArticle(null)}>
          <h2 className="text-3xl font-bold mb-4">{selectedArticle.title}</h2>
          <div className="markdown-content text-base leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkBreaks]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-4xl font-bold mt-4 mb-2" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-3xl font-semibold mt-3 mb-2" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-2xl font-medium mt-3 mb-2" {...props} />
                ),
                h4: ({ node, ...props }) => (
                  <h4 className="text-xl font-medium mt-2 mb-1" {...props} />
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 space-y-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 space-y-2">{children}</ol>
                ),
                li: ({ children }) => <li className="mb-1">{children}</li>,
              }}
            >
              {modalContent || "Loading..."}
            </ReactMarkdown>
          </div>
        </Modal>
      )}
    </>
  );
};

export default SectionWrapper(Blog, "blog");














