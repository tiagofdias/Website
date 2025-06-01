import React, { useState, useEffect } from "react";
import "react-vertical-timeline-component/style.min.css";
import { SectionWrapper } from "../hoc";

const API_URL = import.meta.env.VITE_API_URL;

const TimelineItem = ({ item }) => (
  <div className="bg-tertiary p-5 rounded-2xl relative shadow-lg">
    {/* Timeline Dot */}
    <div className="absolute top-5 left-[-34px] w-4 h-4 bg-cyan-500 rounded-full border-2 border-cyan-500"></div>

    {/* Date */}
    <p className="text-sm text-gray-400">{item.date}</p>

    {/* Title with Link */}
    <h3 className="text-white font-bold text-[18px]">
      {item.titleLink ? (
        <a
          href={item.titleLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-300 hover:text-cyan-500"
        >
          {item.title}
        </a>
      ) : (
        item.title
      )}
    </h3>
    <br />
    {/* Company Name with Link */}
    {item.company_name && (
      <p className="text-sm text-gray-400">
        {item.companyLink ? (
          <a
            href={item.companyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-500"
          >
            {item.company_name}
          </a>
        ) : (
          item.company_name
        )}
      </p>
    )}

    {/* Bullet Points */}
    {item.points?.length > 0 && (
      <ul className="text-sm text-secondary mt-2 space-y-2">
        {item.points.map((point, idx) => (
          <li key={idx} className="flex items-start">
            <span className="mr-2 text-cyan-500">•</span>
            {point.text}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const TimelineSection = ({ items, sectionTitle }) => (
  <div className="mb-8">
    <h2 className="text-4xl font-bold text-white mb-4">{sectionTitle}</h2>
    <div className="relative border-l-4 border-cyan-500 pl-6 space-y-6">
      {items.map((item, index) => (
        <TimelineItem key={index} item={item} />
      ))}
    </div>
  </div>
);

const Timeline = () => {
  const [showAll, setShowAll] = useState(false);
  const [education, setEducation] = useState([]);
  const [proexp, setProexp] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/education`)
      .then((res) => res.json())
      .then((data) => setEducation(data))
      .catch((err) => console.error("Failed to fetch education:", err));

    fetch(`${API_URL}/proexp`)
      .then((res) => res.json())
      .then((data) => setProexp(data))
      .catch((err) => console.error("Failed to fetch proexp:", err));
  }, []);

  // If "View All" hasn't been clicked, render only the button.
  if (!showAll) {
    return (
      <div className="flex justify-center mt-10">
        <button
          onClick={() => setShowAll(true)}
          className="bg-tertiary transition-transform duration-300 transform hover:scale-110 outline-none shadow-md shadow-primary text-white font-bold py-2 w-[1000px] rounded-3xl"
        >
          View All
        </button>
      </div>
    );
  }

  // Once "View All" is clicked, render both timeline sections.
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <TimelineSection items={education} sectionTitle="Education" />
      <TimelineSection items={proexp} sectionTitle="Experience" />
    </div>
  );
};

export default SectionWrapper(Timeline, "work");

